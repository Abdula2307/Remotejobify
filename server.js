const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { normalizeLink, parseImage, checkAdmin } = require("./utils");

const JOB_LIFETIME_DAYS = 30;
const CATEGORIES = {
  technology: "Technology",
  design: "Design",
  marketing: "Marketing",
  education: "Education",
  other: "Other",
};

/* ---------- Models ---------- */
const User = mongoose.model(
  "User",
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 80 },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
    },
    { timestamps: true }
  )
);

const jobSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  vacancies: { type: Number, required: true, min: 1, max: 1000 },
  category: { type: String, required: true, enum: Object.keys(CATEGORIES) },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  applyMethod: { type: String, required: true, enum: ["website", "whatsapp", "email"] },
  applyValue: { type: String, required: true, trim: true, maxlength: 500 },
  // MongoDB deletes the document automatically 30 days after createdAt
  createdAt: { type: Date, default: Date.now, expires: JOB_LIFETIME_DAYS * 24 * 60 * 60 },
});
const Job = mongoose.model("Job", jobSchema);

/* ---------- Helpers ---------- */
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error("Set JWT_SECRET (16+ chars) in server/.env");
  process.exit(1);
}

const sign = (user) => jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.id) throw new Error("not a poster token");
    req.userId = payload.id;
    next();
  } catch {
    res.status(401).json({ error: "Please log in again." });
  }
}

// Admin-only routes (internships and scholarships)
function adminAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "admin") throw new Error("not admin");
    next();
  } catch {
    res.status(401).json({ error: "Admin login required." });
  }
}

// Reads the login token if there is one, but never blocks the request
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.userId = null;
  if (token) {
    try {
      req.userId = jwt.verify(token, JWT_SECRET).id || null;
    } catch {
      req.userId = null;
    }
  }
  next();
}

// Poster identity is never sent. Only a yes/no "mine" flag for the logged-in poster.
function toPublicJob(job, userId) {
  const days = Math.floor((Date.now() - job.createdAt.getTime()) / 86400000);
  return {
    id: String(job._id),
    title: job.title,
    vacancies: job.vacancies,
    category: job.category,
    categoryName: CATEGORIES[job.category],
    description: job.description,
    postedDaysAgo: days,
    postedAt: job.createdAt,
    application: { type: job.applyMethod, url: job.applyValue },
    mine: !!userId && String(job.owner) === String(userId),
  };
}

function cleanApply(method, value) {
  if (method === "website") {
    const text = String(value).trim();
    if (!text || /\s/.test(text)) return null;
    // "instagram.com/page" works as well as "https://instagram.com/page"
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : "https://" + text;
    try {
      const u = new URL(withScheme);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      if (!u.hostname.includes(".")) return null;
      return u.toString();
    } catch {
      return null;
    }
  }
  if (method === "email") {
    const e = String(value).trim();
    return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
  }
  if (method === "whatsapp") {
    const digits = String(value).replace(/[^\d]/g, "");
    return /^\d{7,15}$/.test(digits) ? digits : null;
  }
  return null;
}

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Try again." });
  });

/* ---------- Database (cached so serverless reuses it) ---------- */
let dbPromise = null;
function connectDB() {
  if (!dbPromise) {
    dbPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => Promise.all([Job.init(), User.init()]))
      .catch((err) => {
        dbPromise = null;
        throw err;
      });
  }
  return dbPromise;
}

/* ---------- App ---------- */
const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);
const smallJson = express.json({ limit: "20kb" });
const listingJson = express.json({ limit: "500kb" });
app.use((req, res, next) =>
  /^\/api\/(internships|scholarships)/.test(req.path) ? listingJson(req, res, next) : smallJson(req, res, next)
);

app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(503).json({
      error: "Database unavailable. Try again shortly.",
      reason: String(err.message).replace(/mongodb(\+srv)?:\/\/\S+/gi, "[hidden]").slice(0, 200),
    });
  }
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
const postLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20 });

app.post(
  "/api/auth/signup",
  authLimiter,
  wrap(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string")
      return res.status(400).json({ error: "Name, email and password are required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Enter a valid email address." });
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      return res.status(400).json({ error: "Password must contain 8 characters, including letters and numbers." });
    if (await User.exists({ email: email.toLowerCase().trim() }))
      return res.status(409).json({ error: "An account with this email already exists." });
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: sign(user), user: { name: user.name, email: user.email } });
  })
);

app.post(
  "/api/auth/login",
  authLimiter,
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    const user =
      typeof email === "string" && typeof password === "string"
        ? await User.findOne({ email: email.toLowerCase().trim() })
        : null;
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: "Incorrect email or password." });
    res.json({ token: sign(user), user: { name: user.name, email: user.email } });
  })
);

app.get(
  "/api/jobs",
  optionalAuth,
  wrap(async (req, res) => {
    const cutoff = new Date(Date.now() - JOB_LIFETIME_DAYS * 86400000); // hide instantly even if TTL sweep is late
    const jobs = await Job.find({ createdAt: { $gt: cutoff } }).sort({ createdAt: -1 }).limit(500);
    res.json(jobs.map((j) => toPublicJob(j, req.userId)));
  })
);

app.get(
  "/api/jobs/:id",
  optionalAuth,
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Job not found." });
    const cutoff = new Date(Date.now() - JOB_LIFETIME_DAYS * 86400000);
    const job = await Job.findOne({ _id: req.params.id, createdAt: { $gt: cutoff } });
    if (!job) return res.status(404).json({ error: "Job not found." });
    res.json(toPublicJob(job, req.userId));
  })
);

app.post(
  "/api/jobs",
  auth,
  postLimiter,
  wrap(async (req, res) => {
    const b = req.body || {};
    const apply = cleanApply(b.applyMethod, b.applyValue);
    if (!apply)
      return res.status(400).json({
        error:
          { whatsapp: "Enter a valid WhatsApp number.", email: "Enter a valid email address." }[b.applyMethod] ||
          "Enter a valid website URL (http/https).",
      });
    try {
      const job = await Job.create({
        owner: req.userId,
        title: b.title,
        vacancies: Number(b.vacancies),
        category: b.category,
        description: b.description,
        applyMethod: b.applyMethod,
        applyValue: apply,
      });
      res.status(201).json(toPublicJob(job, req.userId));
    } catch (err) {
      if (err.name === "ValidationError") return res.status(400).json({ error: "Please check all fields and try again." });
      throw err;
    }
  })
);

app.delete(
  "/api/jobs/:id",
  auth,
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Not found." });
    const r = await Job.deleteOne({ _id: req.params.id, owner: req.userId });
    res.status(r.deletedCount ? 200 : 404).json({ ok: !!r.deletedCount });
  })
);

/* ---------- Admin login (email + password come from environment variables only) ---------- */
app.post(
  "/api/admin/login",
  adminLimiter,
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    const result = checkAdmin(email, password);
    if (result === "not_configured") return res.status(503).json({ error: "Admin login is not set up yet." });
    if (result !== "ok") return res.status(401).json({ error: "Incorrect email or password." });
    res.json({ token: jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "12h" }) });
  })
);

/* ---------- Internships and Scholarships (only the admin can post or delete) ---------- */
const LISTING_LIFETIME_DAYS = 30;
const LISTINGS = {
  internships: { modelName: "Internship", uriEnv: "MONGODB_URI_INTERNSHIPS" },
  scholarships: { modelName: "Scholarship", uriEnv: "MONGODB_URI_SCHOLARSHIPS" },
};

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  link: { type: String, required: true, trim: true, maxlength: 500 },
  deadline: { type: String, trim: true, maxlength: 60, default: "" },
  hasImage: { type: Boolean, default: false },
  image: {
    data: { type: Buffer, select: false },
    contentType: { type: String, select: false },
  },
  // MongoDB deletes the document automatically 30 days after it was posted
  createdAt: { type: Date, default: Date.now, expires: LISTING_LIFETIME_DAYS * 24 * 60 * 60 },
});

// Each kind can use its own database (MONGODB_URI_INTERNSHIPS / MONGODB_URI_SCHOLARSHIPS).
// If that variable is not set, it falls back to the main database.
const listingModels = {};
function getListing(kind) {
  if (!listingModels[kind]) {
    const cfg = LISTINGS[kind];
    const uri = process.env[cfg.uriEnv];
    let promise;
    if (uri) {
      const conn = mongoose.createConnection(uri);
      const Model = conn.model(cfg.modelName, listingSchema, kind);
      promise = conn.asPromise().then(() => Model.init()).then(() => Model);
    } else {
      const Model = mongoose.models[cfg.modelName] || mongoose.model(cfg.modelName, listingSchema, kind);
      promise = connectDB().then(() => Model.init()).then(() => Model);
    }
    listingModels[kind] = promise.catch((err) => {
      delete listingModels[kind];
      throw err;
    });
  }
  return listingModels[kind];
}

function toPublicListing(kind, doc) {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description,
    link: doc.link,
    deadline: doc.deadline || "",
    imageUrl: doc.hasImage ? `/api/${kind}/${doc._id}/image` : null,
    postedDaysAgo: Math.floor((Date.now() - doc.createdAt.getTime()) / 86400000),
  };
}

Object.keys(LISTINGS).forEach((kind) => {
  const base = "/api/" + kind;

  // Public: list
  app.get(
    base,
    wrap(async (req, res) => {
      const Model = await getListing(kind);
      const cutoff = new Date(Date.now() - LISTING_LIFETIME_DAYS * 86400000);
      const items = await Model.find({ createdAt: { $gt: cutoff } }).sort({ createdAt: -1 }).limit(200);
      res.json(items.map((i) => toPublicListing(kind, i)));
    })
  );

  // Public: the picture
  app.get(
    base + "/:id/image",
    wrap(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end();
      const Model = await getListing(kind);
      const doc = await Model.findById(req.params.id).select("+image.data +image.contentType hasImage");
      if (!doc || !doc.hasImage || !doc.image || !doc.image.data) return res.status(404).end();
      res.set("Content-Type", doc.image.contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.send(doc.image.data);
    })
  );

  // Admin only: add
  app.post(
    base,
    adminAuth,
    wrap(async (req, res) => {
      const b = req.body || {};
      const link = normalizeLink(b.link);
      if (!link) return res.status(400).json({ error: "Enter a valid link (for example official-site.com/apply)." });

      let image = null;
      if (b.image) {
        image = parseImage(b.image);
        if (!image) return res.status(400).json({ error: "The image must be a JPG, PNG or WebP under 300 KB." });
      }

      const Model = await getListing(kind);
      try {
        const doc = await Model.create({
          title: b.title,
          description: b.description,
          link,
          deadline: typeof b.deadline === "string" ? b.deadline : "",
          hasImage: !!image,
          image: image ? { data: image.buffer, contentType: image.contentType } : undefined,
        });
        res.status(201).json(toPublicListing(kind, doc));
      } catch (err) {
        if (err.name === "ValidationError") return res.status(400).json({ error: "Please fill in the title and description." });
        throw err;
      }
    })
  );

  // Admin only: delete
  app.delete(
    base + "/:id",
    adminAuth,
    wrap(async (req, res) => {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Not found." });
      const Model = await getListing(kind);
      const r = await Model.deleteOne({ _id: req.params.id });
      res.status(r.deletedCount ? 200 : 404).json({ ok: !!r.deletedCount });
    })
  );
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Serve the front end from the same server (no CORS needed)
// Local use only (on Vercel the static files are served by Vercel itself)
app.use(express.static(__dirname, { dotfiles: "deny" }));

async function start(port) {
  await connectDB();
  return app.listen(port, () => console.log(`RemotifyJobs running on http://localhost:${port}`));
}

module.exports = { app, start };

if (require.main === module) {
  if (!process.env.MONGODB_URI) {
    console.error("Set MONGODB_URI in server/.env");
    process.exit(1);
  }
  start(process.env.PORT || 3000).catch((e) => {
    console.error("Could not start:", e.message);
    process.exit(1);
  });
}
