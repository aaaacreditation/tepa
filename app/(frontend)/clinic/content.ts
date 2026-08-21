/* Copy for /clinic. The quiz itself lives in quiz.ts; everything the page says
   around it lives here. */

export const site = {
  org: "American Accreditation Association",
  shortOrg: "AAA",
  programme: "AAA Clinic Accreditation",
  website: "https://aaa-accreditation.org",
  clinicProgramme: "https://aaa-accreditation.org/healthcare-accreditation",
  phoneLabel: "+1 (571) 601 2616",
  phoneHref: "tel:+15716012616",
  whatsapp: "https://wa.me/447487550737",
  email: "Info@aaa-accreditation.org",
  address: ["8609 Westwood Center Drive", "Tysons Corner, VA 22182, USA"],
  social: [
    { name: "LinkedIn", href: "https://www.linkedin.com/company/aaa-accreditation" },
    { name: "Twitter", href: "https://twitter.com/AAAccreditation" },
    { name: "Facebook", href: "https://www.facebook.com/AAA.Accreditations/" },
    { name: "Instagram", href: "https://www.instagram.com/aaa.accreditations/" },
  ],
} as const;

export const hero = {
  eyebrow: "Clinic Readiness Assessment",
  titleLead: "How",
  titleAccent: "accreditation-ready",
  titleTail: "is your aesthetic clinic?",
  title: "How accreditation-ready is your aesthetic clinic?",
  lede:
    "A 2-minute self-check built on the same standards AAA uses to accredit clinics in 53+ countries. Get your readiness score and a clear next step.",
  primaryCta: "Start the 2-minute assessment",
  secondaryCta: "See what we evaluate",
  micro: "Free · No obligation · Built for cosmetic, aesthetic & specialty clinics",
  stats: [
    { icon: "shield", value: "53+", label: "Countries worldwide" },
    { icon: "globe", value: "100+", label: "Surveyors" },
    { icon: "isqua", value: "ISQua", label: "Internationally recognized" },
    { icon: "support", value: "24/7", label: "Continuous support" },
  ],
} as const;

export const quizIntro = {
  eyebrow: "Readiness Assessment",
  title: "Find out where your clinic stands",
  lede:
    "Answer a few quick questions across the five domains AAA evaluates. You'll get a readiness score and a tailored snapshot — in about two minutes.",
} as const;

export const formCopy = {
  submit: "See my readiness score",
  submitting: "Scoring your answers",
  back: "Back",
  consent:
    "I agree to be contacted by the American Accreditation Association about my clinic's accreditation readiness.",
  consentError: "Please confirm you're happy to be contacted.",
  errorGeneric:
    "We could not save your answers. Please try again, or email us directly and we'll score them by hand.",
  optional: "optional",
} as const;

export const result = {
  scoreLabel: "Readiness",
  breakdownTitle: "Your five domains",
  ctaTitle: "See exactly what AAA clinic accreditation involves",
  ctaBody:
    "Your snapshot is the first step of AAA's readiness assessment. Explore the full programme, or talk to an advisor who can review your results with you.",
  ctaPrimary: "Explore clinic accreditation",
  ctaSecondary: "Email an advisor",
  savedNote: "A copy of this snapshot is on its way to your inbox.",
  trustLabel: "Trusted by accredited clinics worldwide",
} as const;

export const organizations = [
  {
    name: "Global Medical City",
    location: "Cairo, Egypt",
    logo: "/healthcare/organizations/globalmediaclcity.jpeg",
  },
  {
    name: "Domus Salutis Clinic",
    location: "Legnago, Italy",
    logo: "/healthcare/organizations/domus.jpeg",
  },
  {
    name: "Debeauty Clinic",
    location: "Colorado, USA",
    logo: "/healthcare/organizations/debeauty.jpeg",
  },
  {
    name: "Millennia Wellness",
    location: "Texas, USA",
    logo: "/healthcare/organizations/millennia.jpeg",
  },
] as const;

export const domainsIntro = {
  eyebrow: "What AAA Evaluates",
  title: "The five domains behind your score",
  lede:
    "Clinic accreditation is proportionate to your scope of services and level of clinical risk. These are the areas a surveyor works through.",
  items: [
    {
      icon: "shield",
      title: "Patient-Centered Care & Rights",
      body:
        "Respecting patient dignity, informed consent, proper identification, and confidentiality.",
    },
    {
      icon: "pulse",
      title: "Clinical Care & Patient Safety",
      body:
        "Appropriate patient assessment, infection prevention measures, and emergency preparedness relevant to your services.",
    },
    {
      icon: "userCheck",
      title: "Workforce & Clinical Competence",
      body:
        "Qualified and licensed professionals working within clearly defined scopes of practice.",
    },
    {
      icon: "building",
      title: "Facilities, Equipment & Environment",
      body: "Safe clinical facilities with appropriate and properly maintained equipment.",
    },
    {
      icon: "chart",
      title: "Governance, Quality & Improvement",
      body:
        "Defined leadership responsibility, incident management, and ongoing quality improvement systems.",
    },
  ],
} as const;
