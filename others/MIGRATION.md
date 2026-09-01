# PHP → Vue / Node / Python replacement map

All legacy PHP has been removed. Use this as the reference for where each feature lives now.

---

## Config & utilities

| Old PHP | Replacement |
|--------|-------------|
| `config/config.php` | **Backend:** `backend/.env` (PGHOST, PGPORT, PGUSER, PGDATABASE). **Python:** `others/scripts/config.py` for scripts. |
| `includes/header.php`, `includes/footer.php` | **Frontend:** `frontend/src/components/AppHeader.vue`, `frontend/src/components/AppFooter.vue` and `frontend/src/App.vue`. |

---

## Public pages (guest site)

| Old PHP | Replacement (Vue route) |
|--------|--------------------------|
| `index.php` | **Frontend:** `/` — `HomeView.vue` |
| `login.php` | **Frontend:** `/login` — `LoginView.vue` |
| `logout.php` | **Frontend:** Logout via `useAuth().logout()` (e.g. in header); no dedicated page |
| `register.php` | **Frontend:** `/register` — `RegisterView.vue` |
| `contact.php` | **Frontend:** `/contact` — `ContactView.vue` |
| `about.php` | **Frontend:** `/about` — `AboutView.vue` |
| `services.php` | **Frontend:** `/services` — `ServicesView.vue` |
| `rooms.php` | **Frontend:** `/rooms` — `RoomsView.vue` |
| `room-single.php` | **Frontend:** `/rooms/:id` — `RoomDetailView.vue` |
| `notifications.php` | **Frontend:** Notifications can be shown in header or a dedicated component; backend has `notifications` table and API. |

Auth (login/register/logout) is handled by **backend** (`/api/auth/login`, `/api/auth/register`) and **frontend** `services/auth.js`.

---

## Staff / admin pages

All staff PHP pages are replaced by the **Vue admin** at `/admin/*` (see `frontend/src/router/index.js` and `frontend/src/views/admin/`).

| Old PHP | Replacement (Vue admin route) |
|--------|-------------------------------|
| `staff/dashboard.php` | `/admin` — `AdminDashboardView.vue` |
| `staff/rooms.php` | `/admin/rooms` — `AdminRoomsView.vue` |
| `staff/pms-bookings.php` | `/admin/bookings` — `AdminBookingsView.vue` |
| `staff/pms-guests.php` | `/admin/guests` — `AdminGuestsView.vue` |
| `staff/contacts.php` | `/admin/contacts` — `AdminContactsView.vue` (Messages) |
| `staff/pms-housekeeping.php` | `/admin/housekeeping` — placeholder |
| `staff/pos-dashboard.php` | `/admin/pos-sales` — placeholder |
| `staff/pos-products.php` | `/admin/pos-products` — placeholder |
| `staff/pos-sales.php` | `/admin/pos-sales` — placeholder |
| `staff/pos-transactions.php`, `staff/pos-transaction-details.php` | `/admin/pos-transactions` — placeholder |
| `staff/crs-dashboard.php` | `/admin` (CRS in sidebar) |
| `staff/crs-rates.php` | `/admin/crs-rates` — placeholder |
| `staff/crs-channels.php` | `/admin/crs-channels` — placeholder |
| `staff/crs-availability.php` | `/admin/crs-availability` — placeholder |
| `staff/crm-dashboard.php`, `staff/crm-campaigns.php`, `staff/crm-loyalty.php`, `staff/crm-communications.php` | `/admin/crm-*` — placeholders |
| `staff/finance.php`, `staff/finance-revenue.php`, `staff/finance-expense.php`, `staff/finance-profit.php` | `/admin/finance-revenue`, etc. — placeholders |
| `staff/accounting-*.php` | Finance section — can be added as admin routes if needed |
| `staff/hr-dashboard.php`, `staff/hr-employees.php`, `staff/hr-schedules.php`, `staff/hr-payroll.php`, `staff/hr-leaves.php` | `/admin/hr-*` — placeholders |
| `staff/maintenance-dashboard.php`, `staff/maintenance-requests.php`, `staff/maintenance-schedule.php`, `staff/maintenance-inventory.php` | `/admin/maintenance-*` — placeholders |
| `staff/reports.php` | `/admin/reports` — placeholder |
| `staff/analytics-kpi.php`, `staff/analytics-satisfaction.php` | `/admin/analytics-kpi` — placeholder |
| `staff/security-dashboard.php`, `staff/security-access.php`, `staff/security-incidents.php` | Admin security — can be added as routes |
| `staff/sustainability-*.php` | Admin sustainability — can be added as routes |
| `staff/events-dashboard.php`, `staff/events-bookings.php`, `staff/events-spaces.php` | Admin events — can be added as routes |
| `staff/reviews-dashboard.php` | Admin reviews — can be added as routes |
| `staff/integrations-dashboard.php` | Admin integrations — can be added as routes |
| `staff/mobile-dashboard.php` | Admin mobile — can be added as routes |
| `staff/rms-dashboard.php`, `staff/rms-pricing.php`, `staff/rms-competitors.php`, `staff/rms-forecast.php` | Admin RMS — can be added as routes |
| `staff/change-password.php` | Can be added in admin layout (user menu) |
| `staff/header.php`, `staff/footer.php`, `staff/_page-template.php` | **Frontend:** `AdminLayout.vue` and admin views. |

---

## Backend API (Node)

- **Auth:** `backend/index.js` — `POST /api/auth/login`, `POST /api/auth/register`
- **Data:** `GET/POST/PATCH /api/hotels`, `/api/rooms`, `/api/bookings`, `/api/contacts`, `/api/testimonials`, `/api/services`, `/api/users`
- **Admin:** `GET /api/bookings` (all), `PATCH /api/bookings/:id`, `GET /api/contacts`, `PATCH /api/contacts/:id`

---

## Python scripts (others/scripts/)

| Purpose | Script |
|--------|--------|
| DB config | `config.py` |
| Backup DB | `backup_database.py` |
| Diagnostics | `error_check.py` |

Run from project root: `cd others/scripts && pip install -r requirements.txt && python error_check.py`
