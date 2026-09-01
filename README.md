# Hotel Booking System

A hotel booking app with a clear project layout: **frontend** (Vue), **backend** (Node API), **database** (PostgreSQL), and **others** (legacy PHP, Python scripts).

---

## Project structure

```
hotel-booking/
├── frontend/          # Vue 3 + Vite + Tailwind (main app)
├── backend/           # Node.js + Express + PostgreSQL API (auth, bookings, etc.)
├── database/          # PostgreSQL schema, sample data, setup scripts
├── docs/              # Legacy docs, fix logs, setup notes (reference only)
├── others/
│   ├── MIGRATION.md   # PHP → Vue/Node/Python replacement map (all PHP removed)
│   └── scripts/       # Python utilities (backup, error check, config)
├── START-HERE.md      # Step-by-step: first time + every time you open
└── README.md          # This file
```

---

## Quick start

**→ See [START-HERE.md](START-HERE.md)** for the full checklist.

- **First time:** Create DB, copy `frontend/.env`, run `backend` create-admin, install deps in `frontend` and `backend`.
- **Every time you open:** Start **backend** (`cd backend && npm start`) and **frontend** (`cd frontend && npm run dev`), then open http://localhost:5173 and http://localhost:5173/admin/login (Admin / admin123).

---

## Stack

| Part       | Tech |
|-----------|------|
| Frontend  | Vue 3, Vue Router, Tailwind CSS, Vite |
| Backend   | Node.js, Express, pg (PostgreSQL) |
| Database  | PostgreSQL (schema + sample data in `database/`) |
| Others    | Python scripts in `others/scripts/`; see `others/MIGRATION.md` for PHP → Vue/Node map |

---

## Docs

- **[START-HERE.md](START-HERE.md)** — What to do when you open the project (first time and every time).
- **[frontend/README.md](frontend/README.md)** — Vue app setup, Tadabase, env vars.
- **[database/README-POSTGRESQL.md](database/README-POSTGRESQL.md)** — PostgreSQL setup and tables.
- **[others/README.md](others/README.md)** — Legacy PHP and Python scripts.
