# File classification by category

All project files grouped by purpose. **Files are not moved**—this is a reference. URLs stay in root for public pages.

---

## Public pages (guest-facing)

| File | Purpose |
|------|--------|
| `index.php` | Home page |
| `about.php` | About us |
| `services.php` | Services listing |
| `rooms.php` | Room listing |
| `room-single.php` | Single room + booking form |
| `contact.php` | Contact form |

---

## Auth & user

| File | Purpose |
|------|--------|
| `login.php` | Login (email or username; guest vs staff redirect) |
| `logout.php` | Logout |
| `register.php` | Guest registration |
| `notifications.php` | Guest notifications (when staff confirm/cancel) |

---

## Staff area

| File | Purpose |
|------|--------|
| `staff/dashboard.php` | Bookings list, confirm/cancel/complete |
| `staff/contacts.php` | Contact messages, mark read |
| `staff/pms-housekeeping.php` | Housekeeping tasks management |
| `staff/pms-guests.php` | Guest profiles management |
| `staff/pms-bookings.php` | PMS bookings management |
| `staff/rooms.php` | Room inventory & status |
| `staff/header.php` | Staff layout header |
| `staff/footer.php` | Staff layout footer |
| `create-staff.php` | One-time: create staff user (root) |

---

## Config & core

| File | Purpose |
|------|--------|
| `config/config.php` | DB connection, session, helpers (isLoggedIn, isStaff, getPaymentInfo, notifications, etc.) |

---

## Database

| File | Purpose |
|------|--------|
| `database/database.sql` | Full schema + sample data |
| `database/add-role-and-staff.sql` | Add `role` column + migration for staff |
| `database/add-notifications-table.sql` | Add `notifications` table |
| `database/add-taxation-table.sql` | Add `tax_records` table for taxation |

---

## Includes (shared layout)

| File | Purpose |
|------|--------|
| `includes/header.php` | Main site header + nav |
| `includes/footer.php` | Main site footer + scripts |

---

## Setup & utilities

| File | Purpose |
|------|--------|
| `setup.php` | DB/setup check |
| `import-database.php` | Import DB from SQL |
| `quick-import.php` | Quick DB import |
| `error-check.php` | Diagnostic / error check |
| `fix-now.php` | Emergency fix for missing tables |
| `setup-pms-tables.php` | Setup PMS tables (housekeeping, guests, etc.) |
| `setup-hr-tables.php` | Setup HR tables (employees, payroll, etc.) |

## Housekeeping utilities

| File | Purpose |
|------|--------|
| `fix-room-typo.php` | Fix room name typo in database |
| `test-housekeeping-complete.php` | Complete system test (recommended) |
| `test-housekeeping-insert.php` | Test database inserts |
| `test-status-update.php` | Test status update (CLI) |
| `test-status-ajax.php` | Test status update AJAX (browser) |
| `debug-housekeeping.php` | Debug housekeeping operations |
| `diagnostic.php` | System diagnostic page |
| `check-errors.php` | Error diagnostic check (CLI) |

---

## Assets

| Folder / file | Purpose |
|---------------|--------|
| `css/` | Styles (style.css, bootstrap, datepicker, etc.) |
| `js/` | Scripts (jQuery, main.js, datepicker, etc.) |
| `images/` | Images (rooms, persons, services) |
| `fonts/` | Fonts (e.g. flaticon) |
| `scss/` | SCSS source (style.scss, etc.) |

---

## Documentation

| File | Purpose |
|------|--------|
| `README.md` | Project overview |
| `QUICK_START.md` | Quick start |
| `PROJECT_STRUCTURE.md` | Folder structure |
| `IMPORT_INSTRUCTIONS.md` | How to import DB |
| `FIX_PHPMYADMIN.md` | phpMyAdmin fixes |
| `PAYMENT_SETUP.md` | Payment config |
| `STAFF_SETUP.md` | Staff login & dashboard |
| `GOOGLE_MAPS_SETUP.md` | Optional Google Maps |
| `HOUSEKEEPING_CHECK.md` | Housekeeping system analysis & fixes (detailed) |
| `HOUSEKEEPING_FIX_SUMMARY.txt` | Housekeeping quick summary (visual) |
| `HOUSEKEEPING_FILES.md` | Housekeeping files reference guide |
| `STATUS_UPDATE_FIX.md` | Status update fix documentation (technical) |
| `FIX_COMPLETE.txt` | Status update fix summary (visual) |
| `FINAL_CHECK_RESULTS.md` | Final system check results |
| `CHECK_COMPLETE.txt` | Check complete summary |
| `FILE_CATEGORIES.md` | This file |

---

## Summary

| Category | Location | Notes |
|----------|----------|--------|
| Public pages | Root | index, about, services, rooms, room-single, contact |
| Auth & user | Root | login, logout, register, notifications |
| Staff | `staff/` + root | dashboard, contacts, create-staff |
| Config | `config/` | config.php |
| Database | `database/` | .sql files |
| Includes | `includes/` | header, footer |
| Setup/utils | Root | setup, import-database, quick-import, error-check |
| Assets | `css/`, `js/`, `images/`, `fonts/`, `scss/` | Static files |
| Docs | Root | *.md |
