require("dotenv").config();
const express = require("express");
const cors = require("cors");

if (!process.env.JWT_SECRET) {
  console.error("Missing JWT_SECRET. Copy .env.example to .env and set one before starting the server.");
  process.exit(1);
}

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const progressRoutes = require("./routes/progress");

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`UI/UX Roadmap backend running on http://localhost:${PORT}`);
});
