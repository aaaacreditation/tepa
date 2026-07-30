export const site = {
  org: "American Accreditation Association",
  shortOrg: "AAA",
  calendly: "https://calendly.com/accreditationaaa/consultation-call-am",
  quote: "https://aaa-accreditation.org/get-a-quote/",
  directory: "https://aaa-accreditation.org/accredited-organizations/",
  website: "https://aaa-accreditation.org",
  phoneLabel: "+1 (571) 601 2616",
  phoneHref: "tel:+15716012616",
  email: "Info@aaa-accreditation.org",
  address: ["8609 Westwood Center Drive", "Tysons Corner, VA 22182, USA"],
  videoId: "VDBR_9b73bs",
  videoTitle: "AAA Accreditation process experience | NEMT Startup Coach USA",
  social: [
    { name: "Facebook", href: "https://www.facebook.com/AAA.Accreditations/" },
    { name: "Twitter", href: "https://twitter.com/AAAccreditation" },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/aaa-accreditation" },
  ],
} as const;

export const nav = [
  { label: "Benefits", href: "#benefits" },
  { label: "Journey", href: "#journey" },
  { label: "In Practice", href: "#in-practice" },
  { label: "At a Glance", href: "#at-a-glance" },
] as const;

export const hero = {
  eyebrow: "Accreditation for Training Providers",
  title: "Accreditation of Training & Education Providers",
  titleLead: "Accreditation of",
  titleAccent: "Training & Education",
  titleTail: "Providers",
  lede:
    "Give your training programs credibility that travels across borders and gain globally recognized accreditation to make your training programs stand out, attract quality students, and drive revenue growth.",
  primaryCta: "Book a Free Consultation",
  secondaryCta: "View Accreditation Requirements",
  stats: [
    { value: "58+", unit: "countries", label: "Countries served worldwide" },
    { value: "3", unit: "years", label: "Accreditation validity" },
    { value: "19,847", unit: "certificates", label: "Accredited certificates" },
  ],
} as const;

export const benefits = {
  eyebrow: "The Value of Accreditation",
  title: "Why Accreditation Makes a Difference",
  items: [
    {
      title: "Attract Learners and Grow Your Business",
      body:
        "Differentiate your programs from competitors, attract more learners, enter new markets, and create new partnership opportunities—providing a stronger foundation for sustainable revenue growth.",
    },
    {
      title: "Increase Visibility and Credibility",
      body:
        "Use the AAA Accreditation Symbol on approved training materials, certificates, and promotional content. Add eligible certified trainees to the American Directory of Competent Personnel and issue verifiable digital certificates.",
    },
    {
      title: "Provide Proof of Quality",
      body:
        "Demonstrate that your organization is committed to maintaining high standards across its course materials, trainers, delivery methods, and quality controls.",
    },
  ],
} as const;

export const journey = {
  eyebrow: "Your Accreditation Journey",
  title: "How Accreditation Works",
  lede: "A clear four-step process, supported by AAA at every stage.",
  stages: [
    {
      title: "Application",
      body:
        "Submit information about your organization, training programs, trainers, delivery methods, and quality processes. Our team reviews your application and guides you through the required documentation.",
    },
    {
      title: "Assessment",
      body:
        "An experienced AAA assessor evaluates your documents and training provision against the applicable accreditation requirements. Any areas for improvement are clearly communicated for corrective action.",
    },
    {
      title: "Decision",
      body:
        "Once the assessment is complete and every requirement has been satisfactorily addressed, the findings are independently reviewed and a formal accreditation decision is made.",
    },
    {
      title: "Accreditation Certificate",
      body:
        "Your organization receives its accreditation certificate, valid for three years, and may use the Accreditation Symbol in accordance with the applicable rules.",
    },
  ],
} as const;

export const practice = {
  eyebrow: "Accreditation in Practice",
  title: "Trusted by Training & Education Providers Worldwide",
  lede:
    "See how accreditation is helping organizations strengthen credibility, reach new markets, and create measurable growth.",
  stories: [
    {
      organization: "Cinute Digital",
      location: "India",
      sector: "Information Technology",
      quote:
        "AAA’s global recognition has opened more doors with corporate clients and institutional partners.",
      logo: "/tepa/testimonial-cinute-logo.jpg",
      photo: "/tepa/testimonial-cinute-photo.jpg",
      photoAlt:
        "Cinute Digital representatives displaying their AAA accreditation certificate",
      photoPosition: "50% 42%",
    },
    {
      organization: "Aldelma Training Center",
      location: "Iraq · Jordan",
      sector: "Engineering",
      quote:
        "Accreditation helped us gain preferred-vendor status with government entities and attract multinational corporate clients.",
      logo: "/tepa/testimonial-aldelma-logo.jpg",
      photo: "/tepa/testimonial-aldelma-photo.jpg",
      photoAlt:
        "Aldelma Training Center representative holding a framed AAA accreditation certificate",
      photoPosition: "50% 34%",
    },
    {
      organization: "Monarch Master Injector",
      location: "USA",
      sector: "Cosmetology",
      quote:
        "Accreditation contributed to 12% growth, supported more than 500 students, and helped us build over 1,500 five-star reviews.",
      logo: "/tepa/testimonial-monarch-logo.png",
      photo: "/tepa/testimonial-monarch-photo.jpg",
      photoAlt:
        "Monarch Master Injector training group gathered for a professional education event",
      photoPosition: "50% 48%",
    },
  ],
} as const;

export const glance = {
  eyebrow: "Accreditation at a Glance",
  title: "Is Accreditation Right for Your Organization?",
  lede:
    "Understand who can apply, what AAA evaluates, and what your organization receives following accreditation.",
  items: [
    {
      title: "Who Can Apply?",
      body:
        "Training centres, professional academies, corporate training departments, online learning providers, industry associations, healthcare training organizations, and other institutions delivering structured education or professional development programs.",
    },
    {
      title: "What Will Be Evaluated?",
      body:
        "AAA assessors evaluate submitted training materials against recognized good practices and review the qualifications, professional experience, and competence of the instructors delivering the programs.",
    },
    {
      title: "What Will You Receive?",
      body:
        "An accreditation certificate valid for three years, permission to use the Accreditation Symbol for the approved scope, and a listing in the AAA directory of accredited organizations.",
    },
    {
      title: "Access to the ADCP Directory",
      badge: "Exclusive to accredited organizations",
      body:
        "Secure access to the American Directory of Competent Personnel, where you can validate and showcase the competencies of certified trainees, staff, and students and manage eligible personnel.",
    },
  ],
} as const;

export const apply = {
  eyebrow: "Next Step",
  title: "Ready to apply?",
  body:
    "Send your details and an assessor will come back to you within 48 hours with the exact documents your program needs. No obligation, no cost to enquire.",
  primaryCta: "Yes, Show Me How",
  secondaryCta: "Talk to an Assessor",
  captionTitle: "Accreditation Certificate",
  captionBody: "Issued to providers who meet the AAA standard, valid for three years.",
} as const;

export const formCopy = {
  badge: "Quick Eligibility Check",
  title: "Find out whether your programs are eligible",
  note: "No obligation. Receive guidance on requirements and next steps within 48 hours.",
  submit: "Check My Eligibility",
  submitting: "Sending",
  successTitle: "Enquiry received",
  successBody:
    "Thank you. An assessor will be in touch within 48 hours. If it is urgent, book a consultation call and we will speak sooner.",
  successCta: "Book a Consultation Call",
  errorGeneric: "Something went wrong on our side. Please try again, or email us directly.",
} as const;

/*
 * Compatibility data for legacy section components that remain in the project
 * but are no longer rendered by /tepa.
 */
export const marquee = [
  "Permission to display the AAA Accreditation Symbol",
  "Listing in the American Directory of Competent Personnel",
  "Digital certificate service for your delegates",
] as const;

export const pillars = benefits.items.map((item, index) => ({
  index: String(index + 1).padStart(2, "0"),
  icon: (["value", "satisfaction", "quality"] as const)[index],
  title: item.title,
  points: [item.body],
}));

export const process = {
  ...journey,
  stages: journey.stages.map((stage, index) => ({
    ...stage,
    n: String(index + 1),
  })),
};

export const requirements = {
  eyebrow: "What We Look For",
  title: "Accreditation Requirements",
  lede:
    "AAA reviews both the organization providing the training and the people responsible for delivering it.",
  groups: [
    {
      key: "providers",
      label: "For Training & Education Providers",
      items: [
        "Training materials must cover the applicable learning outcomes and remain relevant, complete, and current.",
      ],
    },
    {
      key: "trainers",
      label: "For Trainers",
      items: [
        "Trainers must demonstrate relevant qualifications, professional experience, and training competence.",
      ],
    },
  ],
} as const;

export const symbol = {
  eyebrow: "The Mark of Recognition",
  title: "Put the AAA Symbol on everything you teach",
  body:
    "Accredited providers may display the symbol on approved course materials, certificates, and promotional content.",
  points: [
    "Displayed on approved training materials and certificates",
    "Unique provider reference",
    "Verifiable by delegates and employers",
  ],
  cta: "Free Consultation, 30 Minute Call",
} as const;

export const why = {
  eyebrow: "In Their Words",
  title: "Why choose AAA for accreditation?",
  lede: "Hear how an accredited provider describes working through the AAA assessment.",
} as const;
