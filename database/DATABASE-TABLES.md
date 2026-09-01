# Hotel Booking — Database Tables (PostgreSQL)

Reference for all tables used by the Vue + Node API app.

---

## Table summary

| Table           | Purpose |
|----------------|---------|
| **users**      | Guest and staff accounts (login, role) |
| **hotels**     | Hotel properties |
| **rooms**      | Rooms per hotel (price, capacity, status) |
| **bookings**   | Guest bookings (check-in/out, total, status) |
| **notifications** | In-app notifications (e.g. booking confirmed) |
| **testimonials**  | Home page reviews |
| **contacts**   | Contact form submissions |
| **services**   | Home page services list |

---

## Table definitions

### users
| Column     | Type         | Description |
|------------|--------------|-------------|
| id         | SERIAL       | Primary key |
| username   | VARCHAR(50)  | Unique, not null |
| email      | VARCHAR(100) | Unique, not null |
| password   | VARCHAR(255) | Hashed, not null |
| role       | VARCHAR(20)  | `guest` or `staff`, default `guest` |
| created_at | TIMESTAMPTZ  | Default now |

### hotels
| Column      | Type         | Description |
|-------------|--------------|-------------|
| id          | SERIAL       | Primary key |
| name        | VARCHAR(100) | Not null |
| description | TEXT         | |
| location    | VARCHAR(100) | Not null |
| image       | VARCHAR(255) | |
| created_at  | TIMESTAMPTZ  | Default now |

### rooms
| Column      | Type         | Description |
|-------------|--------------|-------------|
| id          | SERIAL       | Primary key |
| hotel_id    | INT          | FK → hotels(id), not null |
| name        | VARCHAR(100) | Not null |
| description | TEXT         | |
| price       | DECIMAL(10,2)| Not null |
| max_persons | INT          | Default 2 |
| size        | VARCHAR(20)  | e.g. "45 m2" |
| view_type   | VARCHAR(50)  | e.g. "Sea View" |
| beds        | INT          | Default 1 |
| image       | VARCHAR(255) | |
| status      | VARCHAR(20)  | `available`, `booked`, `maintenance` |
| created_at  | TIMESTAMPTZ  | Default now |

### bookings
| Column     | Type         | Description |
|------------|--------------|-------------|
| id         | SERIAL       | Primary key |
| user_id    | INT          | FK → users(id), not null |
| room_id    | INT          | FK → rooms(id), not null |
| check_in   | DATE         | Not null |
| check_out  | DATE         | Not null |
| guests     | INT          | Default 1 |
| total_price| DECIMAL(10,2)| Not null |
| status     | VARCHAR(20)  | `pending`, `confirmed`, `cancelled`, `completed` |
| created_at | TIMESTAMPTZ  | Default now |

### notifications
| Column     | Type         | Description |
|------------|--------------|-------------|
| id         | SERIAL       | Primary key |
| user_id    | INT          | FK → users(id) |
| booking_id | INT          | FK → bookings(id) |
| type       | VARCHAR(20)  | `confirmed`, `cancelled` |
| message    | TEXT         | Not null |
| is_read    | SMALLINT     | Default 0 |
| created_at | TIMESTAMPTZ  | Default now |

### testimonials
| Column    | Type         | Description |
|-----------|--------------|-------------|
| id        | SERIAL       | Primary key |
| name      | VARCHAR(100) | Not null |
| position  | VARCHAR(100) | |
| message   | TEXT         | Not null |
| image     | VARCHAR(255) | |
| rating    | INT          | Default 5 |
| status    | VARCHAR(20)  | Default `active` |
| created_at| TIMESTAMPTZ  | Default now |

### contacts
| Column    | Type         | Description |
|-----------|--------------|-------------|
| id        | SERIAL       | Primary key |
| name      | VARCHAR(100) | Not null |
| email     | VARCHAR(100) | Not null |
| subject   | VARCHAR(200) | |
| message   | TEXT         | Not null |
| status    | VARCHAR(20)  | `new`, `read`, `replied` |
| created_at| TIMESTAMPTZ  | Default now |

### services
| Column     | Type         | Description |
|------------|--------------|-------------|
| id         | SERIAL       | Primary key |
| name       | VARCHAR(100) | Not null |
| description| TEXT         | |
| icon       | VARCHAR(50)  | |
| image      | VARCHAR(255) | |
| status     | VARCHAR(20)  | Default `active` |
| created_at | TIMESTAMPTZ  | Default now |

---

## How to create the tables

**Option 1 — Node script (creates database + tables + sample data):**
```bash
cd database
npm install
npm run create
```

**Option 2 — psql:**
```bash
createdb hotel_booking
psql -d hotel_booking -f database/postgresql-schema.sql
```

Schema file: **`postgresql-schema.sql`**
