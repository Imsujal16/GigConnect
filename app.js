require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const { body, param, validationResult } = require("express-validator");
const sanitizeHtml = require("sanitize-html");

const siteContent = require("./data/siteContent");
const seedData = require("./data/mysqlSeed");
const {
  initializeMySql,
  isDatabaseReady,
  getServiceCatalog,
  getHomeStats,
  getFeaturedProfessionals,
  getTestimonials,
  searchProfessionals,
  getProfessionalById,
  getProfessionalServiceOptions,
  createContactMessage,
  createClientAccount,
  deleteClientAccount,
  authenticateClient,
  createProfessionalAccount,
  deleteProfessionalAccount,
  authenticateProfessional,
  createBooking,
  updateProfessionalBookingStatus,
  getClientDashboardData,
  getProfessionalDashboardData,
  getServiceOptions
} = require("./lib/mysqlStore");

const app = express();
app.get('/', (req, res) => {
    res.send("GigConnect is Live on Railway!");
});

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "gigconnect-demo-secret";
const FALLBACK_WORKERS_PATH = path.join(__dirname, "public", "workers_data.json");
const DEFAULT_PHOTO = "/assets/gigconnect.logo.png";
const runtimeWorkers = [];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.locals.currentYear = new Date().getFullYear();
app.locals.formatCurrency = formatCurrency;
app.locals.formatShortDate = formatShortDate;
app.locals.formatStatusLabel = formatStatusLabel;
app.locals.formatTimeSlot = formatTimeSlot;

app.use((req, res, next) => {
  res.locals.brand = siteContent.brand;
  res.locals.navigation = siteContent.navigation;
  res.locals.footerContent = siteContent.footer;
  res.locals.currentPath = req.path;
  res.locals.sessionUser = req.session.user || null;
  res.locals.databaseConnected = isDatabaseReady();
  res.locals.demoCredentials = seedData.demoCredentials;
  res.locals.formatCurrency = formatCurrency;
  res.locals.formatShortDate = formatShortDate;
  res.locals.formatStatusLabel = formatStatusLabel;
  res.locals.formatTimeSlot = formatTimeSlot;
  next();
});

function sanitizeText(value = "") {
  return sanitizeHtml(String(value).trim(), {
    allowedTags: [],
    allowedAttributes: {}
  });
}

function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return skills.map((skill) => sanitizeText(skill)).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => sanitizeText(skill))
      .filter(Boolean);
  }

  return [];
}

function formatCurrency(value = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatShortDate(value) {
  if (!value) return "Not set";

  const rawValue = String(value).trim();
  const normalizedDate =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
        ? new Date(`${rawValue}T00:00:00`)
        : new Date(rawValue);

  if (Number.isNaN(normalizedDate.getTime())) {
    return sanitizeText(rawValue);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(normalizedDate);
}

function formatStatusLabel(value = "") {
  const safeValue = sanitizeText(value);
  if (!safeValue) return "Unknown";

  return safeValue.charAt(0).toUpperCase() + safeValue.slice(1);
}

function formatTimeSlot(value = "") {
  const safeValue = sanitizeText(value);
  if (!safeValue) return "Not set";

  return safeValue
    .replace(/\s*-\s*/g, " - ")
    .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
}

function createFormNotice(type, text) {
  return { type, text };
}

function consumeSessionNotice(req, key) {
  const notice = req.session[key] || null;
  delete req.session[key];
  return notice;
}

function destroySessionAndRedirect(req, res, redirectPath = "/") {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect(redirectPath);
  });
}

function createSearchDefaults(query = {}) {
  return {
    queryText: sanitizeText(query.skill || query.name || ""),
    city: sanitizeText(query.city || ""),
    sort: sanitizeText(query.sort || "relevance"),
    verifiedOnly: String(query.verified || "").toLowerCase() === "true"
  };
}

function getAuthBridgeNote() {
  if (isDatabaseReady()) {
    return `Demo client: ${seedData.demoCredentials.client.email} / ${seedData.demoCredentials.client.password}. Demo professional: ${seedData.demoCredentials.professional.email} / ${seedData.demoCredentials.professional.password}.`;
  }

  return "MySQL is not connected yet. Add your local MySQL credentials in .env to enable live accounts and bookings.";
}

function cloneHomeContent() {
  return {
    ...siteContent.home,
    hero: {
      ...siteContent.home.hero,
      stats: [...siteContent.home.hero.stats]
    },
    services: [...siteContent.home.services],
    testimonials: [...siteContent.home.testimonials]
  };
}

function normalizeFallbackWorker(worker = {}) {
  return {
    _id: worker._id || worker.id || `worker-${Date.now()}`,
    id: worker._id || worker.id || `worker-${Date.now()}`,
    name: sanitizeText(worker.name || "Professional"),
    ratings: Number(worker.ratings) || 0,
    experience: Number(worker.experience) || 0,
    distance: Number(worker.distance) || 0,
    photo: worker.photo ? sanitizeText(worker.photo) : "/assets/gigconnect.logo.png",
    contact: sanitizeText(worker.contact || ""),
    email: sanitizeText(worker.contact || ""),
    phone: sanitizeText(worker.contact || ""),
    city: sanitizeText(worker.city || "Gurugram"),
    area: sanitizeText(worker.city || "Gurugram"),
    skills: normalizeSkills(worker.skills),
    description: sanitizeText(worker.description || ""),
    isVerified: Boolean(worker.isVerified),
    createdAt: worker.createdAt || new Date().toISOString(),
    startingPrice: Number(worker.startingPrice || 499),
    hourlyRateInr: Number(worker.hourlyRateInr || worker.startingPrice || 499),
    totalReviews: Number(worker.totalReviews || 0)
  };
}

async function getFallbackWorkers() {
  try {
    const file = await fs.readFile(FALLBACK_WORKERS_PATH, "utf8");
    const parsed = JSON.parse(file);
    const fileWorkers = Array.isArray(parsed) ? parsed.map(normalizeFallbackWorker) : [];
    return [...runtimeWorkers, ...fileWorkers];
  } catch (error) {
    console.error("Could not read fallback workers:", error.message);
    return [...runtimeWorkers];
  }
}

function sortFallbackWorkers(workers, sortKey = "relevance") {
  const sorted = [...workers];

  sorted.sort((left, right) => {
    const leftVerified = left.isVerified ? 1 : 0;
    const rightVerified = right.isVerified ? 1 : 0;

    switch (sortKey) {
      case "rating":
        return (right.ratings - left.ratings) || (right.experience - left.experience);
      case "experience":
        return (right.experience - left.experience) || (right.ratings - left.ratings);
      case "distance":
        return (left.distance - right.distance) || (right.ratings - left.ratings);
      case "newest":
        return new Date(right.createdAt) - new Date(left.createdAt);
      default:
        return (
          (rightVerified - leftVerified) ||
          (right.ratings - left.ratings) ||
          (right.experience - left.experience) ||
          (left.distance - right.distance)
        );
    }
  });

  return sorted;
}

async function getWorkers({ queryText = "", cityQ = "", sortKey = "relevance", verifiedOnly = false }) {
  if (isDatabaseReady()) {
    return searchProfessionals({ queryText, cityQ, sortKey, verifiedOnly });
  }

  const fallbackWorkers = await getFallbackWorkers();
  const query = queryText.trim().toLowerCase();
  const city = cityQ.trim().toLowerCase();

  const filtered = fallbackWorkers.filter((worker) => {
    const matchesQuery =
      !query ||
      worker.name.toLowerCase().includes(query) ||
      worker.skills.some((skill) => skill.toLowerCase().includes(query));
    const matchesCity =
      !city ||
      worker.city.toLowerCase().includes(city) ||
      worker.area.toLowerCase().includes(city);
    const matchesVerified = !verifiedOnly || worker.isVerified;

    return matchesQuery && matchesCity && matchesVerified;
  });

  return sortFallbackWorkers(filtered, sortKey);
}

async function getWorkerCardOptions() {
  if (isDatabaseReady()) {
    const services = await getServiceCatalog(8);
    return services.map((service) => ({
      name: service.name,
      icon: service.icon,
      description: service.description,
      priceLabel: `From ${formatCurrency(service.startingPriceInr)}`,
      meta: `${service.professionalCount} professionals`
    }));
  }

  return siteContent.home.services.map((service) => ({
    ...service,
    priceLabel: "From ₹499",
    meta: "Demo data"
  }));
}

async function buildHomePageContent() {
  const homeContent = cloneHomeContent();
  const [featuredWorkers, dynamicServices] = await Promise.all([
    getWorkers({ sortKey: "rating" }).then((workers) => workers.slice(0, 6)),
    getWorkerCardOptions()
  ]);

  homeContent.services = dynamicServices;

  if (isDatabaseReady()) {
    const [stats, testimonials] = await Promise.all([getHomeStats(), getTestimonials(3)]);
    homeContent.hero.stats = stats;
    if (testimonials.length) {
      homeContent.testimonials = testimonials;
    }
  }

  return { homeContent, featuredWorkers };
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.redirect(role === "client" ? "/clientlogin" : "/professionallogin");
    }

    next();
  };
}

async function resolveServiceIdsFromInput(primarySkill, secondarySkills) {
  if (!isDatabaseReady()) return [];

  const skills = normalizeSkills([primarySkill, secondarySkills].filter(Boolean));
  if (!skills.length) return [];

  const serviceOptions = await getServiceOptions();
  const lowerSkills = skills.map((skill) => skill.toLowerCase());

  const matched = serviceOptions.filter((service) =>
    lowerSkills.some((skill) => service.name.toLowerCase().includes(skill) || skill.includes(service.name.toLowerCase()))
  );

  return matched.length ? matched.map((service) => service.id) : serviceOptions
    .filter((service) => lowerSkills[0] && lowerSkills[0].includes(service.name.toLowerCase()))
    .map((service) => service.id);
}

function renderContactPage(res, overrides = {}) {
  return res.render("contactus", {
    title: "Contact GigConnect",
    pageClass: "page-contact",
    contactContent: siteContent.contact,
    formData: {
      fullname: "",
      email: "",
      phone: "",
      subject: "",
      message: ""
    },
    formNotice: null,
    ...overrides
  });
}

function renderSignupPage(res, overrides = {}) {
  return res.render("signup", {
    title: "Create your client account | GigConnect",
    pageClass: "page-signup",
    authContent: siteContent.auth.client,
    bridgeNote: getAuthBridgeNote(),
    formNotice: null,
    formData: {
      fullname: "",
      email: "",
      phone: "",
      city: ""
    },
    ...overrides
  });
}

function renderClientLoginPage(res, overrides = {}) {
  return res.render("clientlogin", {
    title: "Client login | GigConnect",
    pageClass: "page-login",
    authContent: siteContent.auth.clientLogin,
    bridgeNote: getAuthBridgeNote(),
    formNotice: null,
    formData: {
      email: ""
    },
    ...overrides
  });
}

function renderProfessionalLoginPage(res, overrides = {}) {
  return res.render("professionallogin", {
    title: "Professional login | GigConnect",
    pageClass: "page-login",
    authContent: siteContent.auth.proLogin,
    bridgeNote: getAuthBridgeNote(),
    formNotice: null,
    formData: {
      email: ""
    },
    ...overrides
  });
}

function renderRegisterPage(res, overrides = {}) {
  return res.render("register", {
    title: "Register as a professional | GigConnect",
    pageClass: "page-register",
    authContent: siteContent.auth.professional,
    bridgeNote: getAuthBridgeNote(),
    formNotice: null,
    registerFormData: {
      name: "",
      email: "",
      phone: "",
      primarySkill: "",
      secondarySkills: "",
      city: "",
      area: "",
      experience: "",
      hourlyRate: "",
      photo: "",
      description: ""
    },
    ...overrides
  });
}

function renderBookingPage(res, overrides = {}) {
  return res.render("bookService", {
    title: "Book a professional | GigConnect",
    pageClass: "page-booking",
    professional: null,
    serviceOptions: [],
    formNotice: null,
    formData: {
      fullName: "",
      email: "",
      phone: "",
      preferredDate: "",
      preferredTimeSlot: "",
      addressArea: "",
      budget: "",
      serviceId: "",
      details: ""
    },
    ...overrides
  });
}

app.get("/", async (req, res) => {
  const { homeContent, featuredWorkers } = await buildHomePageContent();

  res.render("index", {
    title: "GigConnect | Find local professionals in Gurugram",
    pageClass: "page-home",
    homeContent,
    featuredWorkers
  });
});

app.get("/howitworks", (req, res) =>
  res.render("howitworks", {
    title: "How GigConnect works",
    pageClass: "page-how-it-works",
    howItWorksContent: siteContent.howItWorks,
    homeSteps: siteContent.home.steps
  })
);

app.get("/findHelpNow", (req, res) =>
  res.render("findHelpNow", {
    title: "Find trusted professionals | GigConnect",
    pageClass: "page-discover",
    discoverContent: siteContent.discover,
    searchDefaults: createSearchDefaults(req.query),
    scripts: ["/javascript/findhelpnow.js"]
  })
);

app.get("/contactus", (req, res) => renderContactPage(res));

app.post(
  "/contactus",
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 10, max: 20 })
      .withMessage("Please enter a valid phone number."),
    body("subject")
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 120 })
      .withMessage("Subject should stay under 120 characters."),
    body("message")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Please enter a message with at least 10 characters.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = {
      fullname: sanitizeText(req.body.fullname),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      subject: sanitizeText(req.body.subject),
      message: sanitizeText(req.body.message)
    };

    if (!errors.isEmpty()) {
      return renderContactPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderContactPage(res.status(503), {
        formNotice: createFormNotice("error", "MySQL is not connected yet, so contact messages cannot be saved right now."),
        formData
      });
    }

    await createContactMessage({
      fullName: formData.fullname,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message
    });

    return renderContactPage(res, {
      formNotice: createFormNotice(
        "success",
        "Thanks for reaching out. Your message has been saved in the GigConnect support inbox."
      )
    });
  }
);

app.get("/signup", (req, res) => renderSignupPage(res));

app.post(
  "/signup",
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone").trim().isLength({ min: 10, max: 20 }).withMessage("Please enter a valid phone number."),
    body("city").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your city."),
    body("password").trim().isLength({ min: 6 }).withMessage("Password should be at least 6 characters."),
    body("agree-terms").custom((value) => Boolean(value)).withMessage("Please accept the terms to continue."),
    body("confirm-password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = {
      fullname: sanitizeText(req.body.fullname),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      city: sanitizeText(req.body.city)
    };

    if (!errors.isEmpty()) {
      return renderSignupPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderSignupPage(res.status(503), {
        formNotice: createFormNotice("error", "MySQL is not connected yet, so account creation is unavailable."),
        formData
      });
    }

    try {
      const user = await createClientAccount({
        fullName: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        password: req.body.password
      });

      req.session.user = user;
      return res.redirect("/client/dashboard");
    } catch (error) {
      return renderSignupPage(res.status(error.statusCode || 500), {
        formNotice: createFormNotice("error", error.message || "Could not create the client account right now."),
        formData
      });
    }
  }
);

app.get("/clientlogin", (req, res) => renderClientLoginPage(res));

app.post(
  "/clientlogin",
  [
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("password").trim().isLength({ min: 6 }).withMessage("Please enter your password.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = { email: sanitizeText(req.body.email) };

    if (!errors.isEmpty()) {
      return renderClientLoginPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderClientLoginPage(res.status(503), {
        formNotice: createFormNotice("error", "MySQL is not connected yet, so login is unavailable."),
        formData
      });
    }

    const user = await authenticateClient(formData.email, req.body.password);
    if (!user) {
      return renderClientLoginPage(res.status(401), {
        formNotice: createFormNotice("error", "Incorrect email or password."),
        formData
      });
    }

    req.session.user = user;
    return res.redirect("/client/dashboard");
  }
);

app.get("/professionallogin", (req, res) => renderProfessionalLoginPage(res));

app.post(
  "/professionallogin",
  [
    body("email").trim().isLength({ min: 3 }).withMessage("Please enter your email or phone."),
    body("password").trim().isLength({ min: 6 }).withMessage("Please enter your password.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = { email: sanitizeText(req.body.email) };

    if (!errors.isEmpty()) {
      return renderProfessionalLoginPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderProfessionalLoginPage(res.status(503), {
        formNotice: createFormNotice("error", "MySQL is not connected yet, so login is unavailable."),
        formData
      });
    }

    const user = await authenticateProfessional(formData.email, req.body.password);
    if (!user) {
      return renderProfessionalLoginPage(res.status(401), {
        formNotice: createFormNotice("error", "Incorrect email, phone, or password."),
        formData
      });
    }

    req.session.user = user;
    return res.redirect("/professional/dashboard");
  }
);

app.get("/register", (req, res) => renderRegisterPage(res));

app.post(
  "/register",
  [
    body("fullname").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone").trim().isLength({ min: 10, max: 20 }).withMessage("Please enter a valid phone number."),
    body("city").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your city."),
    body("area").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your service area."),
    body("experience").isInt({ min: 0, max: 60 }).withMessage("Please enter valid years of experience."),
    body("hourly-rate").isInt({ min: 100, max: 100000 }).withMessage("Please enter a valid rupee rate."),
    body("password").trim().isLength({ min: 6 }).withMessage("Password should be at least 6 characters."),
    body("agree-terms").custom((value) => Boolean(value)).withMessage("Please accept the terms to continue."),
    body("confirm-password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const formData = {
      name: sanitizeText(req.body.fullname),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      primarySkill: sanitizeText(req.body["primary-skill"]),
      secondarySkills: sanitizeText(req.body["secondary-skills"]),
      city: sanitizeText(req.body.city),
      area: sanitizeText(req.body.area),
      experience: sanitizeText(req.body.experience),
      hourlyRate: sanitizeText(req.body["hourly-rate"]),
      photo: sanitizeText(req.body.photo),
      description: sanitizeText(req.body.description)
    };

    if (!errors.isEmpty()) {
      return renderRegisterPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        registerFormData: formData
      });
    }

    if (!isDatabaseReady()) {
      return renderRegisterPage(res.status(503), {
        formNotice: createFormNotice("error", "MySQL is not connected yet, so professional registration is unavailable."),
        registerFormData: formData
      });
    }

    const serviceIds = await resolveServiceIdsFromInput(formData.primarySkill, formData.secondarySkills);
    if (!serviceIds.length) {
      return renderRegisterPage(res.status(422), {
        formNotice: createFormNotice("error", "Please enter a skill that matches one of the platform service categories."),
        registerFormData: formData
      });
    }

    try {
      const user = await createProfessionalAccount({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        area: formData.area,
        experience: Number(formData.experience),
        hourlyRateInr: Number(formData.hourlyRate),
        photoUrl: formData.photo || undefined,
        description: formData.description || undefined,
        password: req.body.password,
        serviceIds
      });

      req.session.user = user;
      return res.redirect("/professional/dashboard");
    } catch (error) {
      return renderRegisterPage(res.status(error.statusCode || 500), {
        formNotice: createFormNotice("error", error.message || "Could not create the professional profile right now."),
        registerFormData: formData
      });
    }
  }
);

app.get("/client/dashboard", requireRole("client"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/clientlogin");
  }

  const dashboardData = await getClientDashboardData(req.session.user.id);
  return res.render("clientDashboard", {
    title: "Client dashboard | GigConnect",
    pageClass: "page-dashboard",
    dashboardData,
    formNotice: consumeSessionNotice(req, "clientDashboardNotice")
  });
});

app.post(
  "/client/delete-profile",
  requireRole("client"),
  [body("confirmDelete").custom((value) => Boolean(value)).withMessage("Please confirm before deleting your client profile.")],
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty() && !isDatabaseReady()) {
      req.session.clientDashboardNotice = createFormNotice(
        "error",
        "MySQL is not connected right now, so profile deletion is temporarily unavailable."
      );
      return res.redirect("/client/dashboard");
    }

    if (!errors.isEmpty()) {
      req.session.clientDashboardNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/client/dashboard");
    }

    try {
      await deleteClientAccount(req.session.user.id);
      return destroySessionAndRedirect(req, res, "/");
    } catch (error) {
      req.session.clientDashboardNotice = createFormNotice(
        "error",
        error.message || "Could not delete the client profile right now."
      );
      return res.redirect("/client/dashboard");
    }
  }
);

app.get("/professional/dashboard", requireRole("professional"), async (req, res) => {
  if (!isDatabaseReady()) {
    return res.redirect("/professionallogin");
  }

  const dashboardData = await getProfessionalDashboardData(req.session.user.id);
  return res.render("professionalDashboard", {
    title: "Professional dashboard | GigConnect",
    pageClass: "page-dashboard",
    dashboardData,
    formNotice: consumeSessionNotice(req, "professionalDashboardNotice")
  });
});

app.post(
  "/professional/delete-profile",
  requireRole("professional"),
  [body("confirmDelete").custom((value) => Boolean(value)).withMessage("Please confirm before deleting your professional profile.")],
  async (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty() && !isDatabaseReady()) {
      req.session.professionalDashboardNotice = createFormNotice(
        "error",
        "MySQL is not connected right now, so profile deletion is temporarily unavailable."
      );
      return res.redirect("/professional/dashboard");
    }

    if (!errors.isEmpty()) {
      req.session.professionalDashboardNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/professional/dashboard");
    }

    try {
      await deleteProfessionalAccount(req.session.user.id);
      return destroySessionAndRedirect(req, res, "/");
    } catch (error) {
      req.session.professionalDashboardNotice = createFormNotice(
        "error",
        error.message || "Could not delete the professional profile right now."
      );
      return res.redirect("/professional/dashboard");
    }
  }
);

app.post(
  "/professional/bookings/:bookingId/status",
  requireRole("professional"),
  [
    param("bookingId").isInt({ min: 1 }).withMessage("Please choose a valid booking request."),
    body("status").trim().isIn(["confirmed", "completed"]).withMessage("Please choose a valid booking action.")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty() && !isDatabaseReady()) {
      req.session.professionalDashboardNotice = createFormNotice(
        "error",
        "MySQL is not connected right now, so booking actions are temporarily unavailable."
      );
      return res.redirect("/professionallogin");
    }

    if (!errors.isEmpty()) {
      req.session.professionalDashboardNotice = createFormNotice("error", errors.array()[0].msg);
      return res.redirect("/professional/dashboard");
    }

    const bookingId = Number(req.params.bookingId);
    const nextStatus = sanitizeText(req.body.status);

    try {
      const updatedStatus = await updateProfessionalBookingStatus({
        bookingId,
        professionalId: req.session.user.id,
        nextStatus
      });

      const successMessage =
        updatedStatus === "confirmed"
          ? "Booking request accepted successfully."
          : "Booking marked as completed successfully.";

      req.session.professionalDashboardNotice = createFormNotice("success", successMessage);
    } catch (error) {
      req.session.professionalDashboardNotice = createFormNotice(
        "error",
        error.message || "Could not update that booking request right now."
      );
    }

    return res.redirect("/professional/dashboard");
  }
);

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/book-service/:professionalId", async (req, res) => {
  if (!isDatabaseReady()) {
    return renderBookingPage(res.status(503), {
      formNotice: createFormNotice("error", "MySQL is not connected yet, so booking is unavailable.")
    });
  }

  const professional = await getProfessionalById(Number(req.params.professionalId));
  if (!professional) {
    return renderBookingPage(res.status(404), {
      formNotice: createFormNotice("error", "That professional could not be found.")
    });
  }

  const serviceOptions = await getProfessionalServiceOptions(Number(req.params.professionalId));
  const user = req.session.user || {};

  return renderBookingPage(res, {
    professional,
    serviceOptions,
    formData: {
      fullName: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      preferredDate: "",
      preferredTimeSlot: "",
      addressArea: "",
      budget: professional.startingPrice || "",
      serviceId: serviceOptions[0] ? String(serviceOptions[0].id) : "",
      details: ""
    }
  });
});

app.post(
  "/book-service/:professionalId",
  [
    body("fullName").trim().isLength({ min: 2, max: 120 }).withMessage("Please enter your full name."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("phone").trim().isLength({ min: 10, max: 20 }).withMessage("Please enter a valid phone number."),
    body("preferredDate").isISO8601().withMessage("Please select a valid preferred date."),
    body("preferredTimeSlot").trim().isLength({ min: 3, max: 80 }).withMessage("Please choose a time slot."),
    body("addressArea").trim().isLength({ min: 3, max: 180 }).withMessage("Please enter your area or address."),
    body("budget").isInt({ min: 100, max: 100000 }).withMessage("Please enter a valid budget in rupees."),
    body("serviceId").isInt({ min: 1 }).withMessage("Please select a service.")
  ],
  async (req, res) => {
    const professionalId = Number(req.params.professionalId);
    const professional = isDatabaseReady() ? await getProfessionalById(professionalId) : null;
    const serviceOptions = isDatabaseReady() ? await getProfessionalServiceOptions(professionalId) : [];
    const errors = validationResult(req);
    const formData = {
      fullName: sanitizeText(req.body.fullName),
      email: sanitizeText(req.body.email),
      phone: sanitizeText(req.body.phone),
      preferredDate: sanitizeText(req.body.preferredDate),
      preferredTimeSlot: sanitizeText(req.body.preferredTimeSlot),
      addressArea: sanitizeText(req.body.addressArea),
      budget: sanitizeText(req.body.budget),
      serviceId: sanitizeText(req.body.serviceId),
      details: sanitizeText(req.body.details)
    };

    if (!professional) {
      return renderBookingPage(res.status(404), {
        formNotice: createFormNotice("error", "That professional could not be found."),
        professional,
        serviceOptions,
        formData
      });
    }

    if (!errors.isEmpty()) {
      return renderBookingPage(res.status(422), {
        formNotice: createFormNotice("error", errors.array()[0].msg),
        professional,
        serviceOptions,
        formData
      });
    }

    if (!isDatabaseReady()) {
      return renderBookingPage(res.status(503), {
        formNotice: createFormNotice("error", "MySQL is not connected yet, so booking is unavailable."),
        professional,
        serviceOptions,
        formData
      });
    }

    const bookingCode = await createBooking({
      clientId: req.session.user && req.session.user.role === "client" ? req.session.user.id : null,
      guestName: formData.fullName,
      guestEmail: formData.email,
      guestPhone: formData.phone,
      professionalId,
      serviceId: Number(formData.serviceId),
      preferredDate: formData.preferredDate,
      preferredTimeSlot: formData.preferredTimeSlot,
      addressArea: formData.addressArea,
      budgetInr: Number(formData.budget),
      details: formData.details
    });

    return renderBookingPage(res, {
      professional,
      serviceOptions,
      formNotice: createFormNotice(
        "success",
        `Booking request ${bookingCode} has been created successfully. The professional can now see it in their dashboard.`
      ),
      formData: {
        ...formData,
        details: ""
      }
    });
  }
);

app.get("/api/workers", async (req, res) => {
  try {
    const workers = await getWorkers({
      queryText: req.query.skill || req.query.name || "",
      cityQ: req.query.city || "",
      sortKey: req.query.sort || "relevance",
      verifiedOnly: String(req.query.verified || "").toLowerCase() === "true"
    });

    res.json(workers);
  } catch (error) {
    console.error("GET /api/workers error:", error.message);
    res.status(500).json([]);
  }
});

const workerValidators = [
  body("name").isString().trim().isLength({ min: 2, max: 100 }),
  body("city").isString().trim().isLength({ min: 2, max: 100 }),
  body("skills").custom((value) => {
    if (Array.isArray(value)) return true;
    if (typeof value === "string" && value.trim().length > 0) return true;
    throw new Error("skills required");
  }),
  body("experience").isInt({ min: 0, max: 100 })
];

app.post("/api/workers", workerValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const worker = {
    id: `runtime-${Date.now()}`,
    _id: `runtime-${Date.now()}`,
    name: sanitizeText(req.body.name),
    city: sanitizeText(req.body.city),
    area: sanitizeText(req.body.city),
    experience: Number(req.body.experience) || 0,
    ratings: Number(req.body.ratings) || 0,
    distance: Number(req.body.distance) || 0,
    photo: sanitizeText(req.body.photo || DEFAULT_PHOTO),
    contact: sanitizeText(req.body.contact || ""),
    email: sanitizeText(req.body.contact || ""),
    phone: sanitizeText(req.body.contact || ""),
    skills: normalizeSkills(req.body.skills),
    description: sanitizeText(req.body.description || ""),
    isVerified: Boolean(req.body.isVerified),
    createdAt: new Date().toISOString(),
    startingPrice: Number(req.body.startingPrice) || 499,
    hourlyRateInr: Number(req.body.hourlyRateInr) || 499,
    totalReviews: 0
  };

  runtimeWorkers.unshift(worker);
  res.status(201).json(worker);
});

async function startServer() {
  const state = await initializeMySql();

  if (state.connected) {
    console.log(`MySQL connected successfully to ${state.database}`);
  } else {
    console.warn(`MySQL connection unavailable: ${state.lastError}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
