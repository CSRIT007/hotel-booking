# Connect to PostgreSQL — Hotel Booking

Use these settings to connect to the **hotel_booking** database (pgAdmin, TablePlus, DBeaver, or psql).

---

## Connection details

| Setting | Value |
|--------|--------|
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database** | `hotel_booking` |
| **Username** | Your Mac username (e.g. `chea_saroeurn007`) |
| **Password** | *(leave empty for default local setup)* |

---

## In pgAdmin 4

1. Right-click **Servers** → **Register** → **Server**.
2. **General** tab: Name = `Hotel Booking` (or any name).
3. **Connection** tab:
   - Host: `localhost`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `chea_saroeurn007` *(your Mac user)*
   - Password: *(leave empty)*
4. **Save**.
5. Expand **Servers** → **Hotel Booking** → **Databases** → **hotel_booking** → **Schemas** → **public** → **Tables**.

---

## In this project

The **backend** (`backend/`) uses the same settings. They are in:

- **`backend/.env`**

If your PostgreSQL username or password is different, edit that file (e.g. set `PGUSER=` or `PGPASSWORD=yourpassword`).

---

## Create database + tables (if needed)

From project root:

```bash
cd database
npm install
npm run create
```

This creates the `hotel_booking` database and all tables (users, hotels, rooms, bookings, etc.).
