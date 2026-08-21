/* Lead qualification.

   Over the 90 days to August 2026, 32 of 34 TEPA leads were marked MQL. A
   stage 94% of leads pass is not a qualification, it is a receipt, and Smart
   Bidding cannot learn anything from a signal that never varies. The cause was
   not carelessness: MQL was a button with no criteria attached, so it came to
   mean "I have seen this" rather than "this is worth a salesperson's hour".

   This module supplies the criteria. It scores a lead the moment it arrives
   and hands the reviewer a tier and a list of plain reasons; the reviewer
   still decides. Auto-promotion is deliberately not offered here — a heuristic
   that promotes on its own would reproduce the same rubber stamp with a
   machine holding it.

   No "server-only" import: the enquiry form imports the option lists below so
   the wording on the form and the wording the scorer matches can never drift
   apart. Keep this file free of database and node imports for that reason. */

/* The three questions added to the form. Exported as the single source of
   truth: the <select> options, the server validation and the scoring all read
   these same arrays. */
export const ORGANIZATION_TYPES = [
  "Training centre",
  "Professional academy",
  "Corporate training department",
  "Online learning provider",
  "Industry association",
  "Other",
  "I am an individual looking for a course",
] as const;

export const PROGRAM_COUNTS = [
  "1–2",
  "3–5",
  "6–10",
  "More than 10",
  "Not sure yet",
] as const;

export const ROLES = [
  "Owner / General Manager",
  "Quality Manager",
  "Training Manager",
  "Marketing",
  "Other",
  "Student / Trainee",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];
export type ProgramCount = (typeof PROGRAM_COUNTS)[number];
export type Role = (typeof ROLES)[number];

/* The two self-identifying wrong-fit answers. They are plainly worded and
   placed last rather than hidden, because a visitor who tells us they are an
   individual looking for a course has saved everyone a phone call. AAA
   accredits organizations that deliver training; it does not accredit
   individuals and does not grant degrees, so this is the most common wrong-fit
   lead in every market. */
export const INDIVIDUAL_ORGANIZATION_TYPE: OrganizationType =
  "I am an individual looking for a course";
export const STUDENT_ROLE: Role = "Student / Trainee";

export type QualificationTier = "disqualified" | "weak" | "qualified" | "strong";

export type Qualification = {
  /* 0-100. Only meaningful relative to the thresholds below; it is not a
     probability of anything. */
  score: number;
  tier: QualificationTier;
  /* Human readable, rendered verbatim in the dashboard. Every line explains
     one contribution, so a reviewer who disagrees can see exactly which signal
     to distrust rather than arguing with a number. */
  reasons: string[];
};

/* Everything the scorer reads. The three new fields are optional so the
   healthcare and clinic routes can adopt this before their forms ask the
   questions — they simply score on the signals they do have. */
export type LeadInput = {
  fullName: string;
  organization: string;
  email: string;
  website: string;
  message: string;
  countryCode: string;
  organizationType?: string;
  programCount?: string;
  role?: string;
};

/* Consumer mailbox providers. A training provider may well use one, which is
   why this is a penalty rather than a disqualifier on its own — but a provider
   with neither a work address nor a website has shown us nothing to verify. */
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.com",
  "gmx.com",
  "yandex.com",
]);

/* Vocabulary a provider uses about its own operation. */
const PROVIDER_TERMS = [
  "program",
  "programme",
  "course",
  "curriculum",
  "trainer",
  "trainee",
  "learner",
  "student",
  "accredit",
  "certificat",
  "qualification",
  "cohort",
  "syllabus",
  "instructor",
  "faculty",
  "centre",
  "center",
  "academy",
  "institute",
];

/* Phrases that read as someone asking to take a course rather than to have one
   accredited. Matched as substrings on a normalized message, so "how do i
   enrol" catches "How do I enroll?" too. */
const INDIVIDUAL_PHRASES = [
  "i want a certificate",
  "i need a certificate",
  "i want to get certified",
  "i want to be certified",
  "how do i enrol",
  "how do i enroll",
  "how can i enrol",
  "how can i enroll",
  "how to enrol",
  "how to enroll",
  "course fee",
  "tuition fee",
  "how much is the course",
  "i want to study",
  "i want to join",
  "i am a student",
  "i'm a student",
  "apply for admission",
  "admission requirement",
  "scholarship",
  "i want to take",
  "i would like to take",
];

const ORGANIZATION_TYPE_POINTS: Record<string, number> = {
  "Training centre": 15,
  "Professional academy": 15,
  "Corporate training department": 14,
  "Online learning provider": 13,
  "Industry association": 12,
  Other: 2,
};

const PROGRAM_COUNT_POINTS: Record<string, number> = {
  "1–2": 3,
  "3–5": 10,
  "6–10": 14,
  "More than 10": 18,
  "Not sure yet": -8,
};

const ROLE_POINTS: Record<string, number> = {
  "Owner / General Manager": 12,
  "Quality Manager": 12,
  "Training Manager": 12,
  Marketing: 4,
  Other: 0,
};

/* Tuned so that a provider answering everything well lands in `strong`, one
   answering plausibly but thinly lands in `qualified`, and a lead carrying
   more doubt than signal lands in `weak`. The intent is that qualified and
   strong together are 30-50% of real traffic; if MQL stays above 70% once
   data accumulates, these are still too generous. */
const STRONG_AT = 75;
const QUALIFIED_AT = 45;

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).trim().toLowerCase();
}

/* Deliberately loose. The form already validates the shape; this only asks
   whether what arrived looks like a domain rather than a sentence. */
function looksLikeDomain(website: string): boolean {
  const trimmed = website.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (!trimmed || /\s/.test(trimmed)) return false;
  const host = trimmed.split("/")[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host) && host.split(".").pop()!.length >= 2;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function scoreLead(lead: LeadInput): Qualification {
  const reasons: string[] = [];
  const disqualifiers: string[] = [];
  let score = 0;

  const domain = emailDomain(lead.email);
  const isFreeEmail = domain !== "" && FREE_EMAIL_DOMAINS.has(domain);
  const hasWebsite = looksLikeDomain(lead.website);
  const message = normalize(lead.message);

  /* ---- Hard disqualifiers ------------------------------------------------
     Each of these means the lead cannot become a customer, whatever else is
     true of it. They set the tier outright rather than subtracting points, so
     no amount of other signal can drown them out. */

  if (lead.organizationType === INDIVIDUAL_ORGANIZATION_TYPE) {
    disqualifiers.push("Told us they are an individual looking for a course, not an organization seeking accreditation.");
  }

  if (lead.role === STUDENT_ROLE) {
    disqualifiers.push("Role is Student / Trainee. AAA accredits providers, not individuals.");
  }

  if (isFreeEmail && !hasWebsite) {
    disqualifiers.push(`Personal email (${domain}) and no website — nothing here identifies a training provider.`);
  }

  /* ---- Positive signals -------------------------------------------------- */

  if (domain && !isFreeEmail) {
    score += 15;
    reasons.push(`Work email on ${domain}.`);
  }

  if (hasWebsite) {
    score += 12;
    reasons.push("Has a website.");
  }

  /* An organization name that merely repeats the person's name is a form
     filled to get past validation, not an organization. */
  const org = normalize(lead.organization);
  const name = normalize(lead.fullName);
  if (org && org !== name) {
    score += 8;
    reasons.push(`Named an organization: ${lead.organization.trim()}.`);
  } else if (org && org === name) {
    score -= 6;
    reasons.push("Organization is just the person's own name.");
  }

  if (lead.organizationType) {
    const points = ORGANIZATION_TYPE_POINTS[lead.organizationType];
    if (typeof points === "number") {
      score += points;
      if (points >= 10) reasons.push(`Organization type: ${lead.organizationType}.`);
    }
  }

  if (lead.programCount) {
    const points = PROGRAM_COUNT_POINTS[lead.programCount];
    if (typeof points === "number") {
      score += points;
      if (points > 0) reasons.push(`${lead.programCount} programs to accredit.`);
      if (points < 0) reasons.push("Does not yet know how many programs to accredit.");
    }
  }

  if (lead.role) {
    const points = ROLE_POINTS[lead.role];
    if (typeof points === "number" && points > 0) {
      score += points;
      if (points >= 10) reasons.push(`${lead.role} — able to start an accreditation.`);
    }
  }

  /* Read the individual phrases first, because they veto the vocabulary bonus
     below. "I want a certificate in project management, what are the course
     fees?" contains two provider terms and is the clearest wrong-fit message
     we get: the words a provider uses about its programs are the same words a
     learner uses about attending one. Only the framing separates them, so when
     the framing says learner, the vocabulary earns nothing. */
  const individualPhrase = INDIVIDUAL_PHRASES.find((phrase) => message.includes(phrase));

  const matchedTerms = individualPhrase
    ? []
    : PROVIDER_TERMS.filter((term) => message.includes(term));
  if (matchedTerms.length >= 2) {
    score += 8;
    reasons.push("Message describes programs and learners in a provider's terms.");
  } else if (matchedTerms.length === 1) {
    score += 4;
  }

  /* Country weights completeness only, never desirability. AAA accredits
     worldwide and a list of preferred countries would be both wrong and a bias
     baked into the pipeline, so what is scored is whether the field was
     answered at all — not which answer it was. */
  if (lead.countryCode.trim()) {
    score += 4;
  }

  /* ---- Negative signals -------------------------------------------------- */

  if (isFreeEmail) {
    score -= 12;
    reasons.push(`Personal email address (${domain}).`);
  }

  if (individualPhrase) {
    score -= 25;
    reasons.push(`Message reads as someone wanting to take a course ("${individualPhrase}").`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (disqualifiers.length > 0) {
    return { score, tier: "disqualified", reasons: [...disqualifiers, ...reasons] };
  }

  const tier: QualificationTier =
    score >= STRONG_AT ? "strong" : score >= QUALIFIED_AT ? "qualified" : "weak";

  if (reasons.length === 0) reasons.push("Nothing on the form identifies this as a training provider.");

  return { score, tier, reasons };
}

export const TIER_LABEL: Record<QualificationTier, string> = {
  disqualified: "Disqualified",
  weak: "Weak",
  qualified: "Qualified",
  strong: "Strong",
};

export function isQualificationTier(value: string): value is QualificationTier {
  return value === "disqualified" || value === "weak" || value === "qualified" || value === "strong";
}
