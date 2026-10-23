/* Copy for /sme, the SMEs Accreditation landing page.

   The sections and their wording come from the AAA website's client-approved
   SMEs Accreditation Program page (aaa-accreditation.org, newwebsiteaaa:
   app/programs/smes-accreditation-program, Oct 2026). On this page every
   "Apply" call to action lands on the application form (#apply) instead of the
   website's /apply, and the form feeds the leads dashboard at /dashboard/sme.

   Icons are named here and drawn in ./icons.tsx. */

export const site = {
  org: "American Accreditation Association",
  shortOrg: "AAA",
  programme: "AAA SMEs Accreditation",
  /* Same booking page as the website's SME page. */
  calendly: "https://calendly.com/accreditationaaa/consultation-call-am",
  website: "https://aaa-accreditation.org",
  applicationForm: "/sme/documents/AAA-SME-Accreditation-Application-Form.docx",
  phoneLabel: "+1 (571) 601 2616",
  phoneHref: "tel:+15716012616",
  whatsappLabel: "+1 (571) 630-2066",
  whatsappHref: "https://wa.me/15716302066",
  email: "info@aaa-accreditation.org",
  address: ["8609 Westwood Center Drive", "Tysons Corner, VA 22182, USA"],
  social: [
    { name: "LinkedIn", href: "https://www.linkedin.com/company/aaa-accreditation" },
    { name: "Twitter", href: "https://twitter.com/AAAccreditation" },
    { name: "Facebook", href: "https://www.facebook.com/AAA.Accreditations/" },
    { name: "Instagram", href: "https://www.instagram.com/aaa.accreditations/" },
  ],
} as const;

export const nav = [
  { label: "About", href: "#about" },
  { label: "6 Pillars", href: "#framework" },
  { label: "Process", href: "#process" },
  { label: "Success Stories", href: "#accredited" },
  { label: "FAQs", href: "#faq" },
] as const;

export const hero = {
  /* The hero carries the application form on the right, as on /tepa. */
  kicker: "Accreditation for small & medium enterprises",
  title: "SMEs Accreditation Program",
  lead: "The American Accreditation Association’s (AAA) SMEs Accreditation Program helps Small and Medium Enterprises (SMEs) demonstrate credibility through an independent assessment of their business, governance, and operational framework. The resulting internationally recognised accreditation and Business Readiness Score strengthen trust and unlock opportunities for growth, partnerships, market expansion, and funding.",
  primary: "Check Your Readiness for Free",
  secondary: "Book Your Consultation",
  photo: "/sme/hero-sme-team.png",
  photoAlt: "Two representatives holding a framed AAA Accreditation Certificate",
  rail: ["U.S. headquartered", "Independent assessment", "International recognition", "Recognised in 59 countries"],
  stats: [
    { value: "59", label: "Countries served" },
    { value: "50+", label: "Qualified assessors" },
    { value: "3 years", label: "Certificate validity" },
  ],
  formTitle: "Apply for SMEs accreditation",
} as const;

export const about = {
  title: "What is SMEs Accreditation?",
  paragraphs: [
    "Small and Medium Enterprises (SMEs) Accreditation is an independent, evidence-based programme that evaluates how your business is managed across key areas of organisational performance.",
    "It helps SMEs demonstrate credibility, strengthen business practices, and build confidence with customers, partners, and financial institutions.",
  ],
  cards: [
    {
      big: "50+",
      small: "Qualified Assessors",
      text: "Experienced professionals delivering consistent, evidence-based assessments.",
    },
    {
      big: "59+",
      small: "Countries served",
      text: "Accreditation recognised by businesses and stakeholders worldwide.",
    },
    {
      big: "Published",
      small: "Accreditation Framework",
      text: "A transparent methodology that ensures consistency and impartiality.",
    },
    {
      big: "India Pilot",
      small: "Cohort Open Now",
      text: "Join the first group of SMEs shaping the future of business accreditation.",
    },
  ],
  sectorsTitle: "Accreditation Across Every Sector",
  sectorsText:
    "From manufacturing to global trade, we provide accreditation solutions that uphold quality, safety, and excellence across all sectors.",
  bandText:
    "No matter your industry, our accreditation builds trust, ensures compliance, and drives sustainable growth.",
  bandPrimary: "Check Your Readiness for Free",
  bandSecondary: "Learn more about the process",
} as const;

export const sectors = [
  { name: "Manufacturing", img: "/sme/sectors/manufacturing.jpg", icon: "manufacturing" },
  { name: "IT & Software Services", img: "/sme/sectors/it-software.jpg", icon: "it" },
  { name: "Healthcare & Pharma", img: "/sme/sectors/healthcare.jpg", icon: "healthcare" },
  { name: "Agri-Processing", img: "/sme/sectors/agri.jpg", icon: "agri" },
  { name: "Textile & Apparel", img: "/sme/sectors/textile.jpg", icon: "textile" },
  { name: "Clean Energy & Greentech", img: "/sme/sectors/clean-energy.jpg", icon: "energy" },
  { name: "Logistics & Transport", img: "/sme/sectors/logistics.jpg", icon: "logistics" },
  { name: "Construction & Engineering", img: "/sme/sectors/construction.jpg", icon: "construction" },
  { name: "Retail & E-commerce", img: "/sme/sectors/retail.jpg", icon: "retail" },
  { name: "Hospitality & Food", img: "/sme/sectors/hospitality.jpg", icon: "hospitality" },
  { name: "Export & Import", img: "/sme/sectors/export-import.jpg", icon: "globe" },
] as const;

export const framework = {
  title: "6 Pillars of SMEs Accreditation",
  text: "Your business is assessed across six weighted areas that determine your Business Readiness Score, using an evidence-based, consistent, impartial, risk-based, and proportionate assessment methodology.",
  photo: "/sme/sme-framework-review.jpg",
  photoAlt: "AAA assessors discussing an assessment together over a laptop",
  caption: { kicker: "Six weighted areas", title: "One Business Readiness Score" },
  pillars: [
    {
      title: "Financial & Funding Readiness",
      text: "Your financial records, awareness of obligations and liabilities, what funding you need and why, and how you track cash flow and sustainability.",
      icon: "finance",
    },
    {
      title: "Operational Requirements",
      text: "Active operations and delivery, documented processes, enough resources to do the work, and clear communication with clients and stakeholders.",
      icon: "operations",
    },
    {
      title: "Management & Structure",
      text: "Legal registration, a defined organisational structure, and clear ownership and management responsibilities.",
      icon: "structure",
    },
    {
      title: "Governance & Compliance",
      text: "Ethical operations, managing business risk, meeting legal and regulatory rules, and being transparent about who you are.",
      icon: "governance",
    },
    {
      title: "Market Presence & Growth",
      text: "A clear offer and target market, real customer activity, growth plans, and listening to customer feedback.",
      icon: "growth",
    },
    {
      title: "Continuous Improvement",
      text: "Spotting what to improve, acting on feedback, fixing issues, and keeping a record of the changes you make.",
      icon: "improvement",
    },
  ],
} as const;

export const process = {
  title: "The accreditation process",
  text: "A transparent, rigorous and globally benchmarked process designed to build trust and credibility.",
  primary: "Apply for Accreditation",
  secondary: "Book Your Consultation",
  photo: "/sme/sme-process-award.jpg",
  photoAlt: "Healthcare team receiving their American Accreditation Association award",
  steps: [
    { title: "Application", text: "Submit the accreditation application to AAA.", icon: "application" },
    { title: "Documents", text: "Send programme documents for review.", icon: "documents" },
    { title: "Assessment", text: "Documents assessed by AAA assessors.", icon: "assessment" },
    { title: "Feedback", text: "Assessors share feedback; SMEs take action.", icon: "feedback" },
    { title: "Decision", text: "AAA accreditation committee decides.", icon: "decision" },
  ],
  seal: "/sme/aaa-accredited-badge.png",
  sealAlt: "AAA Accredited Business seal",
  validity: "3 years",
  note: "Re-assessment, renewal and upgrades follow the same evidence-based methodology.",
} as const;

export const readiness = {
  title: "Take the First Step Towards Accreditation",
  text: "A simple first step towards accreditation. Complete a quick self-assessment to understand your current level of business readiness.",
  start: "Start Business Readiness Check",
  preview: "/sme/sme-readiness-preview.png",
  previewAlt: "Sample result: an overall readiness score of 79% and a six-area profile chart",
  /* Two statements per pillar, answered Yes / Somewhat / Not yet. */
  categories: [
    {
      cat: "Financial & Funding Readiness",
      qs: [
        "We keep clear, up-to-date financial records such as accounts, cash flow, and statements.",
        "We know how much funding we need and exactly what we would use it for.",
      ],
    },
    {
      cat: "Operational Requirements",
      qs: [
        "Our core operations and delivery processes are documented.",
        "We have the people and resources to meet our current workload.",
      ],
    },
    {
      cat: "Management & Structure",
      qs: [
        "Our business is properly registered and legally constituted.",
        "Ownership, roles, and management responsibilities are clearly defined.",
      ],
    },
    {
      cat: "Governance & Compliance",
      qs: [
        "We meet the legal, tax, and regulatory requirements that apply to us.",
        "We identify and manage the main risks to our business.",
      ],
    },
    {
      cat: "Market Presence & Growth",
      qs: [
        "We have a clear target market and an active, repeat customer base.",
        "We have a written plan for how the business will grow.",
      ],
    },
    {
      cat: "Continuous Improvement",
      qs: [
        "We collect customer and team feedback and act on it.",
        "We keep a record of the improvements and changes we make.",
      ],
    },
  ],
  options: [
    { label: "Yes", value: 2 },
    { label: "Somewhat", value: 1 },
    { label: "Not yet", value: 0 },
  ],
  /* Score bands, highest first. The API checks a submitted band against these. */
  levels: [
    { min: 80, name: "Funding-ready" },
    { min: 60, name: "Nearly there" },
    { min: 40, name: "Building readiness" },
    { min: 0, name: "Early stage" },
  ],
  congrats: "You’re eligible to apply for accreditation.",
  congratsText: "Every operating business can apply. Here is your readiness snapshot and what to strengthen next.",
  bandText: "Based on your answers across the six areas we assess. Apply to confirm your verified score and earn your certificate.",
  apply: "Apply now",
  talk: "Talk to our team",
  retake: "Retake",
} as const;

export const stories = {
  eyebrow: "Success stories",
  title: "Trusted by organizations committed to excellence.",
  text: "Real accreditation journeys from healthcare organizations, education providers, SMEs, public institutions, and international partners recognized through AAA.",
  featuredLabel: "Featured Story",
  featured:
    "Monarch Master Injectors: 12% growth, 500+ students certified, and 1,500+ Google reviews at a 5.0 rating after accreditation.",
  allLink: "https://casestudies-alpha.vercel.app/",
  allLabel: "View All Success Stories",
  apply: "Apply for Accreditation",
  /* From the website's case-study source (app/_data/case-studies.ts). Quotes
     are the organizations' own words — do not paraphrase them. */
  items: [
    {
      name: "Cinute Digital",
      country: "Mira Bhayandar, India",
      quote: "AAA's global recognition has opened more doors with corporate clients, and institutional partners.",
      img: "/sme/case-studies/cinute-digital-certificate.jpg",
      logo: "/sme/case-studies/cinute-digital-logo.jpg",
    },
    {
      name: "Priority Global",
      country: "Ghaziabad, India",
      quote: "The impact of accreditation has been remarkable. It has helped us attract more learners, expand our client base, and demonstrate our commitment to delivering high-quality education and training.",
      img: "/sme/case-studies/priority-global-certificate.png",
      logo: "/sme/case-studies/priority-global-logo.png",
    },
    {
      name: "IIBMS",
      country: "Mumbai, India",
      quote: "Since achieving AAA accreditation, we have seen a noticeable improvement. Accreditation has strengthened our credibility and market reputation.",
      img: "/sme/case-studies/iibms-certificate.jpg",
      logo: "/sme/case-studies/iibms-logo.jpg",
    },
    {
      name: "Clinoxy Solutions",
      country: "Hyderabad, India",
      quote: "The accreditation process has added real value to our organization, improving market credibility, increasing customer confidence, and supporting our mission to deliver high-quality healthcare solutions.",
      img: "/sme/case-studies/clinoxy-solutions-certificate.png",
      logo: "/sme/case-studies/clinoxy-solutions-logo.png",
    },
    {
      name: "RC Growth Consultancies",
      country: "Lucknow, India",
      quote: "The value of accreditation extends far beyond recognition. It has helped our consultancy differentiate itself in the market while reinforcing a culture of quality and continual improvement.",
      img: "/sme/case-studies/rc-growth-consultancies-certificate.jpg",
      logo: "/sme/case-studies/rc-growth-consultancies-logo.png",
    },
    {
      name: "Study Medic",
      country: "Qatar, India",
      quote: "I recommend the American Accreditation Association to any institution committed to upholding the highest standards of education.",
      img: "/sme/case-studies/study-medic-certificate.png",
      logo: "/sme/case-studies/study-medic-logo.png",
    },
    {
      name: "Aldelma Trading",
      country: "Jordan, Iraq",
      quote: "Our main strategic benefits from accreditation are: we gained preferred vendor status with government entities and attracted multinational corporate clients.",
      img: "/sme/case-studies/aldelma-trading-certificate.jpg",
      logo: "/sme/case-studies/aldelma-trading-logo.jpg",
    },
    {
      name: "Clarivate",
      country: "India, USA, UK",
      quote: "Our experience with AAA was excellent. The accreditation process was professional, well-structured, and conducted with integrity, providing valuable insights that strengthened our organization.",
      img: "/sme/case-studies/clarivate-certificate.jpg",
      logo: "/sme/case-studies/clarivate-logo.jpg",
    },
    {
      name: "Domus Salutis",
      country: "Italy",
      quote: "By working with the AAA, Domus Salutis has established a roadmap for ongoing growth in safety and medical technology.",
      img: "/sme/case-studies/domus-salutis-certificate.jpg",
      logo: "/sme/case-studies/domus-salutis-logo.jpg",
    },
    {
      name: "Monarch Master Injectors",
      country: "United States",
      quote: "Accreditation impact: 12% growth and 500+ students certified, with Google reviews now past 1,500 at a 5.0 rating.",
      img: "/sme/case-studies/monarch-master-injectors-certificate.jpg",
      logo: "/sme/case-studies/monarch-master-injectors-logo.png",
    },
  ],
} as const;

export const faq = {
  title: "FAQs",
  text: "Everything you need to know about AAA SMEs Accreditation: eligibility, timelines, validity, and how to get started.",
  items: [
    {
      q: "What is AAA SMEs accreditation?",
      a: "AAA SMEs Accreditation is a program for small and medium businesses that assesses how well your business is run and how prepared it is to grow. It helps you show credibility, build trust, and earn independent recognition for good business practices.",
    },
    {
      q: "What makes AAA different from other accreditation bodies?",
      a: "AAA focuses on business readiness, governance, and growth. Through an independent assessment, your business earns recognition based on established criteria that align with recognised accreditation principles.",
    },
    {
      q: "Who can apply for AAA SMEs accreditation?",
      a: "Any eligible small or medium enterprise can apply, across a wide range of industries. Whether you are well established or still growing, you can apply as long as you meet the mandatory accreditation requirements.",
    },
    {
      q: "How is funding readiness assessed?",
      a: "Your business is assessed across six areas: Financial & Funding Readiness, Operational Requirements, Management & Structure, Governance & Compliance, Market Presence & Growth, and Continuous Improvement. Together they show how prepared you are for funding, partnerships, and steady growth.",
    },
    {
      q: "How do I check whether my business is eligible?",
      a: "You can use the free Readiness Check above. It takes a couple of minutes and gives you an instant view of where your business stands and what to work on before you apply.",
    },
    {
      q: "How long does the accreditation process take?",
      a: "It depends on your business size, how ready you are, and the information you provide. Most assessments take typically 30 to 60 days, following a clear process of application, review, and decision.",
    },
    {
      q: "Can startups apply for accreditation?",
      a: "Yes. A startup can apply as long as it is actively operating and can show sound business practices, governance, and operational controls. Accreditation is open to SMEs at different stages, provided the business is genuinely up and running.",
    },
    {
      q: "How long is the accreditation valid?",
      a: "Your accreditation is valid for three years, as long as you continue to meet the required standards.",
    },
    {
      q: "How much does AAA SMEs accreditation cost?",
      a: "Cost depends on the size, complexity, and scope of the assessment. AAA gives each business a customised quote so the process fits its specific needs.",
    },
    {
      q: "How do I get started?",
      a: "Getting started is simple. Run the free Readiness Check above, or apply using the form on this page. Our team will walk you through the eligibility requirements, what to expect from the assessment, and your next steps.",
    },
  ],
} as const;

export const close = {
  eyebrow: "Start today",
  title: "Start Your Accreditation Journey",
  text: "Run the free readiness check, apply for accreditation, or book a meeting with our team.",
  photo: "/sme/sme-journey-team.jpg",
  photoAlt: "AAA assessors reviewing accreditation documents with an organisation's team",
  apply: "Apply for Accreditation",
  meeting: "Book a Meeting",
  download: "Download Application Form",
} as const;

/* The application form. Every field is required, as on the Fast Track page;
   the closed answers are checked against these same lists by the API. */
export const apply = {
  eyebrow: "Apply now",
  title: "Apply for SMEs Accreditation",
  text: "Tell us about your business. An AAA SMEs accreditation advisor will review your details and contact you with your eligibility, the next steps and a customised quote.",
  points: [
    "Independent, evidence-based assessment across six pillars",
    "A Business Readiness Score and a certificate valid for 3 years",
    "A customised quote for your business size and scope",
  ],
  step1: "Step 1 of 2 · Your details",
  step2: "Step 2 of 2 · Your business",
  formTitle: "Apply for accreditation",
  continue: "Continue",
  back: "Back",
  submit: "Send my application",
  submitting: "Sending",
  note: "Every field is required. Your application goes straight to an AAA accreditation advisor.",
  errorGeneric: "Something went wrong on our side. Please try again, or email us directly.",
  sectors: [
    "Manufacturing",
    "IT & Software Services",
    "Healthcare & Pharma",
    "Agri-Processing",
    "Textile & Apparel",
    "Clean Energy & Greentech",
    "Logistics & Transport",
    "Construction & Engineering",
    "Retail & E-commerce",
    "Consulting & Services",
    "Hospitality & Food",
    "Export & Import",
    "Other",
  ],
  employeeCounts: ["1 to 10", "11 to 50", "51 to 250", "More than 250"],
  timelines: ["Within a month", "1 to 3 months", "3 to 6 months", "Just researching"],
  contactLegend: "How should we contact you?",
  contactMethods: ["WhatsApp", "Phone call", "Email"],
  contactConfirm: {
    WhatsApp: "We'll message you on WhatsApp at",
    "Phone call": "We'll call you on",
    Email: "We'll email you at",
  },
  doneKicker: "Your application is in",
  doneTitle: "An AAA accreditation advisor will contact you",
  doneItems: [
    {
      lead: "Your application goes straight to an advisor,",
      body: "who reviews your business details and confirms your eligibility.",
    },
    {
      lead: "You'll get",
      body: "the documents to prepare, your timeline and a customised quote.",
    },
    {
      lead: "Have ready:",
      body: "your business registration, your latest financial records, and an outline of how the business is organised.",
    },
  ],
  readinessNote: "Your readiness check result is included with your application:",
} as const;

export const positionSuggestions = [
  "Founder",
  "CEO",
  "Managing Director",
  "Owner",
  "General Manager",
  "Operations Manager",
  "Finance Manager",
  "Quality Manager",
] as const;
