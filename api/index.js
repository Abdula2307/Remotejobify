// Vercel serverless entry. If the server fails to start, show why (temporary debugging).
let app;
let startupError = null;

try {
  app = require("../server.js").app;
} catch (err) {
  startupError = err;
  console.error("Startup error:", err);
}

module.exports = (req, res) => {
  if (startupError) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ startupError: String(startupError.message).slice(0, 300) }));
    return;
  }
  return app(req, res);
};
