/* Every string on /healthcare lives here.

   The facts are the client's own healthcare material: the ISQua EEA
   assessment, the 53 countries, the surveyor bench, the five standard areas,
   the four-step process with its three-year cycle, and the accredited
   organizations. The copy around them follows one sequence, top to bottom:

     1. the opportunity: why a clinic would change anything now
     2. the proof: a clinic that already did, and the ones beside it
     3. the teaching: what a surveyor actually checks, useful before anyone
        applies, which is what earns the right to ask
     4. the ownership experience: what the journey looks like step by step,
        and what the clinic holds at the end of it
     5. who it is for, and who it is not for, said out loud
     6. the investment, shown rather than hidden behind the call
     7. the objections, answered before they are raised on the phone

   Nothing here is scarcity that is not real. There is no countdown, no
   "limited places" and no invented number: the price, the three years and the
   48 hours are all true, and that is what the page leans on. */

export const site = {
  org: "American Accreditation Association",
  shortOrg: "AAA",
  programme: "AAA Healthcare Accreditation",
  calendly: "https://calendly.com/aaa-accreditation/30min",
  standards: "https://aaa-accreditation.org/healthcare-accreditation",
  website: "https://aaa-accreditation.org",
  phoneLabel: "+1 (571) 601 2616",
  phoneHref: "tel:+15716012616",
  whatsappLabel: "+1 (571) 601 2616",
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
  { label: "Why now", href: "#why" },
  { label: "Standards", href: "#standards" },
  { label: "Process", href: "#process" },
  { label: "Fees", href: "#fees" },
  { label: "FAQ", href: "#faq" },
] as const;

export const hero = {
  eyebrow: "Clinic & Healthcare Accreditation",
  titleLead: "Show every patient your clinic is",
  titleAccent: "independently accredited",
  title: "Show every patient your clinic is independently accredited",
  lede:
    "AAA accredits medical, dental, aesthetic and specialist clinics against international standards assessed by ISQua EEA. Apply in two minutes and a surveyor contacts you within 48 hours.",
  /* An accredited organization holding its award, shown whole beneath the
     promise. Shared with the gallery rather than duplicated: same people,
     same photograph. */
  photo: "/healthcare/gallery/gallery-7.jpeg",
  photoAlt:
    "Two Global Medical City clinicians holding their AAA healthcare accreditation plaque",
  photoCaption: "Global Medical City · Cairo, Egypt",
  /* Three numbers, each answering a different doubt: is it recognized
     anywhere, is there anyone to do the survey, and how long does it last. */
  proof: [
    { icon: "globe", value: "53+", label: "Countries\nworldwide" },
    { icon: "users", value: "100+", label: "Surveyors" },
    { icon: "shield", value: "3 yrs", label: "Accreditation\nvalidity" },
  ],
  /* The price, said once near the top. A clinic that cannot consider it
     leaves here instead of after a sales call, and one that can reads the
     rest of the page knowing what it is weighing. */
  price: "Fees start at USD 4,000 and are set by the size of your clinic.",
  isquaNote: "Healthcare Standards\nAssessed by ISQua EEA",
} as const;

/* 1. The opportunity. Why change anything, and why now. */
export const opportunity = {
  eyebrow: "Why clinics get accredited",
  title: "Patients compare clinics before they choose one",
  lede:
    "Accreditation gives patients, insurers and referral partners independent proof that your clinic meets an international standard, and gives your team one standard to work to.",
  items: [
    {
      icon: "shield",
      title: "Patients trust what they can check",
      body:
        "An independent survey confirms your clinic meets an international standard of safe care, so patients do not have to take your word for it.",
    },
    {
      icon: "building",
      title: "Stand out from the clinic next door",
      body:
        "Show the AAA Accreditation Symbol on your website, signage and patient materials, in line with the symbol rules.",
    },
    {
      icon: "plane",
      title: "Welcome international patients",
      body:
        "Patients who travel for treatment look for clinics that meet international standards. Accreditation shows them yours does.",
    },
    {
      icon: "clipboard",
      title: "Be ready when you are asked",
      body:
        "When an insurer, a corporate client or a regulator asks how you assure quality, your policies, licenses and records are already in order.",
    },
    {
      icon: "pulse",
      title: "Safer care, every day",
      body:
        "Consistent practice for patient identification, consent, infection prevention and emergency preparedness.",
    },
    {
      icon: "chart",
      title: "One standard across every branch",
      body:
        "Clear leadership responsibility, incident management and ongoing quality improvement, the same in every location.",
    },
  ],
  cta: "Apply for accreditation",
} as const;

/* 2. The proof. One clinic's own story, then the organizations beside it. */
export const story = {
  eyebrow: "Accredited clinic story",
  title: "See accreditation in practice",
  lede:
    "Discover how Domus Salutis approached AAA accreditation and what the journey meant for its clinic and team.",
  /* youtube-nocookie keeps the embed out of the visitor's ad profile until
     they press play, and the facade means nothing loads from YouTube at all
     before that click. The same approved video /clinic carries. */
  videoId: "SxgILo3vjGU",
  videoTitle: "Domus Salutis clinic accreditation story",
  poster: "/healthcare/gallery/gallery-2.jpeg",
  posterAlt: "The Domus Salutis clinical team holding their AAA accreditation award",
  organization: "Domus Salutis Clinic",
  location: "Legnago, Italy",
  logo: "/healthcare/organizations/domus.jpeg",
  points: [
    "A real clinic accreditation experience",
    "Insights directly from the clinic team",
    "The value of independent recognition",
  ],
} as const;

export const organizations = {
  label: "Already accredited by AAA",
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

export const gallery = {
  eyebrow: "Excellence in action",
  title: "Surveys, training and handovers",
  lede:
    "Moments from AAA-accredited healthcare organizations, from survey day to the plaque on the wall.",
  images: [
    {
      src: "/healthcare/gallery/gallery-1.jpeg",
      alt: "A clinician demonstrating an ultrasound examination to a group of healthcare professionals",
    },
    {
      src: "/healthcare/gallery/gallery-2.jpeg",
      alt: "The Domus Salutis clinical team holding their AAA accreditation award",
    },
    {
      src: "/healthcare/gallery/gallery-3.jpeg",
      alt: "Healthcare staff holding their course certificates after a clinical training programme",
    },
    {
      src: "/healthcare/gallery/gallery-4.jpeg",
      alt: "An emergency care team beside a resuscitation training bay",
    },
    {
      src: "/healthcare/gallery/gallery-5.jpeg",
      alt: "Clinicians at the Millennia Wellness reception",
    },
    {
      src: "/healthcare/gallery/gallery-6.jpeg",
      alt: "Hospital leadership receiving the AAA accreditation plaque",
    },
    {
      src: "/healthcare/gallery/gallery-7.jpeg",
      alt: "Two Global Medical City clinicians holding the AAA accreditation plaque",
    },
    {
      src: "/healthcare/gallery/gallery-8.jpeg",
      alt: "Hospital staff presenting the AAA accreditation plaque in the main lobby",
    },
  ],
} as const;

/* 3. The teaching. The five standard areas written as what a surveyor looks
   for, so a clinic manager can run the check on their own clinic tonight.
   Useful whether or not they ever apply, which is the point. */
export const standards = {
  eyebrow: "What a surveyor checks",
  title: "The five areas every clinic is surveyed on",
  lede:
    "Use this as a readiness check before you apply. Evaluation is proportionate to your clinic's services and level of clinical risk.",
  areas: [
    {
      icon: "shield",
      title: "Patient-centered care & rights",
      body:
        "Patients are correctly identified, give informed consent, and have their dignity and confidentiality respected.",
    },
    {
      icon: "pulse",
      title: "Clinical care & patient safety",
      body:
        "Patients are properly assessed, infection prevention is in place, and the clinic is prepared for the emergencies its services could bring.",
    },
    {
      icon: "userCheck",
      title: "Workforce & clinical competence",
      body:
        "Every professional is qualified, licensed and working within a clearly defined scope of practice.",
    },
    {
      icon: "building",
      title: "Facilities, equipment & environment",
      body: "Clinical areas are safe, and equipment is appropriate and properly maintained.",
    },
    {
      icon: "chart",
      title: "Governance, quality & improvement",
      body:
        "Leadership responsibility is defined, incidents are managed, and quality improves over time.",
    },
  ],
  standardsCta: "Read the healthcare standards overview",
} as const;

/* 4. The ownership experience. The approved four steps, then what the clinic
   holds at the end of them. */
export const process = {
  eyebrow: "The journey",
  title: "From application to accredited clinic",
  lede:
    "A clear, supported path. This is what happens at each step and what your team prepares.",
  steps: [
    {
      title: "Application",
      body:
        "Complete the accreditation application and provide initial information about your clinic, services, locations, and scope of practice.",
    },
    {
      title: "Preparation and document review",
      body:
        "Review the accreditation standards and submit the required policies, procedures, licenses, staff qualifications, and other supporting evidence.",
    },
    {
      title: "Independent survey",
      body:
        "Qualified AAA surveyors review how the standards are implemented within your clinic. The survey may include interviews, observations, and an on-site or remote visit, as applicable.",
    },
    {
      title: "Decision and accreditation",
      body:
        "The survey findings are independently reviewed. Once the applicable requirements are met, your clinic receives its accreditation and may use the Accreditation Symbol in accordance with the relevant rules.",
    },
  ],
  outcomes: [
    { value: "3 years", label: "Accreditation validity" },
    { value: "18 months", label: "Mid-cycle review" },
    { value: "Symbol", label: "The AAA Accreditation Symbol, for your clinic to display" },
  ],
} as const;

/* 5. Attract and repel. Saying who it is not for is what makes the people it
   is for believe the rest. */
export const fit = {
  eyebrow: "Is it right for your clinic?",
  title: "Built for clinics that want to be checked",
  suitable: {
    label: "A good fit",
    items: [
      "Medical and specialist clinics",
      "Dental clinics",
      "Aesthetic and cosmetic clinics",
      "Day-surgery and ambulatory care centers",
      "Diagnostic and rehabilitation clinics",
      "Independent and multi-location clinic groups",
    ],
  },
  unsuitable: {
    label: "Not the right fit",
    items: [
      "You want a certificate without an independent survey of how your clinic works",
      "Your clinic does not yet hold a valid operating license",
      "You are looking for a personal certificate. Accreditation is awarded to the clinic, not to one practitioner",
    ],
  },
  cardTitle: "Not sure your clinic is ready?",
  cardBody:
    "You do not need to have everything perfected before contacting AAA. Your surveyor explains the requirements that apply to your services and the right next step.",
  cardCta: "Apply for accreditation",
} as const;

/* 6. The investment. The same three sizes the form asks the clinic to choose
   between, so nothing on the page contradicts what the form says. */
export const clinicSizes = [
  { value: "Small clinic", price: "USD 4,000+" },
  { value: "Medium clinic", price: "USD 5,000+" },
  { value: "Large clinic", price: "USD 10,000+" },
] as const;

export const fees = {
  eyebrow: "Investment",
  title: "Clinic accreditation fees",
  lede:
    "Every clinic follows the same path to accreditation. The fee depends on your clinic's size.",
  from: "From",
  note:
    "Your surveyor confirms your clinic's size from your branches, team and services, then sends your exact quote.",
  cta: "Apply for accreditation",
} as const;

export const team = {
  eyebrow: "Our Team",
  title: "Meet our Team",
  lede: "Dedicated professionals committed to elevating healthcare standards worldwide.",
  hint: "Select a card to read the full biography",
  members: [
    {
      name: "Dr. Ruhina Khan",
      role: "Business Development Manager – Healthcare Accreditation",
      image: "/healthcare/team/ruhina.jpg",
      bio: "Dr. Ruhina Khan is a healthcare operations strategist and accreditation expert dedicated to advancing international quality standards. She works closely with healthcare institutions to strengthen compliance, optimize systems, and build globally recognized credibility through structured, sustainable growth strategies.",
    },
    {
      name: "Willena McGee",
      role: "Board Member",
      image: "/healthcare/team/willena.jpeg",
      bio: "Willena is an AAA board member and Founder and CEO of Uplifted Abilities. With over 20 years of experience in healthcare, project management, education, and consulting services, she guides new and existing Non-Emergency Medical Transportation (NEMT) providers through accreditation, regulatory compliance, and business planning.",
    },
    {
      name: "Antonia Vitori",
      role: "Healthcare Accreditation Surveyor",
      image: "/healthcare/team/antonia.jpg",
      bio: "Antonia brings many years of experience in the healthcare compliance sector and currently serves as an AAA Healthcare Accreditation Surveyor. She graduated from the Royal College of Surgeons in Ireland and is the Chief Governance, Risk and Compliance Officer at Brookhaven Healthcare Ireland. She previously held the position of Compliance, Quality and Safety Manager at Cowper Care Ireland.",
    },
    {
      name: "Dr. Rodolfo Buccico",
      role: "Accreditation Advisor",
      image: "/healthcare/team/rodolfo.jpg",
      bio: "Dr. Rodolfo Buccico is a seasoned medical and public health professional with extensive expertise in preventive medicine, epidemiology, and healthcare management. He currently serves as a Chief Medical Officer and advisor, bringing deep experience in public health strategy, real-world evidence, and patient-centred care. With a background in hygiene and preventive medicine from the Università Federico II di Napoli, he has held leadership roles including director of clinical services and senior healthcare administration.",
    },
    {
      name: "Orlando Santana",
      role: "Board Member",
      image: "/healthcare/team/orlando.jpg",
      bio: "With over 30 years of experience in development, Health and Safety across multinational organizations including American Airlines as the International Safety Head Lead, Orlando brings a wealth of expertise and a deep commitment to quality education in accreditation.",
    },
    {
      name: "Dr. Dawn Lindsey",
      role: "Board Member",
      image: "/healthcare/team/dawn.jpeg",
      bio: "Dr. Dawn brings more than 25 years of experience in regulatory compliance, quality assurance, and operational governance. She serves as the President and CEO of Vari-Tek LLC. Dr. Dawn holds a PhD in Public Policy and Social Change, as well as a Doctorate in Educational Leadership. She also maintains multiple professional certifications, including Six Sigma, ISO and internal auditing, OSHA reporting, and Title IX compliance.",
    },
    {
      name: "Kara Heinrichs",
      role: "Board Member",
      image: "/healthcare/team/kara.jpeg",
      bio: "Kara Heinrichs is a senior Learning and Leadership Development professional with extensive experience designing, implementing, and evaluating large-scale training and development programs across enterprise environments. She has led onboarding, compliance-aligned learning systems, and performance evaluation frameworks for global organizations including Meta, LiveRamp, Auth0, and the Port of Seattle. With a PhD in Organizational Development and strong expertise in governance, dashboards, and program evaluation, Kara brings a structured, quality-driven approach to workforce development.",
    },
    {
      name: "Michael Peters",
      role: "Board Member",
      image: "/healthcare/team/michael.jpg",
      bio: "Michael is the CEO of Lazarus Alliance Certification and has served as an independent information Cyber security consultant, executive, researcher and author. He is an internationally recognized and awarded security expert with years of IT and business leadership experience. He has contributed significantly to curriculum development for graduate degree programs in information security, advanced technology, cyberspace law, and privacy, and to industry standard professional certifications.",
    },
  ],
} as const;

/* 7. The objections, in the order a clinic owner raises them on a first call.
   Every answer is a fact the page already states somewhere else. */
export const faq = {
  eyebrow: "Questions",
  title: "What clinics ask before they apply",
  items: [
    {
      q: "How much does clinic accreditation cost?",
      a: "Fees start at USD 4,000 for a small clinic, USD 5,000 for a medium clinic and USD 10,000 for a large clinic. Your surveyor confirms your clinic's size from your branches, team and services, then sends your exact quote.",
    },
    {
      q: "Who recognizes AAA accreditation?",
      a: "AAA Healthcare Accreditation Standards have been assessed by ISQua EEA, the External Evaluation Association of the International Society for Quality in Health Care, confirming alignment with international best practice. AAA is an independent accreditation body based in Virginia, USA, active in more than 53 countries.",
    },
    {
      q: "Does my clinic need to be ready before we apply?",
      a: "No. You do not need to have everything perfected before contacting AAA. Your surveyor explains which standards apply to your services and what evidence to prepare.",
    },
    {
      q: "Is the survey on-site or remote?",
      a: "The survey may include interviews, observations, and an on-site or remote visit, as applicable to your clinic and its services.",
    },
    {
      q: "How long does accreditation last?",
      a: "Three years, with a mid-cycle review at 18 months.",
    },
    {
      q: "We have more than one branch. Can we apply together?",
      a: "Yes. Independent clinics and multi-location clinic groups are both eligible. Tell us how many branches you have in the form so the surveyor can plan around them.",
    },
    {
      q: "We are a hospital. Can we apply?",
      a: "Yes. AAA's healthcare standards cover hospitals as well as clinics. Choose Large in the form and list your departments under services; your surveyor confirms the scope and the quote.",
    },
    {
      q: "What happens after I send the form?",
      a: "An AAA surveyor reviews your answers and contacts you within 48 hours with the standards that apply to your clinic and the next step.",
    },
  ],
} as const;

export const apply = {
  eyebrow: "Next step",
  title: "Apply for clinic accreditation",
  body:
    "Tell us about your clinic. An AAA surveyor reviews your answers and contacts you within 48 hours with the standards that apply to your services and the next step.",
  captionTitle: "Accreditation handover",
  captionBody:
    "Awarded to healthcare organizations that meet the AAA healthcare standard.",
  photo: "/healthcare/gallery/gallery-6.jpeg",
  photoAlt: "Hospital leadership receiving the AAA accreditation plaque",
} as const;

/* The form's closed answers. The API route validates against these same lists,
   so an answer the form cannot produce is refused on the server as well. */
export const branchCounts = ["1", "2 to 3", "4 to 10", "More than 10"] as const;

export const employeeCounts = [
  "1 to 10",
  "11 to 25",
  "26 to 50",
  "51 to 100",
  "More than 100",
] as const;

/* Offered as suggestions under the position field; the visitor can type any
   title. Kept short: the list nudges toward consistent spelling, it is not a
   taxonomy. */
export const positionSuggestions = [
  "Owner / Founder",
  "Medical Director",
  "Clinic Manager",
  "Practice Manager",
  "CEO",
  "COO",
  "Managing Director",
  "Quality Manager",
  "Patient Safety Officer",
  "Operations Manager",
  "Administrator",
] as const;

export const formCopy = {
  title: "Apply for clinic accreditation",
  step1: "Step 1 of 2 · You and your clinic",
  step2: "Step 2 of 2 · Your clinic's size",
  continue: "Continue",
  back: "Back",
  submit: "Send my application",
  submitting: "Sending",
  note: "Every field is required. Your application goes straight to an AAA surveyor.",
  sizeHint: "The starting accreditation fee for each size.",
  doneKicker: "Your application is in",
  doneTitle: "An AAA surveyor will contact you within 48 hours",
  doneConfirm: "We will reach you at",
  doneItems: [
    {
      lead: "Your answers are reviewed first.",
      body: "The surveyor reads your clinic's size, branches and services before getting in touch.",
    },
    {
      lead: "You hear which standards apply.",
      body: "The five areas above, proportionate to your services and level of clinical risk.",
    },
    {
      lead: "You receive your quote.",
      body: "Based on your clinic's confirmed size, with the next step to begin.",
    },
  ],
  errorGeneric: "Something went wrong on our side. Please try again, or email us directly.",
} as const;
