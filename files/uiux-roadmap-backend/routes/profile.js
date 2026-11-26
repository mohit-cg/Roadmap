const express = require("express");
const { readDb, writeDb } = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.patch("/", authRequired, (req, res) => {
  const { name, goal, bio } = req.body || {};
  const db = readDb();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });

  if (typeof name === "string" && name.trim()) user.name = name.trim().slice(0, 120);
  if (typeof goal === "string") user.goal = goal.slice(0, 120);
  if (typeof bio === "string") user.bio = bio.slice(0, 500);
  writeDb(db);

  res.json({ user: { id: user.id, name: user.name, email: user.email, goal: user.goal, bio: user.bio, joinDate: user.joinDate } });
});

module.exports = router;
