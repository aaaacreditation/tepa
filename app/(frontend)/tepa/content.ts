/**
 * Every string on the TEPA landing page lives here so copy can be edited
 * without touching layout. House style: no dashes joining words.
 */

export const site = {
  org: "American Accreditation Association",
  shortOrg: "AAA",
  calendly: "https://calendly.com/accreditationaaa/consultation-call-am",
  quote: "https://aaa-accreditation.org/get-a-quote/",
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
  { label: "The Symbol", href: "#symbol" },
  { label: "Requirements", href: "#requirements" },
  { label: "Process", href: "#process" },
  { label: "Why AAA", href: "#why" },
] as const;

export const hero = {
  eyebrow: "American Accreditation Association",
  titleLead: "Accreditation Of",
  titleAccent: "Training & Education",
  titleTail: "Providers",
  lede: "AAA Accreditation for Training & Education gives your organization the opportunity to have its programs formally recognized. Carry the AAA Accreditation Symbol on your training materials and your certificates.",
  primaryCta: "Book a Free Consultation",
  secondaryCta: "See the Requirements",
  stats: [
    { value: "3 to 8", unit: "weeks", label: "Typical timeline" },
    { value: "3", unit: "years", label: "Certificate validity" },
    { value: "48", unit: "hours", label: "Response time" },
  ],
} as const;

export const marquee = [
  "Permission to display the AAA Accreditation Symbol",
  "Listing in the American directory of competent personnel",
  "Digital certificate service for your delegates",
  "Recognition that travels across borders",
] as const;

export const pillars = [
  {
    index: "01",
    icon: "value" as const,
    title: "We ensure Value",
    points: [
      "Permission to use the Accreditation Symbol and mark from AAA on your training materials, training certificates, and publicity materials.",
      "Access to add your certified trainees to the American directory of competent personnel.",
    ],
  },
  {
    index: "02",
    icon: "satisfaction" as const,
    title: "We ensure Satisfaction",
    points: [
      "A course carrying AAA accreditation attracts more delegates, opens new markets, and lifts your revenue.",
      "You demonstrate to customers that you are adopting new technology through our digital certificate service.",
    ],
  },
  {
    index: "03",
    icon: "quality" as const,
    title: "We ensure Quality",
    points: [
      "Accreditation from AAA is proof that your course material and training provision meet the high standard of professionalism AAA requires. It is a mark of quality.",
      "Access to our research and key insights into what delegates from specific industries really want from their trainer.",
    ],
  },
] as const;

export const symbol = {
  eyebrow: "The Mark of Recognition",
  title: "Put the AAA Symbol on everything you teach",
  body: "Accredited providers display the seal on course materials, presentations, publicity, and every certificate they issue. Each seal carries its own provider reference, so delegates and employers can verify the training is genuinely recognized.",
  points: [
    "Displayed on training materials and certificates",
    "Unique provider reference on every seal",
    "Verifiable by delegates and their employers",
  ],
  cta: "Free Consultation, 30 Minute Call",
} as const;

export const requirements = {
  eyebrow: "What We Look For",
  title: "Accreditation Requirements",
  lede: "Two sets of criteria sit at the heart of the assessment. One covers your organization and its course material, the other covers the people who deliver it.",
  groups: [
    {
      key: "providers",
      label: "For Training & Education Providers",
      items: [
        "The organization must provide proof that all applicable learning outcomes are covered in the training course.",
        "Training materials, including presentations, handouts, course tutor notes, exercises, and case studies, are relevant to the Body of Knowledge and are kept current as the training topic changes.",
      ],
    },
    {
      key: "trainers",
      label: "For Trainers",
      items: [
        "A minimum of five years of relevant training experience.",
        "Relevant qualifications and experience related to the area of training.",
        "Completion of a train the trainer program.",
      ],
    },
  ],
} as const;

export const process = {
  eyebrow: "The Route to Recognition",
  title: "How to gain AAA Accreditation in 3 to 8 weeks",
  lede: "Four stages, one assessor, and a decision committee that reviews every file before a certificate is issued.",
  stages: [
    {
      n: "1",
      title: "Complete your application",
      body: "Answer the questions in the application form as fully as you can and provide the relevant course materials together with the CVs of your tutors.",
    },
    {
      n: "2",
      title: "Accreditation assessment",
      body: "Our assessor conducts a desk assessment of your application and reviews your documents against best practice, then completes a report with a recommendation for the decision committee.",
    },
    {
      n: "3",
      title: "Accreditation decision",
      body: "The accreditation decision committee reviews the final reports to confirm that every accreditation requirement has been met. We inform you promptly of the outcome.",
    },
    {
      n: "4",
      title: "Accreditation certificate",
      body: "You receive your accreditation certificate, valid for three years, along with your provider reference and the right to display the AAA symbol.",
    },
  ],
} as const;

export const why = {
  eyebrow: "In Their Words",
  title: "Why choose AAA for accreditation?",
  lede: "Hear how an accredited provider describes working through the AAA assessment.",
} as const;

export const apply = {
  eyebrow: "Next Step",
  title: "Ready to apply?",
  body: "Send your details and an assessor will come back to you within 48 hours with the exact documents your program needs. No obligation, no cost to enquire.",
  primaryCta: "Yes, Show Me How",
  secondaryCta: "Talk to an Assessor",
  captionTitle: "Accreditation Certificate",
  captionBody: "Issued to providers who meet the AAA standard, valid for three years.",
} as const;

export const formCopy = {
  badge: "Quick Enquiry",
  title: "We respond within 48 hours",
  note: "Your details go straight to the accreditation team. We never share them.",
  submit: "Enquire Now",
  submitting: "Sending",
  successTitle: "Enquiry received",
  successBody:
    "Thank you. An assessor will be in touch within 48 hours. If it is urgent, book a consultation call and we will speak sooner.",
  successCta: "Book a Consultation Call",
  errorGeneric: "Something went wrong on our side. Please try again, or email us directly.",
} as const;
