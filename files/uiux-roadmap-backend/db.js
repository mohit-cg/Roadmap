// Minimal flat-file JSON "database". Good enough for local use and demos.
// For production, swap this module for a real database — every route only
// calls readDb()/writeDb(), so that's the one place that needs to change.

const fs = require("fs");
const os = require("os");
const path = require("path");

const LOCAL_DB_PATH = path.join(__dirname, "data", "db.json");
const TMP_DB_PATH = path.join(os.tmpdir(), "uiux-roadmap-db.json");
let activeDbPath = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME ? TMP_DB_PATH : LOCAL_DB_PATH;

function ensureDb() {
  try {
    const dir = path.dirname(activeDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(activeDbPath)) {
      const seed =
        activeDbPath === TMP_DB_PATH && fs.existsSync(LOCAL_DB_PATH)
          ? fs.readFileSync(LOCAL_DB_PATH, "utf-8")
          : JSON.stringify({ users: [], progress: {} }, null, 2);
      fs.writeFileSync(activeDbPath, seed);
    }
  } catch (err) {
    if (activeDbPath !== TMP_DB_PATH && (err.code === "EROFS" || err.code === "EACCES" || err.code === "EPERM")) {
      activeDbPath = TMP_DB_PATH;
      ensureDb();
      return;
    }
    throw err;
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(activeDbPath, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = [];
    if (!parsed.progress) parsed.progress = {};
    return parsed;
  } catch (e) {
    return { users: [], progress: {} };
  }
}

function writeDb(data) {
  ensureDb();
  try {
    fs.writeFileSync(activeDbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    if (activeDbPath !== TMP_DB_PATH && (err.code === "EROFS" || err.code === "EACCES" || err.code === "EPERM")) {
      activeDbPath = TMP_DB_PATH;
      fs.writeFileSync(activeDbPath, JSON.stringify(data, null, 2));
      return;
    }
    throw err;
  }
}

module.exports = { readDb, writeDb };
