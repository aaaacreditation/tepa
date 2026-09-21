/* Copy for the Accredited Educational Provider Fast Track test page.

   A second take on /tepa built around one offer, applying for accreditation,
   rather than a generic eligibility check. Nothing on this page is given away
   free: the 30 minute call is the application review, where the provider gets
   their scope, their timeline and their quote. Contact details, the
   testimonials and the directory links come from the /tepa content so the two
   pages can never disagree about them.

   Anything AAA has not confirmed yet is null in `pending` below. A null value
   hides the element that needs it, so the page never shows a placeholder.
   Fill a value in and it appears. */

import { positionSuggestions, practice, site } from "../tepa/content";

export { positionSuggestions, practice, site };

export const pending = {
  /* "One named assessor from your first call to your certificate." */
  namedAssessor: null as string | null,
  /* e.g. "31 October". Shown as "Included when you book by …". */
  bonusDeadline: null as string | null,
  /* e.g. { launchKit: "$450", tenderPack: "$300", trainerTemplates: "$250" } */
  bonusValues: null as { launchKit: string; tenderPack: string; trainerTemplates: string } | null,
  /* Places left in the current month's intake. */
  placesLeft: null as number | null,
  /* International format, e.g. "+971 50 000 0000". */
  whatsapp: null as string | null,
  /* e.g. "within one business day". Shown on the confirmation screen as
     "An assessor will contact you …". Left null until AAA commits to a
     number, so the page never promises a speed nobody agreed to. */
  responseTime: null as string | null,
  remoteAssessmentAnswer: null as string | null,
  renewalAnswer: null as string | null,
};

/* Proposed in the copy deck; AAA to confirm before this page takes traffic. */
export const guaranteeDays = 30;

export const links = {
  directory: site.directory,
  conformity: "https://aaa-accreditation.org/conformity-assessment-bodies-accreditation/",
} as const;

export const nav = [
  { label: "Who it's for", href: "#who-its-for" },
  { label: "The Fast Track", href: "#offer" },
  { label: "How it works", href: "#journey" },
  { label: "Questions", href: "#questions" },
] as const;

export const hero = {
  eyebrow: "Training provider accreditation for centers, academies and corporate training teams",
  title: "Win the clients who only buy from accredited educational and training providers",
  lede:
    "The Accredited Educational Provider Fast Track: an experienced AAA assessor reviews your programs and trainers, assures your compliance with the international standards, and takes you to a three-year accreditation certificate. Most providers finish in 3 to 8 weeks.",
  secondaryCta: "See what's included",
  reassurance:
    "Apply in two minutes, finish in 8 weeks, and receive a three-year accreditation certificate.",
  reassuranceDetail:
    "An experienced AAA assessor confirms your scope, the documents you need and your timeline, and sends your quote.",
  stats: [
    { value: "58+", label: "Countries served" },
    { value: "19,847", label: "Accredited certificates" },
    { value: "3 years", label: "Certificate validity" },
  ],
} as const;

export const fit = {
  eyebrow: "Built for organizations that deliver training",
  title: "Is this for you?",
  /* The words providers actually search with, said plainly. They were missing
     from this page, and a landing page that never uses the searcher's own
     words is scored as a poor match for the keyword that paid for the click. */
  note:
    "AAA accredits training providers and the training they deliver: training programs and short courses, CPD and continuing education programs, and the trainers who run them.",
  items: [
    {
      title: "Training centers and academies",
      body:
        "Training provider accreditation for professional and vocational programs with paying learners.",
    },
    {
      title: "Corporate training teams",
      body: "In-house training program accreditation your company wants recognized.",
    },
    {
      title: "Online, CPD and association providers",
      body:
        "Course, CPD and continuing education program accreditation, including healthcare training organizations.",
    },
  ],
  redirects: [
    {
      title: "Looking for a course or a certificate for yourself?",
      body:
        "AAA accredits the organizations that teach, not individual learners. Find an accredited provider in our public directory.",
      cta: "Search the directory",
      href: links.directory,
    },
    {
      title: "Accrediting a certification body or a laboratory?",
      body: "That is a different AAA accreditation program.",
      cta: "See that program",
      href: links.conformity,
    },
  ],
} as const;

export const pain = {
  eyebrow: "The cost of waiting",
  title: "Your programs are good. Buyers can't tell that from the outside.",
  lede:
    "Corporate clients, government buyers and international learners ask one question before they ask about price: are you accredited? Without a clear answer, you explain your quality on every call, and you still lose deals to providers who can show a certificate.",
  photoCaption: "An accredited training provider · AAA certificate in hand",
  items: [
    {
      title: "Lost a tender to an accredited competitor?",
      body: "The shortlist was decided before your proposal was read.",
    },
    {
      title: "Discounting to win the deal?",
      body: "When quality can't be verified, price is the only lever left.",
    },
    {
      title: "Planning next year's contracts?",
      body: "Accreditation has to be in place before you submit, not after.",
    },
  ],
} as const;

export const outcomes = {
  eyebrow: "After accreditation",
  title: "Your market starts treating you differently",
  items: [
    {
      lead: "Corporate and government buyers",
      body: "see an independently assessed provider, not an unknown vendor.",
    },
    {
      lead: "Learners and employers",
      body: "can verify every certificate you issue.",
    },
    {
      lead: "Your course materials, certificates and marketing",
      body: "carry the AAA Accreditation Symbol.",
    },
    {
      lead: "Your organization",
      body:
        "is listed in the AAA directory, and eligible trainees can be added to the American Directory of Competent Personnel.",
    },
    {
      lead: "Competitors without accreditation",
      body: "now have to explain why.",
    },
  ],
} as const;

export const offer = {
  eyebrow: "The offer",
  title: "The Accredited Educational Provider Fast Track",
  lede: "Everything it takes to go from first call to a three-year accreditation certificate.",
  items: [
    {
      title: "Application review with an experienced AAA assessor.",
      body:
        "A 30 minute call that confirms whether your programs qualify, what they need and how long it will take. Your tailored quote comes with it.",
    },
    {
      title: "Your Program Document Map.",
      body: "The exact documents for the programs you put forward, so you prepare once.",
    },
    {
      title: "Assessment by an experienced AAA assessor.",
      body:
        "Your training materials against recognized good practice, and your trainers' qualifications, experience and competence.",
    },
    {
      title: "Fix-It-First Findings.",
      body: "Any gap is written up clearly so you can correct it before the decision.",
    },
    {
      title: "Independent accreditation decision.",
      body: "Findings reviewed by someone other than your assessor.",
    },
    {
      title: "Three-year accreditation certificate",
      body: "and permission to use the AAA Accreditation Symbol for your approved scope.",
    },
    {
      title: "Verifiable digital certificates",
      body: "for your learners.",
    },
    {
      title: "Directory listings:",
      body:
        "the AAA directory and access to the American Directory of Competent Personnel.",
    },
  ],
  panelKicker: "Start here",
  panelTitle: "Apply for accreditation",
  panelBody:
    "Your application goes to an experienced AAA assessor. Most providers finish accreditation in 3 to 8 weeks.",
  cta: "Apply for accreditation",
} as const;

export const bonuses = {
  title: "Three tools to turn accreditation into sales",
  items: [
    {
      key: "launchKit",
      title: "Accreditation Launch Kit",
      body:
        "Ready-to-send announcements for LinkedIn, your client list and a press release, plus a guide to using the Symbol correctly.",
    },
    {
      key: "tenderPack",
      title: "Tender-Ready Credibility Pack",
      body: "A one-page verification summary for procurement teams and wording for your proposals.",
    },
    {
      key: "trainerTemplates",
      title: "Trainer Evidence Templates",
      body:
        "A competence matrix and CV template, so trainer evidence stops being the slowest part of your file.",
    },
  ],
} as const;

export const journey = {
  eyebrow: "From first call to certificate",
  title: "Four steps, most providers done in 3 to 8 weeks",
  stages: [
    {
      label: "Day 1",
      title: "Application review",
      body: "Confirm your scope, get your document map, your timeline and your quote.",
    },
    {
      label: "Step 2",
      title: "Application",
      body:
        "Submit your organization, programs, trainers, delivery methods and quality processes. We guide the documentation.",
    },
    {
      label: "Step 3",
      title: "Assessment",
      body: "Your assessor evaluates everything and tells you exactly what to correct.",
    },
    {
      label: "Step 4",
      title: "Decision and certificate",
      body: "Independent review, then a certificate valid for three years.",
    },
  ],
  footnote: "Your first win comes on the first call: you know exactly what to prepare.",
  cta: "Apply for accreditation",
} as const;

export const proof = {
  eyebrow: "Accreditation in practice",
  title: "Providers in 58+ countries, and you can check every one",
  directoryBody: "Every accredited organization is listed in our public directory.",
  directoryCta: "Check the directory",
  storiesKicker: "Provider stories",
  storiesTitle: "Accreditation in their words",
  videoLabel: "Provider story",
  videoBody: "Watch an accredited provider describe the assessment in their own words.",
  addressLine: "AAA is based at 8609 Westwood Center Drive, Tysons Corner, Virginia.",
} as const;

export const guarantee = {
  eyebrow: "Our guarantee",
  title: "The Fix-It-First Guarantee",
  body: `If your assessment finds gaps, your assessor stays with you until every finding is closed, at no extra assessment fee, as long as you send your corrections within ${guaranteeDays} days. You'll know exactly what to fix, and you won't pay twice to fix it.`,
  note:
    "And if your programs don't qualify yet, your assessor tells you on the application review, before you pay anything.",
} as const;

export const pricing = {
  eyebrow: "What it costs",
  title: "A quote built around your programs",
  body: [
    "The fee depends on how many programs and trainers you put forward and how you deliver them, so every provider gets a tailored quote with their application review. You see it before your assessment starts.",
    "Compare it with the value of one corporate or government contract that requires an accredited provider.",
  ],
} as const;

export const intake = {
  eyebrow: "Monthly intake",
  title: "Limited places each month",
  body: [
    "Each assessor takes on a limited number of new providers a month, so every file keeps moving.",
    "Bidding for next year's corporate or government training contracts? Your accreditation needs to be in place before you submit.",
  ],
  cta: "Apply for accreditation",
} as const;

export const faq = {
  eyebrow: "Questions",
  title: "What providers ask before they book",
  items: [
    {
      q: "Is AAA a recognized accreditation body?",
      a: "AAA serves providers in 58+ countries, has issued 19,847 accredited certificates, makes every accreditation decision through independent review, and lists every accredited organization in a public directory you can check today.",
    },
    {
      q: "Do you accredit individuals?",
      a: "No. AAA accredits organizations that deliver training. If you want an accredited course, use our directory to find a provider.",
    },
    {
      q: "What are the accreditation requirements for a training provider?",
      a: "Two things are assessed: the training itself, which has to cover the applicable learning outcomes and be relevant, complete and current, and the trainers, who have to show the qualifications, professional experience and competence to deliver it. Your assessor confirms the exact accreditation requirements for the programs you put forward.",
    },
    {
      q: "How does the accreditation process work?",
      a: "Four steps: apply, an application review with your assessor, the assessment of your programs and trainers, then an independent decision and your three-year certificate. Most providers complete the accreditation process in 3 to 8 weeks.",
    },
    {
      q: "How long does it take?",
      a: "Most providers complete accreditation in 3 to 8 weeks. The biggest factor is how quickly your documents come in.",
    },
    {
      q: "What will you evaluate?",
      a: "Whether your training materials cover the applicable learning outcomes and are relevant, complete and current, and whether your trainers have the qualifications, experience and competence to deliver them.",
    },
    {
      q: "Can we accredit only some of our programs?",
      a: "Yes. You choose which programs to put forward, and the Symbol applies to your approved scope.",
    },
    {
      q: "What if we don't meet a requirement?",
      a: "Your assessor explains exactly what to correct, and the Fix-It-First Guarantee covers the follow-up at no extra assessment fee.",
    },
    {
      q: "How much does it cost?",
      a: "It depends on your programs, trainers and delivery methods, so every quote is tailored. You receive yours with your application review, before your assessment starts.",
    },
    {
      q: "How do learners and employers check our accreditation?",
      a: "Through verifiable digital certificates and your listing in the AAA directory.",
    },
  ],
} as const;

export const finalCta = {
  eyebrow: "Next step",
  title: "Start your accreditation",
  body:
    "Send your application. An experienced AAA assessor confirms your scope, the documents you need and your timeline, and sends your quote. Most providers finish in 3 to 8 weeks.",
  captionTitle: "Accreditation certificate",
  captionBody: "Issued to providers who meet the AAA standard, valid for three years.",
} as const;

/* The application form. Two steps, then a confirmation.

   Step 2's answers are what the assessor reads before making contact, and
   what sales sees in the dashboard's message column — the preferred contact
   channel included, since it decides how the lead is worked. */
export const booking = {
  title: "Apply for accreditation",
  closingTitle: "Apply for accreditation",
  closingBadge: "Start here",
  step1: "Step 1 of 2 · Your details",
  step2: "Step 2 of 2 · Your programs",
  continue: "Continue",
  back: "Back",
  submit: "Send my application",
  submitting: "Sending",
  note: "Every field is required. Your application goes straight to an AAA assessor.",
  errorGeneric: "Something went wrong on our side. Please try again, or email us directly.",
  orgTypes: [
    "Training center or academy",
    "Corporate training department",
    "Online learning provider",
    "Association or CPD provider",
    "Healthcare training organization",
    "Other organization",
    "I'm an individual looking for a course",
  ],
  individual: "I'm an individual looking for a course",
  individualNote:
    "AAA accredits organizations that deliver training, not individual learners. To find an accredited course, search the providers in our directory.",
  individualCta: "Search accredited providers",
  programCounts: ["1", "2 to 5", "6 to 10", "More than 10"],
  timelines: ["Within a month", "1 to 3 months", "3 to 6 months", "Just researching"],

  /* Asked on the form rather than guessed at. Sales reports that an unknown
     foreign number goes unanswered, so letting the provider name the channel
     is worth more than any callback script. It rides into the dashboard on
     the message, where the assessor reads it before making contact. */
  contactLegend: "How should we contact you?",
  contactMethods: ["WhatsApp", "Phone call", "Email"],
  contactConfirm: {
    WhatsApp: "We'll message you on WhatsApp at",
    "Phone call": "We'll call you on",
    Email: "We'll email you at",
  },

  doneKicker: "Your application is in",
  doneTitle: "An AAA assessor will contact you",
  doneItems: [
    {
      lead: "Your application goes straight to an assessor,",
      body: "who reviews the programs and trainers you put forward.",
    },
    {
      lead: "You'll get",
      body: "your scope, the documents you need, your timeline and your quote.",
    },
    {
      lead: "Have ready:",
      body: "the list of programs you want accredited, the course outline for one of them, and your trainers' CVs.",
    },
  ],
} as const;
