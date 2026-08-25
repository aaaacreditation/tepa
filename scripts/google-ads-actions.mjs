#!/usr/bin/env node
/* Creates the Import conversion actions the pipeline stages report against,
   and wires up how each landing page's campaigns bid on them.

     npm run ads:actions                        TEPA: show what exists and what is missing
     npm run ads:actions -- --create            create the missing ones
     npm run ads:actions -- --source=clinic     work on a different landing page
     npm run ads:actions -- --source=clinic --campaigns=Clinic --create
                                                ...and point every campaign whose name
                                                contains "Clinic" at that page's goal

   Each landing page gets its own set of actions, so a campaign bids on the
   funnel it actually paid for rather than a pool shared with every other page.
   The app resolves them the same way: GOOGLE_ADS_ACTION_LEAD_CLINIC for /clinic,
   the unsuffixed GOOGLE_ADS_ACTION_LEAD for /tepa, and no fallback between them.

   Two different ways of steering bidding, and why
   -----------------------------------------------
   TEPA came first and its live campaigns use campaign level goals picked by
   category ("Submit lead form"). Google feeds every PRIMARY action in that
   category into their bidding, so for TEPA the primary_for_goal flag is the
   control: exactly one stage is primary at a time and the ladder is climbed by
   moving the flag (--primary).

   That same mechanism is what makes a second landing page dangerous. A
   "Clinic Enquiry" action created primary in the same category would be picked
   up by the TEPA campaigns the moment it existed, and TEPA would start
   optimising for clinic leads. So every other landing page is isolated the
   other way round: all of its actions stay SECONDARY, which keeps them out of
   every category goal in the account, and its campaigns are pointed at a
   custom conversion goal ("Clinic Funnel") holding the current rung. Google
   optimises for whatever is in a custom goal regardless of the primary flag,
   and nothing outside that goal can reach those campaigns. Both directions
   are sealed: TEPA never sees clinic actions, clinic campaigns never see
   TEPA's. --primary walks the ladder here too, by swapping the action the goal
   holds.

   Offline conversion imports can only be received by a conversion action of
   type UPLOAD_CLICKS. The account's older TEPA actions are type WEBPAGE, which
   fire from a browser on a thank you page and silently cannot accept an
   upload, so the stages need their own actions rather than reusing those.

   Matching is by name, so re-running never creates a duplicate.

   This talks to the Google Ads API, not Data Manager. Creating a conversion
   action or a goal is account administration and still lives there; only the
   conversion upload itself moved. That is why this script needs the developer
   token and the adwords scope, while the app at runtime needs neither. */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const API = "https://googleads.googleapis.com/v25";
const CREATE = process.argv.includes("--create");

/* Mirrors lib/sources.ts. The first entry keeps the unsuffixed variables it
   has always used, so an account set up before there was a second landing page
   needs no renaming.

   bidding: "primary" steers with the primary_for_goal flag (see the header);
   "custom-goal" keeps every action secondary and steers through a custom
   conversion goal assigned to the page's campaigns. */
const LANDING_PAGES = {
  tepa: { label: "TEPA", envSuffix: "", bidding: "primary" },
  healthcare: { label: "Healthcare", envSuffix: "_HEALTHCARE", bidding: "custom-goal" },
  clinic: { label: "Clinic", envSuffix: "_CLINIC", bidding: "custom-goal" },
};

const argValue = (flag) => {
  const found = process.argv.find((a) => a.startsWith(`${flag}=`));
  return found ? found.slice(flag.length + 1).trim() : "";
};

const SOURCE = (argValue("--source") || "tepa").toLowerCase();
if (!LANDING_PAGES[SOURCE]) {
  console.error(`\n--source must be one of: ${Object.keys(LANDING_PAGES).join(", ")}\n`);
  process.exit(1);
}
const PAGE = LANDING_PAGES[SOURCE];
const ISOLATED = PAGE.bidding === "custom-goal";
const GOAL_NAME = `${PAGE.label} Funnel`;

/* --primary=<stage> picks the one stage bidding optimises against and demotes
   the rest. For a "primary" page that is the primary_for_goal flag; for a
   "custom-goal" page it is which action the custom goal holds.

   Smart Bidding optimises against that one goal only, and needs roughly 30
   conversions a month to learn. A campaign that reports only customers gives it
   two or three delayed signals a month and it never leaves the learning phase,
   so the ladder is walked upward as volume allows: enquiry first, then mql,
   then sql, then customer. Every stage keeps reporting regardless, so the
   history is already there when the next one is promoted.

   Expect one to two weeks of unstable performance after each switch while
   bidding relearns, so do not climb the ladder more often than that. */
const PRIMARY_STAGE = argValue("--primary").toLowerCase();

/* --campaigns=<text>: campaigns whose name contains the text, case
   insensitive, are pointed at this page's custom goal. Only meaningful for a
   "custom-goal" page. Nothing is matched by default: pointing a campaign at a
   goal changes what it bids on, so it has to be asked for by name. */
const CAMPAIGN_MATCH = argValue("--campaigns");

loadEnv(".env.local");

const digits = (v) => (v ?? "").replace(/\D/g, "");
const clientId = (process.env.GOOGLE_ADS_CLIENT_ID ?? "").trim();
const clientSecret = (process.env.GOOGLE_ADS_CLIENT_SECRET ?? "").trim();
const refreshToken = (process.env.GOOGLE_ADS_REFRESH_TOKEN ?? "").trim();
const devToken = (process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "").trim();
const customerId = digits(process.env.GOOGLE_ADS_CUSTOMER_ID);
const loginCustomerId = digits(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);

const missing = [];
if (!clientId) missing.push("GOOGLE_ADS_CLIENT_ID");
if (!clientSecret) missing.push("GOOGLE_ADS_CLIENT_SECRET");
if (!refreshToken) missing.push("GOOGLE_ADS_REFRESH_TOKEN");
if (!devToken) missing.push("GOOGLE_ADS_DEVELOPER_TOKEN");
if (!customerId) missing.push("GOOGLE_ADS_CUSTOMER_ID");
if (missing.length) {
  console.error(`\nMissing in .env.local: ${missing.join(", ")}\n`);
  process.exit(1);
}

/* Values are the defaults the app falls back to, so the account and the code
   agree out of the box. alwaysUseDefaultValue stays false: the upload sends a
   per lead value and that must win over the account default. */
const STAGES = [
  {
    stage: "lead",
    suffix: "Enquiry",
    category: "SUBMIT_LEAD_FORM",
    /* The enquiry is worth nothing until it qualifies, so the later stages
       carry the value. Reporting it still matters: customers take weeks to
       close, and without this Google has almost no signal to learn from in
       the opening weeks of a campaign. */
    value: 0,
  },
  {
    stage: "mql",
    suffix: "MQL",
    category: "QUALIFIED_LEAD",
    value: 50,
  },
  {
    stage: "sql",
    suffix: "SQL",
    category: "QUALIFIED_LEAD",
    value: 250,
  },
  {
    stage: "customer",
    suffix: "Customer",
    category: "CONVERTED_LEAD",
    /* Where the ladder ends, once customer volume can sustain bidding on its
       own. For a high ticket service that may never happen, in which case sql
       is the sensible resting place. */
    value: 2000,
  },
];

/* Everything but the chosen stage stays out of bidding: observed and
   reported, but kept away from optimisation so the mid funnel does not pull
   bidding away from the goal that was picked. On an isolated page even the
   chosen stage stays secondary; the custom goal is what promotes it. */
const WANTED = STAGES.map((s) => ({
  ...s,
  envVar: `GOOGLE_ADS_ACTION_${s.stage.toUpperCase()}${PAGE.envSuffix}`,
  name: `${PAGE.label} ${s.suffix}`,
  primary: false,
}));

/* The stage bidding optimises against at the start. Overridden by --primary. */
const DEFAULT_PRIMARY = "lead";

if (PRIMARY_STAGE && !WANTED.some((w) => w.stage === PRIMARY_STAGE)) {
  console.error(`\n--primary must be one of: ${WANTED.map((w) => w.stage).join(", ")}\n`);
  process.exit(1);
}
if (CAMPAIGN_MATCH && !ISOLATED) {
  console.error(
    `\n--campaigns only applies to an isolated landing page; ${PAGE.label} bids through the primary flag.\n`,
  );
  process.exit(1);
}

const primaryStage = PRIMARY_STAGE || DEFAULT_PRIMARY;
for (const want of WANTED) want.primary = !ISOLATED && want.stage === primaryStage;

const token = await accessToken();

console.log(`\n${PAGE.label} conversion actions`);
console.log("=".repeat(46));
console.log(`Account: ${customerId}${loginCustomerId ? ` (via MCC ${loginCustomerId})` : ""}`);
console.log(
  ISOLATED
    ? `Bidding: custom goal "${GOAL_NAME}" (every action stays secondary)`
    : "Bidding: primary_for_goal flag (account category goals)",
);
console.log(`Primary goal: ${primaryStage}\n`);

/* ==========================================================================
   1. Conversion actions
   ========================================================================== */

const existing = await search(
  `SELECT conversion_action.id, conversion_action.name, conversion_action.type,
          conversion_action.status, conversion_action.primary_for_goal
   FROM conversion_action
   WHERE conversion_action.status != 'REMOVED'`,
);

const byName = new Map(
  existing.map((r) => [r.conversionAction.name, r.conversionAction]),
);

const resolved = {};
const toCreate = [];
const toRepoint = [];
let pending = false;

for (const want of WANTED) {
  const found = byName.get(want.name);
  if (!found) {
    toCreate.push(want);
    console.log(`MISSING  ${want.name}`);
    continue;
  }
  if (found.type !== "UPLOAD_CLICKS") {
    /* A name collision with a browser side action would be reported against
       something that cannot receive the upload, so refuse rather than adopt. */
    console.log(
      `CONFLICT ${want.name} exists but is type ${found.type}, not UPLOAD_CLICKS. Rename it in Google Ads.`,
    );
    continue;
  }
  resolved[want.envVar] = found.id;
  const isPrimary = Boolean(found.primaryForGoal);
  const label = want.primary ? "PRIMARY" : "secondary";
  if (isPrimary !== want.primary) {
    toRepoint.push({ id: found.id, name: want.name, primary: want.primary });
    console.log(
      `CHANGE   ${want.name.padEnd(20)} id ${found.id}  ${isPrimary ? "PRIMARY" : "secondary"} -> ${label}`,
    );
  } else {
    console.log(`EXISTS   ${want.name.padEnd(20)} id ${found.id}  ${label}`);
  }
}

/* Repointing which stage drives bidding is the whole point of walking the
   ladder, so it happens whether or not anything needs creating. */
if (toRepoint.length > 0) {
  if (!CREATE) {
    console.log(`\n${toRepoint.length} goal change(s) pending. Re-run with --create to apply.`);
    pending = true;
  } else {
    const ops = toRepoint.map((r) => ({
      update: {
        resourceName: `customers/${customerId}/conversionActions/${r.id}`,
        primaryForGoal: r.primary,
      },
      updateMask: "primaryForGoal",
    }));
    console.log("\nApplying goal changes...");
    await mutate("conversionActions", ops, true);
    await mutate("conversionActions", ops, false);
    for (const r of toRepoint) {
      console.log(`UPDATED  ${r.name.padEnd(20)} -> ${r.primary ? "PRIMARY" : "secondary"}`);
    }
    relearnNotice();
  }
}

if (toCreate.length > 0) {
  if (!CREATE) {
    console.log(`\n${toCreate.length} to create. Re-run with --create to make them:\n`);
    for (const w of toCreate) {
      console.log(
        `  ${w.name.padEnd(20)} Import / ${w.category} / $${w.value} / ${w.primary ? "Primary" : "Secondary"}`,
      );
    }
    pending = true;
  } else {
    /* Validate the whole batch before writing anything, so a rejected field
       cannot leave half the stages created. */
    const operations = toCreate.map((w) => ({
      create: {
        name: w.name,
        type: "UPLOAD_CLICKS",
        category: w.category,
        status: "ENABLED",
        primaryForGoal: w.primary,
        /* One organization accrediting is one conversion, not one per program. */
        countingType: "ONE_PER_CLICK",
        valueSettings: {
          defaultValue: w.value,
          defaultCurrencyCode: process.env.GOOGLE_ADS_CURRENCY || "USD",
          alwaysUseDefaultValue: false,
        },
      },
    }));

    console.log("\nValidating...");
    await mutate("conversionActions", operations, true);
    console.log("Validated. Creating...");
    const results = await mutate("conversionActions", operations, false);

    results.forEach((res, i) => {
      const id = String(res.resourceName).split("/").pop();
      resolved[toCreate[i].envVar] = id;
      console.log(`CREATED  ${toCreate[i].name.padEnd(20)} id ${id}`);
    });
  }
}

/* ==========================================================================
   2. Custom goal and campaigns (isolated pages only)
   ========================================================================== */

if (ISOLATED) {
  console.log(`\nCustom goal "${GOAL_NAME}"`);
  console.log("-".repeat(46));

  const rung = WANTED.find((w) => w.stage === primaryStage);
  const rungId = resolved[rung.envVar];

  const goals = await search(
    `SELECT custom_conversion_goal.id, custom_conversion_goal.name,
            custom_conversion_goal.status, custom_conversion_goal.conversion_actions
     FROM custom_conversion_goal
     WHERE custom_conversion_goal.status != 'REMOVED'`,
  );
  const goal = goals.map((r) => r.customConversionGoal).find((g) => g.name === GOAL_NAME);
  let goalResource = goal ? goal.resourceName : "";

  if (!rungId) {
    /* Without the action the goal has nothing to hold. Creation above fills
       resolved, so this only happens on a preview or after a CONFLICT. */
    console.log(
      CREATE
        ? `SKIPPED  ${rung.name} could not be resolved, so the goal was left alone.`
        : `${goal ? "CHANGE " : "MISSING"}  ${GOAL_NAME.padEnd(20)} holds ${rung.name} once it exists`,
    );
    pending = pending || !CREATE;
  } else {
    const wantedActions = [`customers/${customerId}/conversionActions/${rungId}`];
    const current = goal ? (goal.conversionActions ?? []) : [];
    const same =
      current.length === wantedActions.length && current.every((a) => wantedActions.includes(a));

    if (!goal) {
      if (!CREATE) {
        console.log(`MISSING  ${GOAL_NAME.padEnd(20)} would hold ${rung.name}`);
        pending = true;
      } else {
        const ops = [{ create: { name: GOAL_NAME, status: "ENABLED", conversionActions: wantedActions } }];
        await mutate("customConversionGoals", ops, true);
        const [res] = await mutate("customConversionGoals", ops, false);
        goalResource = res.resourceName;
        console.log(`CREATED  ${GOAL_NAME.padEnd(20)} ${goalResource.split("/").pop()}  holds ${rung.name}`);
      }
    } else if (!same) {
      const held = current.map((a) => nameOfAction(a)).join(", ") || "nothing";
      if (!CREATE) {
        console.log(`CHANGE   ${GOAL_NAME.padEnd(20)} holds ${held} -> ${rung.name}`);
        pending = true;
      } else {
        const ops = [
          {
            update: { resourceName: goal.resourceName, conversionActions: wantedActions },
            updateMask: "conversionActions",
          },
        ];
        await mutate("customConversionGoals", ops, true);
        await mutate("customConversionGoals", ops, false);
        console.log(`UPDATED  ${GOAL_NAME.padEnd(20)} holds ${rung.name}`);
        relearnNotice();
      }
    } else {
      console.log(`EXISTS   ${GOAL_NAME.padEnd(20)} ${goal.id}  holds ${rung.name}`);
    }
  }

  /* Campaigns. Listed whether or not the goal exists yet, so a preview shows
     the whole change in one pass, and so a campaign still on account default
     goals — which include TEPA's primary enquiry — is visible even when
     nothing is being changed. */
  console.log(`\nCampaigns`);
  console.log("-".repeat(46));

  const configs = await search(
    `SELECT campaign.id, campaign.name, campaign.status,
            conversion_goal_campaign_config.goal_config_level,
            conversion_goal_campaign_config.custom_conversion_goal
     FROM conversion_goal_campaign_config
     WHERE campaign.status != 'REMOVED'`,
  );

  const matcher = CAMPAIGN_MATCH.toLowerCase();
  const toAttach = [];
  let usingGoal = 0;

  for (const r of configs.sort((a, b) => a.campaign.name.localeCompare(b.campaign.name))) {
    const cfg = r.conversionGoalCampaignConfig;
    const onGoal = Boolean(goalResource) && cfg.customConversionGoal === goalResource;
    const matched = Boolean(matcher) && r.campaign.name.toLowerCase().includes(matcher);

    if (onGoal) {
      usingGoal += 1;
      console.log(`USES     ${describeCampaign(r.campaign)}`);
    } else if (matched) {
      toAttach.push(r.campaign);
      console.log(
        `CHANGE   ${describeCampaign(r.campaign)}  ${describeConfig(cfg)} -> "${GOAL_NAME}"`,
      );
    }
  }

  if (usingGoal === 0 && toAttach.length === 0) {
    console.log(
      `NONE     no campaign bids on "${GOAL_NAME}" yet.\n` +
        `         Re-run with --campaigns=<part of the campaign name> to point them at it.`,
    );
  }

  if (toAttach.length > 0) {
    if (!CREATE) {
      console.log(`\n${toAttach.length} campaign change(s) pending. Re-run with --create to apply.`);
      pending = true;
    } else if (!goalResource) {
      console.log(`\nGoal was not created, so the ${toAttach.length} campaign(s) were left alone.`);
    } else {
      const ops = toAttach.map((c) => ({
        update: {
          resourceName: `customers/${customerId}/conversionGoalCampaignConfigs/${c.id}`,
          customConversionGoal: goalResource,
        },
        updateMask: "customConversionGoal",
      }));
      console.log("\nPointing campaigns at the goal...");
      await mutate("conversionGoalCampaignConfigs", ops, true);
      await mutate("conversionGoalCampaignConfigs", ops, false);
      for (const c of toAttach) console.log(`UPDATED  ${describeCampaign(c)}`);
      console.log(
        `\nTo undo for a campaign: set its goal level back to account default in\n` +
          `Google Ads (campaign settings > Goals), or via the API with\n` +
          `goalConfigLevel=CUSTOMER on conversionGoalCampaignConfigs/<campaign id>.`,
      );
    }
  }
}

/* ==========================================================================
   3. Verify and report
   ========================================================================== */

if (CREATE) await verify();
report();
process.exit(0);

/* Re-read everything from the account rather than trusting the mutate
   responses: a change that did not land is worse than one that failed. */
async function verify() {
  console.log("\nVerifying against the account...");
  const actions = await search(
    `SELECT conversion_action.id, conversion_action.name, conversion_action.type,
            conversion_action.primary_for_goal
     FROM conversion_action
     WHERE conversion_action.status != 'REMOVED'`,
  );
  const byNameNow = new Map(actions.map((r) => [r.conversionAction.name, r.conversionAction]));
  let bad = 0;
  for (const want of WANTED) {
    const a = byNameNow.get(want.name);
    if (!a || a.type !== "UPLOAD_CLICKS" || Boolean(a.primaryForGoal) !== want.primary) {
      bad += 1;
      console.log(
        `MISMATCH ${want.name}: ${a ? `${a.type}, ${a.primaryForGoal ? "PRIMARY" : "secondary"}` : "missing"}`,
      );
    } else {
      resolved[want.envVar] = a.id;
    }
  }
  if (ISOLATED) {
    const goals = await search(
      `SELECT custom_conversion_goal.id, custom_conversion_goal.name,
              custom_conversion_goal.conversion_actions
       FROM custom_conversion_goal
       WHERE custom_conversion_goal.status != 'REMOVED'`,
    );
    const goal = goals.map((r) => r.customConversionGoal).find((g) => g.name === GOAL_NAME);
    if (goal) {
      const held = (goal.conversionActions ?? []).map((a) => nameOfAction(a, byNameNow)).join(", ");
      console.log(`OK       "${GOAL_NAME}" holds ${held || "nothing"}`);
      const configs = await search(
        `SELECT campaign.id, campaign.name, campaign.status,
                conversion_goal_campaign_config.custom_conversion_goal
         FROM conversion_goal_campaign_config
         WHERE campaign.status != 'REMOVED'`,
      );
      const using = configs.filter(
        (r) => r.conversionGoalCampaignConfig.customConversionGoal === goal.resourceName,
      );
      console.log(
        using.length
          ? `OK       bid on by ${using.map((r) => `${r.campaign.name} (${r.campaign.status})`).join(", ")}`
          : `NOTE     no campaign bids on "${GOAL_NAME}" yet`,
      );
    } else {
      bad += 1;
      console.log(`MISMATCH "${GOAL_NAME}" is missing`);
    }
  }
  console.log(bad ? `${bad} mismatch(es) — re-run and check the account.` : "Verified.");
}

function report() {
  const lines = WANTED.map((w) => `${w.envVar}=${resolved[w.envVar] ?? ""}`);
  console.log("\n" + "=".repeat(46));
  console.log("Paste into .env.local (and the server's .env):\n");
  for (const line of lines) console.log(line);
  console.log(pending ? "\nThen re-run with --create, then: npm run ads:check\n" : "\nThen: npm run ads:check\n");
}

function relearnNotice() {
  console.log(
    "\nSmart Bidding will relearn for one to two weeks. Expect unstable\n" +
      "performance in that window, and do not change the goal again inside it.",
  );
}

function describeCampaign(c) {
  return `${c.name.padEnd(36)} ${String(c.id).padEnd(12)} ${c.status}`;
}

function describeConfig(cfg) {
  if (cfg.customConversionGoal) return `custom goal ${cfg.customConversionGoal.split("/").pop()}`;
  return cfg.goalConfigLevel === "CAMPAIGN" ? "campaign level categories" : "account default goals";
}

/* Turns customers/x/conversionActions/y back into a name for the log. The
   map covers this page's actions plus anything read at startup. */
function nameOfAction(resourceName, map = byName) {
  const id = String(resourceName).split("/").pop();
  for (const a of map.values()) if (String(a.id) === id) return a.name;
  return `action ${id}`;
}

/* ------------------------------------------------------------- helpers */

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    console.error("\nOAuth failed:", JSON.stringify(body));
    process.exit(1);
  }
  return body.access_token;
}

function headers() {
  const h = {
    Authorization: `Bearer ${token}`,
    "developer-token": devToken,
    "Content-Type": "application/json",
  };
  if (loginCustomerId) h["login-customer-id"] = loginCustomerId;
  return h;
}

async function search(query) {
  const res = await fetch(`${API}/customers/${customerId}/googleAds:search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("\nQuery failed:", JSON.stringify(body).slice(0, 800));
    process.exit(1);
  }
  return body.results ?? [];
}

/* service is the REST collection: conversionActions, customConversionGoals or
   conversionGoalCampaignConfigs. Every call validates first (validateOnly)
   and only then writes, so a rejected field never leaves a half applied
   batch. */
async function mutate(service, operations, validateOnly) {
  const res = await fetch(`${API}/customers/${customerId}/${service}:mutate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ operations, validateOnly }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`\n${service} mutate failed:`, JSON.stringify(body).slice(0, 1200));
    process.exit(1);
  }
  return body.results ?? [];
}

function loadEnv(file) {
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, file), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
