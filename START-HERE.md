# When you open the project — start here

---

## First time only (do this once before anything else)

Do these **once** when you first clone or open the project (or on a new computer):

1. **Create the database**
   ```bash
   cd database && npm install && npm run create && cd ..
   ```

2. **Configure the frontend**
   ```bash
   cd frontend && cp .env.example .env
   ```
   Edit `frontend/.env` and set **`VITE_USE_LOCAL_API=true`**.

3. **Install backend dependencies and create admin user**
   ```bash
   cd backend && npm install && npm run create-admin
   ```
   Default admin: **Admin** / **admin123**

4. **Install frontend dependencies**
   ```bash
   cd frontend && npm install
   ```

After this you **never** need to run “create database”, “create-admin”, or “cp .env.example .env” again (unless you delete the database or .env).

---

## Every time you open the project (after shutdown / close / next day)

When you closed the project (closed terminals, closed laptop, etc.) and open it again — **you do NOT repeat the first-time steps.** Only do this:

| Step | Command | Notes |
|------|---------|------|
| (optional) | `brew services start postgresql@16` | Only if PostgreSQL isn’t already running |
| **Terminal 1** | `cd backend && npm start` | Leave this running (port 3001) |
| **Terminal 2** | `cd frontend && npm run dev` | Leave this running (port 5173) |

Then open **http://localhost:5173** and **http://localhost:5173/admin/login** (Admin / admin123).

No database create, no create-admin, no .env copy — just start the two terminals above.

---

## Admin bookings = PostgreSQL (same data)

The admin page shows **guest bookings from the same PostgreSQL database** the backend uses. If you see bookings in Admin but not in pgAdmin/psql, you are likely looking at a **different database**.

1. **Check which DB the API uses**  
   With the backend running, open: **http://localhost:3001/api/db-info**  
   You’ll see e.g. `{ "database": "hotel_booking", "bookingsCount": 3 }`.

2. **In pgAdmin or psql, use that database and table**
   - **Database:** `hotel_booking` (same as in `backend/.env` → `PGDATABASE`)
   - **Table:** `public.bookings`

   In psql:
   ```bash
   psql -d hotel_booking -c "SELECT id, user_id, room_id, check_in, check_out, status FROM bookings;"
   ```
   Or in pgAdmin: connect to **hotel_booking** → Schemas → **public** → Tables → **bookings** → right‑click → View/Edit Data → All Rows.

---

## Using Tadabase instead of local PostgreSQL?

- Set `VITE_USE_LOCAL_API=false` and add `VITE_TADABASE_API_URL` and `VITE_TADABASE_API_KEY` in `frontend/.env`.
- You **still need the backend running** for login; create the admin in the DB the backend uses (see `backend/.env` and `npm run create-admin`).

More detail: **frontend/README.md**
