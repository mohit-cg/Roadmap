# UI/UX Roadmap — Backend

A small Express API that gives the roadmap frontend real accounts and
server-side progress tracking: signup/login, profile edits, and per-phase /
per-tech / per-project status with an activity log.

## Stack

- Node.js + Express
- JSON file storage (`data/db.json`) — no external database or setup required
- `bcryptjs` for password hashing
- JWT for session tokens

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set `JWT_SECRET` to a real random string (anything long and
unguessable). Then:

```bash
npm start        # node server.js
# or
npm run dev       # restarts automatically on file changes
```

The server runs at `http://localhost:4000` by default (`PORT` in `.env`
changes that).

## Connect the frontend

Open the roadmap HTML file in a browser. It automatically checks
`GET /api/health` on load:

- **Backend reachable** → accounts and progress are created/read through this
  API, and a token is kept in the browser to stay signed in.
- **Backend not reachable** → the site falls back to a local-only mode
  (everything stored in that browser's `localStorage`, nothing sent
  anywhere).

The footer shows which mode is active. Click **Configure** there to point the
frontend at a different backend URL (e.g. after deploying this API
somewhere) — it's saved in the browser and used from then on.

## API reference

All authenticated routes expect `Authorization: Bearer <token>`.

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/health` | — | Liveness check |
| POST | `/api/auth/signup` | `{ name, email, password, goal }` | Returns `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | Returns `{ token, user }` |
| GET | `/api/auth/me` | — | Returns `{ user }` for the current token |
| PATCH | `/api/profile` | `{ name?, goal?, bio? }` | Partial update |
| GET | `/api/progress` | — | Returns the full progress bucket |
| PUT | `/api/progress` | `{ phases, tech, projects, hrsPerDay, activity }` | Bulk replace — used once at signup to carry over guest progress |
| PATCH | `/api/progress/phase/:id` | `{ status, name? }` | `status` is one of `not_started` / `learning` / `completed` |
| PATCH | `/api/progress/tech/:name` | `{ status }` | `:name` is the tech's display name, URL-encoded |
| PATCH | `/api/progress/project/:id` | `{ status, name? }` | |
| PATCH | `/api/progress/hours` | `{ hrsPerDay }` | Daily time-commitment setting |

Every phase/tech/project status change that's actually a change gets appended
to that user's `activity` log (capped at the most recent 80 entries), which
is what the frontend's profile page renders as the learning tracker.

## Limitations

The JSON file store is fine for local use, demos, and small personal
deployments, but it isn't safe for concurrent production traffic (no
transactions, no locking). To go further:

- Swap `db.js` for a real database. The rest of the app only calls
  `readDb()` / `writeDb()`, so that's the one file that needs to change —
  or rewrite the route handlers directly against an ORM.
- Set a real `CORS_ORIGIN` instead of `*`.
- Add rate limiting on `/api/auth/*` before exposing this publicly.
- Rotate `JWT_SECRET` and don't commit `.env`.

## Deploying

Any Node host works (Render, Railway, Fly.io, a small VPS, etc.). Set the
environment variables from `.env.example` on that host, deploy this folder,
then update the frontend's backend URL (via the footer's **Configure** link)
to point at the deployed address.
