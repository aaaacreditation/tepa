/* The readiness assessment: its questions, its scoring, and nothing else.
   Deliberately free of "server-only" and of any React import, because both
   halves of the page need it — the browser to show a score the moment the
   visitor finishes, the enquiry route to recompute that score from the raw
   answers before storing it. A score posted by the client is a claim, not a
   fact, so the server never takes one on trust. */

export const SCALE = [
  { label: "Yes", value: 2, mark: "check" },
  { label: "Partially", value: 1, mark: "half" },
  { label: "No / Not sure", value: 0, mark: "empty" },
] as const;

export const MAX_PER_DOMAIN = 2;

export type DomainKey = "care" | "safety" | "work" | "fac" | "gov";

export const DOMAINS: ReadonlyArray<{ key: DomainKey; name: string }> = [
  { key: "care", name: "Patient-Centered Care & Rights" },
  { key: "safety", name: "Clinical Care & Patient Safety" },
  { key: "work", name: "Workforce & Clinical Competence" },
  { key: "fac", name: "Facilities, Equipment & Environment" },
  { key: "gov", name: "Governance, Quality & Improvement" },
];

/* Profile questions. The id is the key the answer is stored under and the
   column-free field name the enquiry route validates against. */
export type ProfileKey = "clinicType" | "size" | "region" | "reason" | "timeline";

export type ProfileStep = {
  kind: "profile";
  id: ProfileKey;
  tag: string;
  question: string;
  help: string;
  options: readonly string[];
};

export type ScaleStep = {
  kind: "scale";
  domain: DomainKey;
  tag: string;
  question: string;
  help: string;
};

export type LeadStep = { kind: "lead"; tag: string; question: string; help: string };
export type ResultStep = { kind: "result" };

export type Step = ProfileStep | ScaleStep | LeadStep | ResultStep;

export const STEPS: readonly Step[] = [
  {
    kind: "profile",
    id: "clinicType",
    tag: "About your clinic",
    question: "What best describes your clinic?",
    help: "We tailor the standards to your clinical focus.",
    options: [
      "Medical spa / aesthetic clinic",
      "Cosmetic or plastic surgery clinic",
      "Dermatology clinic",
      "Hair transplant clinic",
      "Other outpatient / specialty clinic",
    ],
  },
  {
    kind: "profile",
    id: "size",
    tag: "About your clinic",
    question: "How many practitioners work at the clinic?",
    help: "Survey scope is proportionate to your size.",
    options: [
      "Single practitioner",
      "2–5 practitioners",
      "6–15 practitioners",
      "16+ practitioners",
    ],
  },
  {
    kind: "profile",
    id: "region",
    tag: "About your clinic",
    question: "Where is your clinic based?",
    help: "Accreditation supports international and medical-tourism patients.",
    options: [
      "North America",
      "Latin America",
      "Europe",
      "Middle East",
      "Africa",
      "South Asia",
      "Southeast Asia / East Asia",
      "Oceania",
    ],
  },

  {
    kind: "scale",
    domain: "care",
    tag: "Patient-Centered Care & Rights",
    question: "Do you use a written informed-consent process before every procedure?",
    help: "Consent recorded in writing, for every procedure, every time.",
  },
  {
    kind: "scale",
    domain: "safety",
    tag: "Clinical Care & Patient Safety",
    question: "Do you follow a documented infection prevention and control protocol?",
    help: "Written, current, and known to the whole clinical team.",
  },
  {
    kind: "scale",
    domain: "work",
    tag: "Workforce & Clinical Competence",
    question:
      "Are all clinical staff licensed and working within a defined scope of practice?",
    help: "Licences on file and scopes written down, not assumed.",
  },
  {
    kind: "scale",
    domain: "fac",
    tag: "Facilities, Equipment & Environment",
    question:
      "Is clinical equipment on a documented maintenance and calibration schedule?",
    help: "A schedule you could show a surveyor, with dates against it.",
  },
  {
    kind: "scale",
    domain: "gov",
    tag: "Governance, Quality & Improvement",
    question: "Is one person clearly responsible for quality and incident management?",
    help: "A named person, not a shared assumption.",
  },

  {
    kind: "profile",
    id: "reason",
    tag: "Your goals",
    question: "What's your main reason for considering accreditation?",
    help: "This helps your advisor focus on what matters to you.",
    options: [
      "Attract international / medical-tourism patients",
      "Win payer or insurance contracts",
      "Strengthen reputation and patient trust",
      "Reduce clinical and legal risk",
      "Required by a partner or regulator",
    ],
  },
  {
    kind: "profile",
    id: "timeline",
    tag: "Your goals",
    question: "When would you like to begin?",
    help: "There's no wrong answer — it just sets the pace.",
    options: [
      "As soon as possible",
      "Within 1–3 months",
      "Within 3–6 months",
      "Just exploring for now",
    ],
  },

  {
    kind: "lead",
    tag: "Get your results",
    question: "Where should we send your readiness snapshot?",
    help: "Your score appears on the next screen. An AAA advisor can walk you through it — no obligation.",
  },
  { kind: "result" },
];

export const ROLES = [
  "Owner / Founder",
  "Medical Director",
  "Operations / Administration",
  "Other",
] as const;

/* ==========================================================================
   Scoring
   ========================================================================== */

export type DomainScores = Partial<Record<DomainKey, number>>;

export type DomainResult = {
  key: DomainKey;
  name: string;
  points: number;
  percent: number;
  label: "Strong" | "On track" | "Needs work";
  tone: "good" | "warn" | "weak";
};

export type Band = {
  key: "ready" | "nearly" | "foundation";
  label: string;
  heading: string;
  copy: string;
};

export type ScoreResult = {
  percent: number;
  band: Band;
  domains: DomainResult[];
  answered: number;
};

const BANDS: Record<Band["key"], Band> = {
  ready: {
    key: "ready",
    label: "Accreditation-Ready",
    heading: "You're in strong shape.",
    copy: "Your clinic already has most of the systems AAA looks for. A free pre-assessment will confirm the remaining gaps and set a fast path to accreditation.",
  },
  nearly: {
    key: "nearly",
    label: "Nearly There",
    heading: "Solid foundations — a few gaps to close.",
    copy: "You have the essentials in place. A focused gap analysis with a dedicated AAA advisor will close the open areas before a formal survey.",
  },
  foundation: {
    key: "foundation",
    label: "Foundation-Building",
    heading: "There's groundwork to do — and that's normal.",
    copy: "Many clinics start exactly here. AAA's consultant-supported process is built to take you from where you are today to accreditation-ready, step by step.",
  },
};

/* Unanswered domains score zero rather than being dropped from the
   denominator: a clinic that skipped a question has not demonstrated the
   control, and quietly shrinking the total would inflate every partial run. */
export function computeScore(scores: DomainScores): ScoreResult {
  let got = 0;
  let answered = 0;

  const domains = DOMAINS.map<DomainResult>((domain) => {
    const raw = scores[domain.key];
    const points = clampPoints(raw);
    if (raw !== undefined) answered += 1;
    got += points;

    return {
      key: domain.key,
      name: domain.name,
      points,
      percent: Math.round((points / MAX_PER_DOMAIN) * 100),
      label: points >= 2 ? "Strong" : points >= 1 ? "On track" : "Needs work",
      tone: points >= 2 ? "good" : points >= 1 ? "warn" : "weak",
    };
  });

  const max = DOMAINS.length * MAX_PER_DOMAIN;
  const percent = Math.round((got / max) * 100);
  const band = percent >= 80 ? BANDS.ready : percent >= 50 ? BANDS.nearly : BANDS.foundation;

  return { percent, band, domains, answered };
}

function clampPoints(value: unknown): number {
  const n = typeof value === "number" ? value : Number.NaN;
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_PER_DOMAIN, Math.max(0, Math.round(n)));
}

/* The profile answers are free-form only in the sense that the visitor picks
   one; anything not on the list is rejected rather than stored. */
export function profileOptions(id: ProfileKey): readonly string[] {
  const step = STEPS.find(
    (s): s is ProfileStep => s.kind === "profile" && s.id === id,
  );
  return step ? step.options : [];
}

export const QUESTION_COUNT = STEPS.filter(
  (s) => s.kind === "profile" || s.kind === "scale",
).length;
