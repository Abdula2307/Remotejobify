/* Pulls fresh remote jobs from open job feeds (Remotive, RemoteOK, Jobicy).
   Every imported job keeps a link and a credit back to the original listing. */

const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // keep only jobs posted in the last 3 days
const PER_SOURCE_LIMIT = 150;

function stripHtml(html) {
  return String(html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|ul|ol)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function parseDate(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return new Date(v < 1e12 ? v * 1000 : v);
  let s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s)) s = s.replace(" ", "T") + "Z"; // feeds without a timezone are UTC
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function httpsUrl(u) {
  try {
    const x = new URL(String(u));
    return x.protocol === "https:" || x.protocol === "http:" ? x.href : null;
  } catch {
    return null;
  }
}

const CATEGORY_WORDS = [
  ["design", /\b(design|designer|ux|ui|graphic|illustrat|creative|figma|brand)/i],
  ["marketing", /\b(market|seo|sales|growth|content|copywrit|social media|community|advertis|brand)/i],
  ["education", /\b(teach|tutor|instructor|educat|curriculum|lecturer|trainer|course)/i],
  ["technology", /\b(develop|engineer|software|devops|sysadmin|data|python|javascript|java|react|node|backend|frontend|full.?stack|qa|security|machine learning|ai|cloud|programmer|it support|mobile|android|ios)/i],
];
function guessCategory(text) {
  for (const [cat, re] of CATEGORY_WORDS) if (re.test(text)) return cat;
  return "other";
}

function build(source, sourceName, externalId, title, company, location, descHtml, url, postedAt, categoryHint) {
  title = String(title || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const link = httpsUrl(url);
  if (!title || !link || !externalId || !postedAt) return null;
  const now = Date.now();
  let t = postedAt.getTime();
  if (t > now) t = now;
  if (now - t > MAX_AGE_MS) return null; // older than 3 days: never imported
  const body = stripHtml(descHtml).slice(0, 3500);
  const lines = [];
  if (company) lines.push("Company: " + String(company).trim().slice(0, 100));
  if (location) lines.push("Location: " + String(location).trim().slice(0, 100));
  const head = lines.join("\n");
  const description = [head, body, "Source: " + sourceName + " — " + link].filter(Boolean).join("\n\n").slice(0, 5000);
  return {
    source,
    externalId: String(externalId).slice(0, 120),
    title,
    category: guessCategory(title + " " + (categoryHint || "")),
    description,
    applyUrl: link.slice(0, 500),
    createdAt: new Date(t),
  };
}

const SOURCES = [
  {
    key: "remotive",
    url: "https://remotive.com/api/remote-jobs?limit=" + PER_SOURCE_LIMIT,
    parse(data) {
      return (Array.isArray(data && data.jobs) ? data.jobs : []).map((j) =>
        build("remotive", "Remotive", j.id, j.title, j.company_name, j.candidate_required_location,
          j.description, j.url, parseDate(j.publication_date), j.category)
      );
    },
  },
  {
    key: "remoteok",
    url: "https://remoteok.com/api",
    parse(data) {
      return (Array.isArray(data) ? data : []).filter((j) => j && j.position).map((j) =>
        build("remoteok", "Remote OK", j.id || j.slug, j.position, j.company, j.location,
          j.description, j.url || j.apply_url, parseDate(j.epoch || j.date), (j.tags || []).join(" "))
      );
    },
  },
  {
    key: "jobicy",
    url: "https://jobicy.com/api/v2/remote-jobs?count=50",
    parse(data) {
      return (Array.isArray(data && data.jobs) ? data.jobs : []).map((j) =>
        build("jobicy", "Jobicy", j.id, j.jobTitle, j.companyName, j.jobGeo,
          j.jobDescription || j.jobExcerpt, j.url, parseDate(j.pubDate),
          [].concat(j.jobIndustry || []).join(" "))
      );
    },
  },
];

async function fetchJson(url, fetchImpl) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetchImpl(url, {
      signal: ctl.signal,
      headers: { Accept: "application/json", "User-Agent": "RemotifyJobs/1.0 (job board)" },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* Returns { jobs: [...], report: { source: "12 jobs" | "failed: reason" } }. One broken feed never stops the others. */
async function collect(fetchImpl = fetch) {
  const report = {};
  const results = await Promise.all(
    SOURCES.map(async (s) => {
      try {
        const jobs = s.parse(await fetchJson(s.url, fetchImpl)).filter(Boolean).slice(0, PER_SOURCE_LIMIT);
        report[s.key] = jobs.length + " new-enough jobs";
        return jobs;
      } catch (e) {
        report[s.key] = "failed: " + String(e.message).slice(0, 80);
        return [];
      }
    })
  );
  return { jobs: results.flat(), report };
}

module.exports = { collect, stripHtml, parseDate, guessCategory, build, MAX_AGE_MS };
