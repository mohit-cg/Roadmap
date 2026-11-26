const express = require("express");
const { readDb, writeDb } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();
const VALID_STATUSES = ["not_started", "learning", "completed"];

function getBucket(db, userId) {
  if (!db.progress[userId]) {
    db.progress[userId] = { phases: {}, tech: {}, projects: {}, hrsPerDay: 3, activity: [] };
  }
  return db.progress[userId];
}

function logActivity(bucket, type, name, status) {
  bucket.activity = bucket.activity || [];
  bucket.activity.unshift({ type, name, status, date: new Date().toISOString() });
  if (bucket.activity.length > 80) bucket.activity.length = 80;
}

router.get("/", authRequired, (req, res) => {
  const db = readDb();
  res.json(getBucket(db, req.userId));
});

// Bulk replace — used once at signup to migrate a browser's local/guest progress
// into the account, and available generally for clients that want to push a
// full snapshot at once instead of one field at a time.
router.put("/", authRequired, (req, res) => {
  const incoming = req.body || {};
  const db = readDb();
  db.progress[req.userId] = {
    phases: incoming.phases && typeof incoming.phases === "object" ? incoming.phases : {},
    tech: incoming.tech && typeof incoming.tech === "object" ? incoming.tech : {},
    projects: incoming.projects && typeof incoming.projects === "object" ? incoming.projects : {},
    hrsPerDay: Number(incoming.hrsPerDay) || 3,
    activity: Array.isArray(incoming.activity) ? incoming.activity.slice(0, 80) : [],
  };
  writeDb(db);
  res.json(db.progress[req.userId]);
});

router.patch("/phase/:id", authRequired, (req, res) => {
  const { status, name } = req.body || {};
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status." });
  const db = readDb();
  const bucket = getBucket(db, req.userId);
  const prev = bucket.phases[req.params.id] || "not_started";
  bucket.phases[req.params.id] = status;
  if (prev !== status) logActivity(bucket, "phase", name || "Phase " + req.params.id, status);
  writeDb(db);
  res.json(bucket);
});

router.patch("/tech/:name", authRequired, (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status." });
  const db = readDb();
  const bucket = getBucket(db, req.userId);
  const key = decodeURIComponent(req.params.name);
  const prev = bucket.tech[key] || "not_started";
  bucket.tech[key] = status;
  if (prev !== status) logActivity(bucket, "tech", key, status);
  writeDb(db);
  res.json(bucket);
});

router.patch("/project/:id", authRequired, (req, res) => {
  const { status, name } = req.body || {};
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status." });
  const db = readDb();
  const bucket = getBucket(db, req.userId);
  const prev = bucket.projects[req.params.id] || "not_started";
  bucket.projects[req.params.id] = status;
  if (prev !== status) logActivity(bucket, "project", name || "Project " + req.params.id, status);
  writeDb(db);
  res.json(bucket);
});

router.patch("/hours", authRequired, (req, res) => {
  const { hrsPerDay } = req.body || {};
  const db = readDb();
  const bucket = getBucket(db, req.userId);
  bucket.hrsPerDay = Number(hrsPerDay) || 3;
  writeDb(db);
  res.json(bucket);
});

module.exports = router;
