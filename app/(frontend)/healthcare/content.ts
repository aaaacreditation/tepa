/* Every string on /healthcare lives here.
   The copy is the client's own healthcare material, carried over from the
   aaaacreditation/healthcare project so the two stay in agreement. */

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
  { label: "About", href: "#about" },
  { label: "Benefits", href: "#benefits" },
  { label: "Standards", href: "#standards" },
  { label: "Process", href: "#process" },
  { label: "Gallery", href: "#gallery" },
  { label: "Team", href: "#team" },
] as const;

export const hero = {
  eyebrow: "Healthcare Accreditation",
  titleLead: "Accreditation designed for",
  titleAccent: "sustainable healthcare excellence",
  title: "Accreditation designed for sustainable healthcare excellence",
  lede:
    "Internationally aligned standards supporting patient safety, clinical excellence, and organizational performance — for hospitals, clinics, and specialty centres worldwide.",
  secondaryCta: "See what we evaluate",
  stats: [
    { value: "53+", label: "Countries worldwide" },
    { value: "100+", label: "Surveyors" },
    { value: "ISQua", label: "Standards assessed by ISQua EEA" },
    { value: "24/7", label: "Continuous support" },
  ],
} as const;

export const about = {
  eyebrow: "About AAA",
  title: "Driving excellence in healthcare",
  paragraphs: [
    "The American Accreditation Association (AAA) stands as an independent, International Society for Quality in Health Care (ISQua) recognized accreditation body having its credibility backed by recognition from the US government.",
    "AAA’s reach extends across 53 countries, bringing a consistent, world-class standard of excellence to diverse industries. At its core, AAA is deeply committed to healthcare ensuring hospitals, clinics, and medical institutions meet the highest benchmarks of safety, service, and patient care.",
  ],
  isqua:
    "AAA Healthcare Accreditation Standards have been assessed by ISQua EEA, confirming alignment with international best practice requirements.",
  cards: [
    {
      icon: "target",
      title: "Our Mission",
      body:
        "Deliver independent, international accreditation programs that build trust and confidence in healthcare quality and safety.",
    },
    {
      icon: "eye",
      title: "Our Vision",
      body:
        "To provide globally accepted healthcare accreditation that protects public health, safety, and the environment while exceeding stakeholder expectations.",
    },
  ],
} as const;

export const presence = {
  eyebrow: "Global Presence",
  title: "AAA’s global presence",
  lede:
    "AAA’s reach extends across 53 countries, bringing a consistent, world-class standard of excellence to diverse industries. At its core, AAA is deeply committed to healthcare ensuring hospitals, clinics, and medical institutions meet the highest benchmarks of safety, service, and patient care. AAA’s story is one of connection, linking institutions to global best practices, fostering confidence in every certificate issued, and ultimately, building a new generation of trust.",
  mapAlt: "Map of AAA’s accreditation activity across more than 53 countries",
} as const;

export const benefits = {
  eyebrow: "Benefits",
  title: "Why AAA accreditation matters",
  lede: "Investing in accreditation is investing in the future of your healthcare facility.",
  items: [
    {
      icon: "shield",
      title: "Improved patient safety & outcomes",
      body: "Establish robust protocols that directly enhance patient care and safety.",
    },
    {
      icon: "clipboard",
      title: "Regulatory readiness & compliance",
      body:
        "Ensure your facility meets all national and international regulatory requirements.",
    },
    {
      icon: "bolt",
      title: "Seamless accreditation process",
      body:
        "Experience a streamlined, efficient journey to accreditation with expert guidance.",
    },
    {
      icon: "globe",
      title: "Global recognition & credibility",
      body:
        "Join a network of elite healthcare providers recognized for excellence worldwide.",
    },
    {
      icon: "trend",
      title: "Better returns on investment",
      body:
        "Optimize operations and improve efficiency, leading to better financial performance.",
    },
    {
      icon: "plane",
      title: "Enhanced medical tourism",
      body: "Attract international patients by demonstrating world-class standards.",
    },
  ],
} as const;

export const standards = {
  eyebrow: "Standards & Evaluation",
  title: "What we evaluate in your facility",
  lede:
    "AAA Healthcare Accreditation applies structured standards tailored to hospitals, outpatient and specialty clinics. Evaluation is proportionate to the facility’s scope of services and level of clinical risk.",
  areas: [
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
        "Appropriate patient assessment, infection prevention measures, and emergency preparedness relevant to the facility’s services.",
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

export const process = {
  eyebrow: "The Journey",
  title: "Accreditation process",
  lede:
    "AAA Healthcare Accreditation is based on professional judgment, evidence review, and practical evaluation of real clinical practice.",
  image: "/healthcare/process.png",
  imageAlt: "The four stages of the AAA healthcare accreditation process",
  note: "A clear, structured path to excellence, supported by AAA at every stage.",
} as const;

export const gallery = {
  eyebrow: "Gallery",
  title: "Excellence in Action",
  lede:
    "Surveys, clinical training, and accreditation handovers at AAA-accredited healthcare organizations.",
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

export const eligibility = {
  eyebrow: "Eligibility",
  title: "Who is eligible?",
  lede:
    "AAA Accreditation is designed for a wide range of healthcare facilities committed to quality.",
  entities: [
    "Public & private hospitals",
    "Specialty clinics",
    "Multi-specialty clinics",
    "Dental clinics",
    "Day care surgery centers",
    "Rehabilitation centers",
  ],
  cardTitle: "Ready to take the next step?",
  cardBody:
    "Send your facility details and a surveyor will come back to you within 48 hours with the standards that apply to your scope of services.",
  cardCta: "Start your application",
  standardsCta: "Healthcare Standards — Overview",
} as const;

export const organizations = {
  eyebrow: "Accredited Organizations",
  title: "Be a part of our accredited organizations",
  lede:
    "Hospitals, clinics, and wellness centres already holding AAA healthcare accreditation.",
  items: [
    {
      name: "Global Medical City",
      location: "Cairo — Egypt",
      logo: "/healthcare/organizations/globalmediaclcity.jpeg",
    },
    {
      name: "Domus Salutis Clinic",
      location: "Legnago — Italy",
      logo: "/healthcare/organizations/domus.jpeg",
    },
    {
      name: "Debeauty Clinic",
      location: "Colorado — USA",
      logo: "/healthcare/organizations/debeauty.jpeg",
    },
    {
      name: "Millennia Wellness",
      location: "Texas — USA",
      logo: "/healthcare/organizations/millennia.jpeg",
    },
  ],
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

export const apply = {
  eyebrow: "Next Step",
  title: "Apply for accreditation",
  body:
    "Send your facility details and a surveyor will come back to you within 48 hours with the standards that apply to your scope of services and the evidence your application needs. No obligation, no cost to enquire.",
  captionTitle: "Accreditation handover",
  captionBody:
    "Awarded to healthcare organizations that meet the AAA healthcare standard.",
  photo: "/healthcare/gallery/gallery-6.jpeg",
  photoAlt: "Hospital leadership receiving the AAA accreditation plaque",
} as const;

/* Facility type is the one field this form adds over TEPA's. It is folded into
   the stored message rather than given a column of its own, so the leads table
   and the dashboard stay shared with every other landing page. */
export const facilityTypes = [
  "Public or private hospital",
  "Specialty clinic",
  "Multi-specialty clinic",
  "Dental clinic",
  "Day care surgery centre",
  "Rehabilitation centre",
  "Diagnostic or imaging centre",
  "Other healthcare organization",
] as const;

export const formCopy = {
  badge: "Free Eligibility Check",
  title: "Find out which standards apply to your facility",
  note: "No obligation. A surveyor responds with your applicable standards within 48 hours.",
  submit: "Check my eligibility",
  submitting: "Sending",
  successTitle: "Enquiry received",
  successBody:
    "Thank you. A surveyor will review your facility and be in touch within 48 hours with the standards that apply to your scope of services.",
  errorGeneric: "Something went wrong on our side. Please try again, or email us directly.",
} as const;

/* The closing section repeats the hero form. Only the heading changes, so a
   visitor who read the whole page is not asked the identical question twice. */
export const applyForm = {
  badge: "Start your application",
  title: "Tell us about your facility",
} as const;
