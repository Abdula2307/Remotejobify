// Vercel serverless entry: all /api/* requests are handled by the Express app
const { app } = require("../server/server");
module.exports = app;
