/* Every string on /clinic lives here.

   The copy is the client's approved clinic-accreditation material, carried
   over section for section from the signed-off design package so the page and
   the artwork stay in agreement. */

export const site = {
  org: "American Accreditation Association",
  shortOrg: "AAA",
  programme: "AAA Clinic Accreditation",
  website: "https://aaa-accreditation.org",
  clinicProgramme: "https://aaa-accreditation.org/healthcare-accreditation",
  phoneLabel: "+1 (571) 601 2616",
  phoneHref: "tel:+15716012616",
  email: "Info@aaa-accreditation.org",
  address: ["8609 Westwood Center Drive", "Tysons Corner, VA 22182, USA"],
  social: [
    { name: "LinkedIn", href: "https://www.linkedin.com/company/aaa-accreditation" },
    { name: "Twitter", href: "https://twitter.com/AAAccreditation" },
    { name: "Facebook", href: "https://www.facebook.com/AAA.Accreditations/" },
    { name: "Instagram", href: "https://www.instagram.com/aaa.accreditations/" },
  ],
} as const;

export const nav = [
  { label: "Why Accreditation", href: "#benefits" },
  { label: "What We Evaluate", href: "#standards" },
  { label: "The Process", href: "#process" },
  { label: "Is It Right for You", href: "#fit" },
  { label: "Team", href: "#team" },
] as const;

export const hero = {
  eyebrow: "Clinic Accreditation",
  titleLead: "Grow Patient Trust and Clinic Revenue Through",
  titleAccent: "Accreditation",
  title: "Grow Patient Trust and Clinic Revenue Through Accreditation",
  lede:
    "AAA accreditation helps clinics demonstrate their commitment to quality, patient safety, professional practice, and continuous improvement. Whether you are exploring accreditation for the first time or preparing to apply, our team can help you understand how it applies to your clinic.",
  photo: "/clinic/hero-domus-team.jpg",
  photoAlt:
    "The Domus Salutis clinic team presenting their AAA accreditation trophy",
  photoCaption: "Domus Salutis Clinic · Italy",
  /* Three numbers, and each one answers a different objection: reach, depth of
     the assessor bench, and who accredits the accreditor. */
  proof: [
    { icon: "globe", value: "57", label: "Countries\nWorldwide" },
    { icon: "people", value: "287", label: "Assessors &\nExperts" },
  ],
  isquaNote: "Healthcare Standards\nAccredited by ISQua EEA",
} as const;

export const benefits = {
  eyebrow: "The Value of Accreditation",
  title: "Why Accreditation Matters for Your Clinic",
  lede:
    "Accreditation provides independent recognition of your clinic's commitment to quality and gives you a practical framework for strengthening patient care, professional practices, and organizational performance.",
  items: [
    {
      icon: "shield",
      title: "Build Patient Trust",
      body:
        "Demonstrate that your clinic has been independently assessed against recognized standards for quality, patient safety, and professional practice.",
    },
    {
      icon: "pulse",
      title: "Strengthen Quality and Safety",
      body:
        "Use a structured accreditation framework to identify gaps, improve internal processes, reduce risks, and support continuous improvement across your clinic.",
    },
    {
      icon: "trend",
      title: "Stand Out and Support Growth",
      body:
        "Differentiate your clinic in a competitive market, strengthen its reputation, and create new opportunities with patients, partners, insurers, and other stakeholders.",
    },
  ],
  outcomesEyebrow: "Tangible Outcomes",
  outcomesTitle: "What Your Clinic Receives",
  outcomes: [
    {
      title: "Independent Recognition",
      body:
        "Confirmation that your clinic has been independently evaluated against the applicable healthcare standards.",
    },
    {
      title: "Three-Year Accreditation Certificate",
      body:
        "An official accreditation certificate valid for three years, subject to continued compliance with AAA requirements.",
    },
    {
      title: "Accreditation Symbol",
      body:
        "Permission to use the AAA Accreditation Symbol in accordance with the applicable rules and brand-use requirements.",
    },
  ],
  note:
    "Accreditation is not only recognition — it is a practical pathway to building a safer, stronger, and more trusted clinic.",
} as const;

export const standards = {
  eyebrow: "Clinic Accreditation Standards",
  title: "What We Evaluate",
  lede:
    "AAA accreditation considers the systems, people, and practices that support safe, consistent, and high-quality patient care. The assessment focuses on five key areas.",
  reassurance:
    "The assessment is designed to identify both strengths and opportunities for improvement — not simply to find areas of noncompliance.",
  areas: [
    {
      icon: "clipboard",
      title: "Leadership and Governance",
      body:
        "How responsibilities are defined, decisions are managed, and clinic policies support accountability, compliance, and quality.",
    },
    {
      icon: "shield",
      title: "Patient Care and Safety",
      body:
        "How the clinic protects patients throughout their journey, including consultation, consent, treatment, follow-up, and emergency preparedness.",
    },
    {
      icon: "userCheck",
      title: "Staff Qualifications and Competence",
      body:
        "Whether healthcare professionals have the appropriate qualifications, licenses, training, experience, and ongoing competency for their assigned roles.",
    },
    {
      icon: "building",
      title: "Facilities, Equipment and Infection Control",
      body:
        "How the clinic maintains a safe environment, manages medical equipment, applies infection-prevention practices, and responds to operational risks.",
    },
    {
      icon: "chart",
      title: "Quality and Continuous Improvement",
      body:
        "How the clinic monitors performance, manages incidents and complaints, identifies areas for improvement, and takes action to strengthen its services.",
    },
  ],
} as const;

export const process = {
  eyebrow: "A Clear, Supported Journey",
  title: "Your Path to Clinic Accreditation",
  lede:
    "AAA follows a clear and supportive process to help your clinic understand the requirements, prepare effectively, and demonstrate compliance with the applicable standards.",
  steps: [
    {
      title: "Application",
      body:
        "Complete the accreditation application and provide initial information about your clinic, services, locations, and scope of practice.",
    },
    {
      title: "Preparation and Document Review",
      body:
        "Review the accreditation standards and submit the required policies, procedures, licenses, staff qualifications, and other supporting evidence.",
    },
    {
      title: "Independent Survey",
      body:
        "Qualified AAA surveyors review how the standards are implemented within your clinic. The survey may include interviews, observations, and an on-site or remote visit, as applicable.",
    },
    {
      title: "Decision and Accreditation",
      body:
        "The survey findings are independently reviewed. Once the applicable requirements are met, your clinic receives its accreditation and may use the Accreditation Symbol in accordance with the relevant rules.",
    },
  ],
  photo: "/clinic/award-global-medical-center.jpg",
  photoAlt:
    "Global Medical Center representatives receiving an AAA accreditation award",
  caption: "Celebrating accreditation with Global Medical Center",
  badges: [
    { value: "3 years", label: "Accreditation validity" },
    { value: "18 months", label: "Mid-cycle review" },
  ],
} as const;

export const fit = {
  eyebrow: "Understanding Your Fit",
  title: "Is AAA Accreditation Right for Your Clinic?",
  lede:
    "AAA accreditation is designed for clinics seeking independent recognition of their commitment to quality, patient safety, professional practice, and continuous improvement.",
  suitable: {
    label: "Suitable for",
    title: "A Wide Range of Clinic Types",
    items: [
      "Medical and specialist clinics",
      "Dental clinics",
      "Aesthetic and cosmetic clinics",
      "Day-surgery and ambulatory care centers",
      "Diagnostic and rehabilitation clinics",
      "Independent and multi-location clinic groups",
    ],
  },
  readiness: {
    label: "Your clinic should be prepared to demonstrate",
    title: "The Foundations of Safe, Quality Care",
    items: [
      "Appropriate licenses and regulatory compliance",
      "Qualified and competent healthcare professionals",
      "Safe and consistent patient-care processes",
      "Suitable facilities, equipment, and infection controls",
      "Effective governance and quality-management practices",
    ],
  },
  reassuranceTitle: "Not sure whether your clinic is ready?",
  reassuranceBody:
    "You do not need to have everything perfected before contacting AAA. Our team can explain the applicable requirements and help you understand the appropriate next step.",
} as const;

export const story = {
  eyebrow: "Accredited Clinic Story",
  title: "See Accreditation in Practice",
  lede:
    "Discover how Domus Salutis approached AAA accreditation and what the journey meant for its clinic and team.",
  /* youtube-nocookie keeps the embed out of the visitor's ad profile until
     they actually press play, and the facade below means nothing loads from
     YouTube at all before that click. */
  videoId: "SxgILo3vjGU",
  videoTitle: "Domus Salutis clinic accreditation story",
  poster: "/healthcare/gallery/gallery-2.jpeg",
  posterAlt: "The Domus Salutis clinical team holding their AAA accreditation award",
  organization: "Domus Salutis Clinic",
  location: "Italy",
  monogram: "DS",
  points: [
    "A real clinic accreditation experience",
    "Insights directly from the clinic team",
    "The value of independent recognition",
  ],
} as const;

export const team = {
  eyebrow: "Our Healthcare Team",
  title: "Meet the Experts Supporting Your Accreditation Journey",
  lede:
    "Our healthcare accreditation professionals bring experience in clinical quality, compliance, patient safety, and healthcare management to every stage of the accreditation process.",
  hint: "Select a card to read the full biography",
  /* Two cards to a row on a phone leaves no room for the long form, which
     wraps to three lines and eats the card it is meant to explain. */
  hintShort: "Tap for bio",
  /* The portraits are shared with /healthcare rather than duplicated into
     /public/clinic: same people, same photographs. */
  members: [
    {
      name: "Dr. Ruhina Khan",
      role: "Business Development Manager – Healthcare Accreditation",
      image: "/healthcare/team/ruhina.jpg",
      bio: "Helps healthcare organizations understand the accreditation program, requirements, and appropriate next steps.",
    },
    {
      name: "Willena McGee",
      role: "Board Member",
      image: "/healthcare/team/willena.jpeg",
      bio: "Brings more than 20 years of healthcare, project-management, education, and compliance experience, including work with NEMT providers.",
    },
    {
      name: "Antonia Vitori",
      role: "Healthcare Accreditation Surveyor",
      image: "/healthcare/team/antonia.jpg",
      bio: "Brings extensive experience in healthcare governance, compliance, quality, and patient safety to the independent survey process.",
    },
    {
      name: "Dr. Rodolfo Buccico",
      role: "Accreditation Advisor",
      image: "/healthcare/team/rodolfo.jpg",
      bio: "Contributes expertise in medicine, public health, epidemiology, patient-centred care, and healthcare management.",
    },
  ],
} as const;

export const organizations = {
  label: "Clinics already accredited by AAA",
  items: [
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
  ],
} as const;

/* The band that closes every section between the hero form and the closing
   form. Each one is written out of the section above it — the sentence has to
   follow from what was just read, or it is a banner rather than a next step.

   They all point at the closing form rather than at whichever of the two is
   physically nearer. Scrolling is smooth site-wide, so sending a visitor to
   the hero form would animate them back up past everything they had just
   read and land them under the H1, which reads as the page resetting. The
   closing section is the one built to convert — form, reassurance, phone and
   email together — so every band goes forwards into it. */
export const sectionCtas = {
  benefits: {
    label: "Book a Free Consultation",
    href: "#closing-form",
  },
  standards: {
    label: "Talk to an Advisor",
    href: "#closing-form",
  },
  process: {
    label: "Start With a Free Consultation",
    href: "#closing-form",
  },
  story: {
    label: "Begin Your Accreditation",
    href: "#closing-form",
  },
  team: {
    label: "Book a Free Consultation",
    href: "#closing-form",
  },
} as const;

export const finalCta = {
  eyebrow: "Take the Next Step",
  title: "Ready to Strengthen Trust in Your Clinic?",
  body:
    "Speak with an AAA accreditation advisor to understand which standards apply to your clinic, what the process involves, and how to take the next step.",
  note: "Free consultation · No obligation · Guidance tailored to your clinic",
} as const;

/* The hero form and the closing form are the same component. Only the heading
   changes, so a visitor who read the whole page is not asked the identical
   question twice. */
export const formCopy = {
  badge: "Free Consultation",
  title: "Discover What Accreditation Can Do for Your Clinic",
  lede:
    "Tell us a little about your clinic, and an AAA advisor will explain the benefits, requirements, and next steps.",
  submit: "Book a Free Consultation Call",
  submitting: "Sending",
  note:
    "Free · No obligation · Your information is used only to respond to your request.",
  successTitle: "Thank you — your request is in",
  successBody:
    "An AAA advisor will contact you shortly to explain the benefits, requirements, and next steps for your clinic.",
  errorGeneric:
    "Something went wrong on our side. Please try again, or email us directly.",
} as const;

export const closingForm = {
  badge: "Book Your Consultation",
  title: "Tell us about your clinic",
} as const;
