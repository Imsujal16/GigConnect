const navigation = [
  { href: "/findHelpNow", label: "Find help" },
  { href: "/howitworks", label: "How it works" },
  { href: "/contactus", label: "Contact" }
];

const services = [
  { name: "Plumbing", icon: "/assets/plumbing.png", description: "Leaks, fittings, bathroom repairs" },
  { name: "Electricians", icon: "/assets/electrician.png", description: "Repairs, wiring, installations" },
  { name: "Drivers", icon: "/assets/driver.png", description: "Daily travel and on-demand rides" },
  { name: "Home cleaning", icon: "/assets/home cleaning.png", description: "Deep cleaning and upkeep" },
  { name: "Delivery", icon: "/assets/delivery.png", description: "Local errands and same-day drops" },
  { name: "IT support", icon: "/assets/Screenshot 2025-09-23 151227.png", description: "Wi-Fi, laptop, CCTV, printer help" },
  { name: "Laundry", icon: "/assets/laundry.png", description: "Pickup, wash care, ironing" },
  { name: "Fitness", icon: "/assets/fitness.png", description: "Personal training and home sessions" }
];

module.exports = {
  brand: {
    name: "GigConnect",
    city: "Gurugram",
    tagline: "Verified local professionals across Gurugram.",
    phone: "+91 12345 67890",
    email: "support@gigconnect.com"
  },
  navigation,
  footer: {
    columns: [
      {
        heading: "Explore",
        links: [
          { href: "/", label: "Home" },
          { href: "/findHelpNow", label: "Find professionals" },
          { href: "/howitworks", label: "How it works" }
        ]
      },
      {
        heading: "Accounts",
        links: [
          { href: "/signup", label: "Create account" },
          { href: "/clientlogin", label: "Client login" },
          { href: "/professionallogin", label: "Professional login" }
        ]
      },
      {
        heading: "Professionals",
        links: [
          { href: "/register", label: "Join GigConnect" },
          { href: "/contactus", label: "Partner with us" },
          { href: "/contactus", label: "Support" }
        ]
      }
    ],
    socialLinks: [
      { href: "#", label: "Facebook", icon: "/assets/facebook.png" },
      { href: "#", label: "LinkedIn", icon: "/assets/linked in.png" },
      { href: "#", label: "Instagram", icon: "/assets/insta logo.png" }
    ]
  },
  home: {
    hero: {
      eyebrow: "Trusted local services",
      title: "Find trusted local help without the guesswork.",
      description:
        "Search by service and area, compare verified workers quickly, and reach the right person with confidence.",
      searchPlaceholder: "Search electrician, plumber, driver...",
      locationPlaceholder: "Enter location or sector",
      quickSearches: ["Electrician", "Plumber", "Driver", "Home cleaning"],
      trustPills: ["Verified profiles", "Direct contact", "Local matching", "Clear ratings"],
      stats: [
        { value: "180+", label: "Active professionals" },
        { value: "4.8/5", label: "Average rating" },
        { value: "Same day", label: "Urgent support" }
      ]
    },
    services,
    capabilities: [
      {
        title: "Fast discovery",
        description: "Search by service, name, or area and reach relevant professionals faster."
      },
      {
        title: "Trust-first profiles",
        description: "Experience, ratings, verification, and distance are visible before you contact anyone."
      },
      {
        title: "Better for professionals",
        description: "Cleaner onboarding and stronger profiles help workers earn trust faster."
      }
    ],
    steps: [
      { step: "01", title: "Search", description: "Start with a service or location." },
      { step: "02", title: "Compare", description: "Review profiles, ratings, and experience." },
      { step: "03", title: "Contact", description: "Reach the right professional directly." }
    ],
    personas: [
      {
        badge: "For clients",
        title: "Find trusted help quickly",
        description: "A simpler way to book local professionals for urgent and everyday needs.",
        bullets: [
          "Search by category or area",
          "Compare trust and experience",
          "Contact directly without friction"
        ]
      },
      {
        badge: "For professionals",
        title: "Present your work better",
        description: "A cleaner profile and onboarding flow that helps clients trust you faster.",
        bullets: [
          "Clear skill presentation",
          "Better first impression",
          "Local demand visibility"
        ]
      }
    ],
    testimonials: [
      {
        name: "Priya S",
        role: "Resident, DLF Phase 4",
        quote: "I found a reliable technician quickly, and the profile made the decision easy.",
        image: "/assets/Priya S.png"
      },
      {
        name: "Ravi Kumar",
        role: "Electrician partner",
        quote: "Clients understand my profile faster and I get better quality calls.",
        image: "/assets/Ravi kumar.png"
      },
      {
        name: "Neha Yadav",
        role: "Homeowner, Gurugram",
        quote: "Search feels clean, trust signals are clear, and the whole experience feels polished.",
        image: "/assets/atif 2ndpage.png"
      }
    ]
  },
  discover: {
    eyebrow: "Find professionals",
    title: "Search nearby professionals.",
    description: "Use service, name, or location search, then compare workers clearly.",
    quickFilters: ["Electrician", "Plumber", "Driver", "Home cleaning", "IT support", "Laundry"]
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "Simple steps for hiring and getting hired.",
    description: "GigConnect keeps search, trust, and contact simple for both sides.",
    outcomes: [
      { title: "Search quickly", description: "Start with a category, name, or location." },
      { title: "Compare clearly", description: "Review ratings, experience, and verification." },
      { title: "Move faster", description: "Reach out directly and get work started sooner." }
    ]
  },
  contact: {
    eyebrow: "Contact",
    title: "Talk to the GigConnect team.",
    description: "Reach out for support, partnerships, or onboarding help.",
    promises: [
      { title: "Support", description: "Questions about using the platform or service quality." },
      { title: "Partnerships", description: "Opportunities with communities, offices, and local networks." },
      { title: "Onboarding help", description: "Assistance for professionals joining the marketplace." }
    ]
  },
  auth: {
    client: {
      title: "Create your account",
      description: "Create a client account to track bookings, compare services, and hire with less friction.",
      benefits: [
        "Track live booking requests",
        "Keep trusted professionals in one place",
        "Stay ready for urgent needs"
      ]
    },
    clientLogin: {
      title: "Welcome back",
      description: "Log in to manage your bookings and continue where you left off."
    },
    proLogin: {
      title: "Professional login",
      description: "Manage your profile, review booking requests, and stay ready for local demand."
    },
    professional: {
      title: "Join the GigConnect network",
      description: "Create a strong professional profile with your skills, experience, and service area.",
      benefits: [
        "Show your core skills clearly",
        "Highlight your pricing and experience",
        "Receive local booking requests"
      ]
    },
    note: "Use the seeded demo accounts or create a fresh account to test the full MySQL-backed flow."
  }
};
