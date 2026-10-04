const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const JOB_LIFETIME_DAYS = 30;
const CATEGORIES = {
  technology: "Technology",
  design: "Design",
  marketing: "Marketing",
  education: "Education",
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
  company: { type: String, required: true, trim: true, maxlength: 120 },
  location: { type: String, required: true, trim: true, maxlength: 120 },
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
    req.userId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: "Please log in again." });
  }
}

function toPublicJob(job) {
  const days = Math.floor((Date.now() - job.createdAt.getTime()) / 86400000);
  return {
    id: String(job._id),
    title: job.title,
    company: job.company,
    location: job.location,
    vacancies: job.vacancies,
    category: job.category,
    categoryName: CATEGORIES[job.category],
    description: job.description,
    postedDaysAgo: days,
    postedAt: job.createdAt,
    application: { type: job.applyMethod, url: job.applyValue },
  };
}

function cleanApply(method, value) {
  if (method === "website") {
    try {
      const u = new URL(value);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
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
app.use(express.json({ limit: "20kb" }));

app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("DB connection failed:", err.message);
    res.status(503).json({ error: "Database unavailable. Try again shortly." });
  }
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
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
  wrap(async (req, res) => {
    const cutoff = new Date(Date.now() - JOB_LIFETIME_DAYS * 86400000); // hide instantly even if TTL sweep is late
    const jobs = await Job.find({ createdAt: { $gt: cutoff } }).sort({ createdAt: -1 }).limit(500);
    res.json(jobs.map(toPublicJob));
  })
);

app.get(
  "/api/jobs/:id",
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Job not found." });
    const cutoff = new Date(Date.now() - JOB_LIFETIME_DAYS * 86400000);
    const job = await Job.findOne({ _id: req.params.id, createdAt: { $gt: cutoff } });
    if (!job) return res.status(404).json({ error: "Job not found." });
    res.json(toPublicJob(job));
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
        company: b.company,
        location: b.location,
        vacancies: Number(b.vacancies),
        category: b.category,
        description: b.description,
        applyMethod: b.applyMethod,
        applyValue: apply,
      });
      res.status(201).json(toPublicJob(job));
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

app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Serve the front end from the same server (no CORS needed)
app.use(express.static(path.join(__dirname, "..", "JB")));

async function start(port) {
  await connectDB();
  return app.listen(port, () => console.log(`RemoteJobify running on http://localhost:${port}`));
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
