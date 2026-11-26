const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("dotenv").config();
const express = require("express");
const cors = require("cors");

if (!process.env.JWT_SECRET) {
  console.warn("Warning: Missing JWT_SECRET in environment. Using fallback secret — set JWT_SECRET in your host environment variables for production.");
  process.env.JWT_SECRET = crypto
    .createHash("sha256")
    .update(__dirname + "|" + (process.env.VERCEL_PROJECT_ID || process.env.VERCEL_URL || "uiux-roadmap-dev"))
    .digest("hex");
}

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const progressRoutes = require("./routes/progress");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

const FRONTEND_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(__dirname, "public");
const HTML_FILE = [
  path.join(FRONTEND_DIR, "uiux-developer-roadmap.html"),
  path.join(PUBLIC_DIR, "uiux-developer-roadmap.html"),
].find((p) => fs.existsSync(p));
const LOGO_FILE = [
  path.join(FRONTEND_DIR, "cg.png"),
  path.join(PUBLIC_DIR, "cg.png"),
].find((p) => fs.existsSync(p));

app.get(["/", "/uiux-developer-roadmap.html"], (req, res, next) => {
  if (HTML_FILE && fs.existsSync(HTML_FILE)) return res.sendFile(HTML_FILE);
  return next();
});
app.get(["/cg.png", "/favicon.ico", "/favicon.png"], (req, res) => {
  if (LOGO_FILE && fs.existsSync(LOGO_FILE)) return res.sendFile(LOGO_FILE);
  return res.status(204).end();
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "uiux-roadmap-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/progress", progressRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error." });
});

if (require.main === module && !process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`UI/UX Roadmap backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
