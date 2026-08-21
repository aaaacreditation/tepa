/* Lead qualification.

   Over the 90 days to August 2026, 34 of 46 real TEPA leads were marked MQL —
   74%. A stage three quarters of leads pass carries almost no information, and
   Google Ads cannot bid on a signal that never varies: if MQL means roughly
   the same thing as "a form was submitted", Smart Bidding learns nothing from
   it that the lead conversion did not already say.

   This module gives MQL a definition, using only what the enquiry form already
   collects. An earlier revision asked the visitor three extra questions; they
   were removed because the form was too long, so everything below is derived
   from name, organization, email, website, country and message.

   The weights are not intuitions. They were fitted against the 46 real leads
   by measuring, for each signal, how much more likely a lead carrying it was
   to reach SQL or Customer:

     signal                     present   P(SQL+|sig)   P(SQL+|no)   lift
     email domain == website          9          33%           8%    4.1x
     org name has training vocab     22          18%           8%    2.2x
     provider language in message    11          18%          11%    1.6x
     website present                 43          14%           0%     inf
     free email                      31          10%          20%    0.5x
     long message                    12           8%          15%    0.6x
     wrote any message               38          13%          12%    1.1x

   Two of those contradict what one would guess, which is the reason for
   measuring rather than guessing:

   A long message is a mildly *negative* signal. The instinct is that someone
   who writes at length is engaged; in this data they are more often an
   individual explaining what they personally want. Message length is therefore
   not scored at all.

   Whether a message was written is worth nothing (1.1x). Only what it says
   counts.

   The strongest single predictor — an email on the same domain as the website —
   was not being scored at all before this. It is the cheapest proof that the
   sender belongs to the organization they named.

   No "server-only" import: this is pure logic with no database or node
   dependency, so the enquiry routes and any future dashboard-side preview can
   share it. */

export type QualificationTier = "disqualified" | "weak" | "qualified" | "strong";

export type Qualification = {
  /* 0-100. Meaningful only against the thresholds below — not a probability. */
  score: number;
  tier: QualificationTier;
  /* Rendered verbatim in the dashboard. Each line names one contribution so a
     reviewer who disagrees can see which signal to distrust, rather than
     arguing with a number. */
  reasons: string[];
};

/* Everything the scorer reads — all of it already on the form. Structured as a
   plain input rather than a LeadRow so the healthcare and clinic routes can
   adopt this unchanged. */
export type LeadInput = {
  fullName: string;
  organization: string;
  email: string;
  website: string;
  message: string;
  countryCode: string;
};

/* Consumer mailbox providers. Worth 0.5x on its own — real providers do use
   them — so this is a penalty, never a disqualifier by itself. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
  "hotmail.co.uk", "outlook.com", "live.com", "icloud.com", "me.com",
  "aol.com", "protonmail.com", "proton.me", "mail.com", "gmx.com", "yandex.com",
]);

/* Words that appear in the *name* of an organization that delivers training.
   "school" stays deliberately: beauty schools and trade schools are real
   customers, unlike the degree-granting institutions the ads negate. */
const ORG_VOCAB =
  /(academy|academi|institute|institut|training|centre|center|college|school|educat|learn|develop|consult|skill|coach|univers)/i;

/* Vocabulary a provider uses about its own operation. */
const PROVIDER_TERMS = [
  "program", "programme", "course", "curriculum", "trainer", "trainee",
  "learner", "accredit", "certif", "qualification", "cohort", "syllabus",
  "instructor", "faculty", "cpd", "ceu", "diploma", "workshop", "module",
];

/* Phrases that read as someone asking to *take* a course rather than to have
   one accredited. None of the 46 real leads matched these, so they cost
   nothing today; they are a guard against the wrong-fit traffic the campaigns
   are known to attract. */
const INDIVIDUAL_PHRASES = [
  "i want a certificate", "i need a certificate", "i want to get certified",
  "i want to be certified", "how do i enrol", "how do i enroll",
  "how can i enrol", "how can i enroll", "how to enrol", "how to enroll",
  "course fee", "tuition fee", "how much is the course", "i want to study",
  "i want to join", "i am a student", "i'm a student", "apply for admission",
  "admission requirement", "scholarship", "i want to take",
  "i would like to take", "looking for a course", "want to attend",
];

/* Weights are proportional to the measured lift, then scaled so a lead
   carrying every positive signal lands near 100. */
const W = {
  domainMatch: 35,   // 4.1x — the strongest predictor in the data
  orgVocab: 20,      // 2.2x
  corporateEmail: 18,
  hasWebsite: 15,    // every SQL had one; none of the three without converted
  providerLanguage: 10,
  countryGiven: 2,
} as const;

const P = {
  freeEmail: 12,
  noWebsite: 25,
  individualMessage: 30,
  orgIsOwnName: 10,
} as const;

/* Fitted by sweeping thresholds against the 46 real leads and reading the
   result, not by choosing round numbers:

     threshold   MQL rate   SQL+ caught   precision   lift over base
        25          54%        5 of 6        20%         1.5x
        30          35%        4 of 6        25%         1.9x   <- chosen
        35          28%        3 of 6        23%         1.8x
        45          24%        3 of 6        27%         2.1x

   30 is the best point inside the 30-50% target: it keeps two thirds of the
   leads that went on to reach SQL, at nearly twice the base rate of 13%.
   Pushing to 45 buys a little precision but drops the rate below target and
   loses another real SQL, which is the wrong trade for a signal whose job is
   to give Smart Bidding something that both varies and correlates.

   STRONG_AT sits on a real gap in the distribution — nothing scores 50-69 —
   so the split is a property of the data rather than a round number.

   If MQL drifts back above 70% once volume builds, raise QUALIFIED_AT before
   changing anything else: the rate is the symptom these thresholds control. */
const QUALIFIED_AT = 30;
const STRONG_AT = 70;

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at < 0 ? "" : email.slice(at + 1).trim().toLowerCase();
}

/* Reduced to a bare host so an email domain can be compared against it:
   "https://www.Meridian-Training.com/about" -> "meridian-training.com". */
function websiteHost(website: string): string {
  const bare = website.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  if (!bare || /\s/.test(bare)) return "";
  const host = bare.split("/")[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : "";
}

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export function scoreLead(lead: LeadInput): Qualification {
  const reasons: string[] = [];
  const disqualifiers: string[] = [];
  let score = 0;

  const domain = emailDomain(lead.email);
  const host = websiteHost(lead.website);
  const isFreeEmail = domain !== "" && FREE_EMAIL_DOMAINS.has(domain);
  const hasWebsite = host !== "";
  const message = normalize(lead.message);
  const org = normalize(lead.organization);
  const name = normalize(lead.fullName);

  /* ---- Hard disqualifiers -----------------------------------------------
     Set the tier outright rather than subtracting, so no accumulation of
     weaker positives can bury them. */

  if (isFreeEmail && !hasWebsite) {
    disqualifiers.push(
      `Personal email (${domain}) and no website — nothing here identifies a training provider.`,
    );
  }

  const individualPhrase = INDIVIDUAL_PHRASES.find((phrase) => message.includes(phrase));
  if (individualPhrase) {
    disqualifiers.push(
      `Message reads as someone wanting to take a course ("${individualPhrase}"). AAA accredits providers, not individuals.`,
    );
  }

  /* ---- Positive signals -------------------------------------------------- */

  /* The best evidence on the form that the sender belongs to the organization
     they named, and the strongest predictor measured. */
  if (hasWebsite && domain && domain === host) {
    score += W.domainMatch;
    reasons.push(`Email is on the organization's own domain (${host}).`);
  }

  if (org && ORG_VOCAB.test(org)) {
    score += W.orgVocab;
    reasons.push(`Organization name reads as a training provider: ${lead.organization.trim()}.`);
  }

  if (domain && !isFreeEmail) {
    score += W.corporateEmail;
    reasons.push(`Work email on ${domain}.`);
  }

  if (hasWebsite) {
    score += W.hasWebsite;
    reasons.push("Has a website.");
  }

  /* Deliberately vetoed by an individual-sounding message: a provider and a
     learner describe a course with the same nouns, and only the framing tells
     them apart. */
  if (!individualPhrase) {
    const matched = PROVIDER_TERMS.filter((term) => message.includes(term));
    if (matched.length >= 2) {
      score += W.providerLanguage;
      reasons.push("Message describes programs and learners in a provider's terms.");
    } else if (matched.length === 1) {
      score += Math.round(W.providerLanguage / 2);
    }
  }

  /* Country weights completeness only, never desirability. Whether the field
     was answered scores; which country it names never does. AAA accredits
     worldwide, and a preferred-country list would bake a bias into the
     pipeline and be wrong about the business besides. */
  if (lead.countryCode.trim()) score += W.countryGiven;

  /* ---- Negative signals -------------------------------------------------- */

  if (isFreeEmail) {
    score -= P.freeEmail;
    reasons.push(`Personal email address (${domain}).`);
  }

  if (!hasWebsite) {
    score -= P.noWebsite;
    reasons.push("No usable website.");
  }

  if (org && org === name) {
    score -= P.orgIsOwnName;
    reasons.push("Organization is just the person's own name.");
  }

  if (individualPhrase) score -= P.individualMessage;

  /* Message length is deliberately unscored. It measured at 0.6x — a long
     message is if anything a mild warning sign, usually an individual
     explaining what they personally want. */

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (disqualifiers.length > 0) {
    return { score, tier: "disqualified", reasons: [...disqualifiers, ...reasons] };
  }

  const tier: QualificationTier =
    score >= STRONG_AT ? "strong" : score >= QUALIFIED_AT ? "qualified" : "weak";

  if (reasons.length === 0) {
    reasons.push("Nothing on the form identifies this as a training provider.");
  }

  return { score, tier, reasons };
}

export const TIER_LABEL: Record<QualificationTier, string> = {
  disqualified: "Disqualified",
  weak: "Weak",
  qualified: "Qualified",
  strong: "Strong",
};

/* The dashboard's guidance: promote these to MQL, leave the rest. Holding the
   rule here rather than in the UI keeps "what counts as an MQL" in one place
   next to the scoring that decides it. */
export const MQL_TIERS: ReadonlySet<QualificationTier> = new Set<QualificationTier>([
  "qualified",
  "strong",
]);

export function isQualificationTier(value: string): value is QualificationTier {
  return value === "disqualified" || value === "weak" || value === "qualified" || value === "strong";
}
