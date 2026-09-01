# Hotel Booking — Vue, Tailwind, PostgreSQL

This is the **Vue 3 + Tailwind CSS** version of the hotel booking project, with **Node + Express + pg (PostgreSQL)** or Tadabase as the backend.

## When you open the project

**→ See [START-HERE.md](../START-HERE.md)** in the project root for a step-by-step checklist.

Short version:

1. Start PostgreSQL.
2. (First time) `cd database && npm install && npm run create`
3. **Terminal 1:** `cd backend && npm install && npm start`
4. (First time) `cd backend && npm run create-admin` → login **Admin** / **admin123**
5. (First time) `cd frontend && cp .env.example .env` and set `VITE_USE_LOCAL_API=true`
6. **Terminal 2:** `cd frontend && npm install && npm run dev`
7. Open http://localhost:5173 and http://localhost:5173/admin/login

## Stack

- **Frontend:** Vue 3, Vue Router, Tailwind CSS, Vite
- **Backend (recommended):** Node.js, Express, **pg** (PostgreSQL) — full API in `backend/`
- **Alternative:** Tadabase (hosted PostgreSQL) via REST API

## Quick start with local PostgreSQL (Node + pg)

1. **Create the database** (if not already done): `cd database && npm install && npm run create`
2. **Start the backend:** `cd backend && npm install && npm start`
3. **Frontend:** copy `frontend/.env.example` to `frontend/.env` and set `VITE_USE_LOCAL_API=true`
4. **Run frontend:** `cd frontend && npm install && npm run dev`

Open http://localhost:5173 — the app uses your local PostgreSQL for data and auth.

**Admin login:** Create a staff user, then sign in at `/admin/login`:
```bash
cd backend
npm run create-admin
# Default: username Admin, password admin123. Or: node create-admin.js MyAdmin mypassword
```
Then open http://localhost:5173/admin/login

**Can't log in as admin?**
1. **Backend must be running** — Login uses the Node API. In a terminal: `cd backend && npm start` (port 3001).
2. **Create the admin user** in the same PostgreSQL the backend uses: `cd backend && npm run create-admin`. Default credentials: username **Admin**, password **admin123** (username is case-sensitive).
3. **Same database** — The backend and `create-admin.js` both use `backend/.env` (or env vars). Ensure `PGDATABASE`, `PGUSER`, etc. point to the DB where you ran the schema and create-admin.
4. If you use **Tadabase for data**, you still need the backend running for login (auth is not in Tadabase). The admin user lives in **PostgreSQL** (local or the one in backend .env), not in Tadabase.

## Quick start (no backend)

The app runs with **mock data** if you don’t set Tadabase or the auth API:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You can browse rooms, but login/register and real bookings require the auth API and Tadabase.

## Full setup (Tadabase + PostgreSQL)

### 1. Tadabase (PostgreSQL)

1. Create an app at [tadabase.io](https://tadabase.io) (uses PostgreSQL).
2. Create tables matching the schema (or use the reference below):
   - **users** — `username`, `email`, `password`, `role` (guest/staff)
   - **hotels** — `name`, `description`, `location`, `image`
   - **rooms** — `hotel_id`, `name`, `description`, `price`, `max_persons`, `size`, `view_type`, `beds`, `image`, `status`
   - **bookings** — `user_id`, `room_id`, `check_in`, `check_out`, `guests`, `total_price`, `status`
   - **testimonials** — `name`, `position`, `message`, `image`, `rating`, `status`
   - **services** — `name`, `description`, `icon`, `image`, `status`
   - **contacts** — `name`, `email`, `subject`, `message`, `status`

3. Get your **API base URL** and **API key** from Tadabase (app settings / API).
4. Copy `frontend/.env.example` to `frontend/.env` and set:
   - `VITE_TADABASE_API_URL`
   - `VITE_TADABASE_API_KEY`
   - Optionally table IDs if Tadabase uses table IDs (e.g. `table_xxx`) instead of names.

PostgreSQL schema and setup instructions are in the project root:

- **`database/postgresql-schema.sql`** — full schema and sample data
- **`database/README-POSTGRESQL.md`** — how to create the database (local PostgreSQL or Tadabase)

### 2. Auth API (when using Tadabase)

When using Tadabase instead of local PostgreSQL, the backend can be configured with Tadabase env vars (see `backend/.env.example`). For **local Node + pg**, the API already includes auth; no extra auth server is needed.

### 3. Run the app

```bash
# Terminal 1: backend
cd backend && npm start

# Terminal 2: frontend
cd frontend && npm run dev
```

Set `frontend/.env` with your Tadabase credentials so the app uses live data and auth works.

## Scripts

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Start Vite dev server      |
| `npm run build`| Production build           |
| `npm run preview` | Preview production build |
| `npm run api`  | Reminder to start backend from project root: `cd backend && npm start` |

## Project structure

```
frontend/             # This folder (Vue app)
├── src/
│   ├── components/   # AppHeader, AppFooter
│   ├── composables/  # useAuth
│   ├── router/       # Vue Router
│   ├── services/     # tadabase.js, data.js, auth.js
│   └── views/        # Home, Rooms, RoomDetail, Login, Register, Contact, About, Services, NotFound (404)
├── .env.example
└── README.md
```

## Production

1. Build: `npm run build` (output in `dist/`).
2. Set `VITE_AUTH_API_URL` to your deployed auth API URL (e.g. `https://api.yoursite.com`) so login/register work.
3. Serve `dist/` with any static host (Vercel, Netlify, nginx, etc.). Use history fallback so routes like `/rooms` work (e.g. redirect to `index.html`).
4. Deploy the backend (`backend/`) to a Node host (Railway, Render, etc.) and set its `.env` with Tadabase credentials.

## Environment variables

**Vue app (`.env`):**

- `VITE_TADABASE_API_URL` — Tadabase REST API base URL
- `VITE_TADABASE_API_KEY` — Tadabase API key
- `VITE_AUTH_API_URL` — Leave empty in dev (proxy used); set in production to your auth API URL

**Backend (`backend/.env`):**

- `TADABASE_API_URL` — Same Tadabase API URL
- `TADABASE_API_KEY` — Same API key
- `TADABASE_TABLE_USERS` — Table name/ID for users (default `users`)
- `PORT` — Auth server port (default 3001)

## Migrating from PHP/MySQL

- **Database:** Use `database/postgresql-schema.sql` as the schema reference. In Tadabase you create tables and fields in the UI; column names above match the Vue app and auth API.
- **Auth:** Handled by the Node auth API + Tadabase users table (passwords hashed server-side when using bcrypt).
- **Pages:** Home, Rooms, Room detail + booking, Login, Register, Contact, About, Services are implemented in Vue with Tailwind.

All legacy PHP has been removed; see `others/MIGRATION.md` for the replacement map. This Vue app lives in `frontend/` and uses the Node backend + PostgreSQL or Tadabase.
