const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDb, writeDb } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

function emailKey(e) {
  return (e || "").trim().toLowerCase();
}
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, goal: u.goal, bio: u.bio, joinDate: u.joinDate };
}

router.post("/signup", async (req, res) => {
  const { name, email: rawEmail, password, goal } = req.body || {};
  const email = emailKey(rawEmail);

  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Enter a valid email address." });
  if (!password || password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters." });

  const db = readDb();
  if (db.users.find((u) => u.email === email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    email,
    passwordHash,
    goal: goal || "",
    bio: "",
    joinDate: new Date().toISOString(),
  };
  db.users.push(user);
  db.progress[user.id] = { phases: {}, tech: {}, projects: {}, hrsPerDay: 3, activity: [] };
  writeDb(db);

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email: rawEmail, password } = req.body || {};
  const email = emailKey(rawEmail);
  const db = readDb();
  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "No account found with that email." });

  const ok = await bcrypt.compare(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Incorrect password." });

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/me", authRequired, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.json({ user: publicUser(user) });
});

module.exports = router;
