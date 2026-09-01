# PostgreSQL database setup (Hotel Booking)

This folder contains the **PostgreSQL** schema for the Vue + Tadabase hotel booking app. You can either run it on a **local or cloud PostgreSQL** server, or use it as a reference when building tables in **Tadabase** (Tadabase uses PostgreSQL).

---

## Option A: Local or cloud PostgreSQL

### 1. Create the database

**Using command line (macOS/Linux):**
```bash
# From the project root (hotel-booking/)
createdb hotel_booking
```

**Or in `psql`:**
```sql
CREATE DATABASE hotel_booking;
\c hotel_booking
```

**Or with a GUI:** Create a new database named `hotel_booking` in pgAdmin, DBeaver, etc.

### 2. Run the schema and sample data

**Option 2a — Node.js script (creates DB + runs schema):**

```bash
cd database
npm install
npm run create
```

This creates the `hotel_booking` database if it doesn’t exist, then runs the full schema and sample data. Requires PostgreSQL to be running (e.g. `brew services start postgresql@14`). Optional env: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

**Option 2b — Using psql:**

From the **project root** (`hotel-booking/`):

```bash
createdb hotel_booking
psql -d hotel_booking -f database/postgresql-schema.sql
```

With host/user/password:

```bash
psql -h localhost -p 5432 -U your_username -d hotel_booking -f database/postgresql-schema.sql
```

**If `psql: command not found`** (macOS Homebrew): from the **database** folder run:
```bash
cd database
npm run psql -- -c "\dt"          # list tables
npm run view-data                 # show all table data
```
Or open a psql shell: `npm run psql`

### 3. Connect your app

- **Tadabase:** You don’t run this SQL directly; you create an app in Tadabase and add tables/columns that match this schema (see Option B).
- **Direct PostgreSQL:** Use a backend (e.g. Node with `pg`, or another API) that connects to this database. The Vue app is built to talk to **Tadabase REST API**; for a custom PostgreSQL backend you’d implement similar endpoints that read/write these tables.

---

## Option B: Tadabase (recommended for the Vue app)

Tadabase runs on PostgreSQL but you create tables in its UI:

1. Sign up at [tadabase.io](https://tadabase.io) and create a new app.
2. Create tables with the same **names and column types** as in `postgresql-schema.sql`:
   - **users** — username, email, password, role, created_at
   - **hotels** — name, description, location, image, created_at
   - **rooms** — hotel_id, name, description, price, max_persons, size, view_type, beds, image, status, created_at
   - **bookings** — user_id, room_id, check_in, check_out, guests, total_price, status, created_at
   - **notifications** — user_id, booking_id, type, message, is_read, created_at
   - **testimonials** — name, position, message, image, rating, status, created_at
   - **contacts** — name, email, subject, message, status, created_at
   - **services** — name, description, icon, image, status, created_at
3. In Tadabase, get your **API base URL** and **API key** and set them in the frontend (see `frontend/README.md`).

---

## Tables overview

| Table           | Purpose                          |
|----------------|-----------------------------------|
| users          | Guests and staff (login/register) |
| hotels         | Hotel properties                  |
| rooms          | Rooms per hotel                   |
| bookings       | Guest bookings                    |
| notifications  | Notifications for booking updates  |
| testimonials   | Guest reviews (home page)          |
| contacts       | Contact form submissions          |
| services       | Services list (home page)         |
| pos_products   | POS products (admin POS Products)  |

Sample data is included for **hotels**, **rooms**, **testimonials**, and **services**; it is only inserted when the corresponding table is empty.

### Extra sample data (all tables)

To fill **users** (guests), **bookings**, **contacts**, **notifications**, and a few more hotels/rooms/testimonials/services, run the seed script **after** the schema:

```bash
psql -d hotel_booking -f database/sample-data-postgres.sql
```

- **Guest users:** `john`, `mary`, `alice` (password: `guest123`). Admin is created separately: `cd backend && npm run create-admin`.
- The script is safe to run more than once; it skips inserts when sample rows already exist.
