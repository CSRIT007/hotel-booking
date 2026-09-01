# Hotel Staff Setup

## Overview

- **Guests** log in with **email** (and password) and use the public site (book rooms, contact, etc.).
- **Hotel staff** log in with **username** (and password) and are redirected to the **Staff Dashboard** to manage bookings and contact messages.

## Add the `role` column (existing database)

If your database was created before staff support was added, run one of these:

1. **phpMyAdmin**: Open SQL tab, run the contents of `database/add-role-and-staff.sql`.
2. **MySQL CLI**: `mysql -u root hotel_booking < database/add-role-and-staff.sql`

Then create at least one staff user (see below).

## Create a staff user

1. Open in browser: **http://localhost/hotel-booking/create-staff.php** (adjust URL if needed).
2. Enter:
   - **Username** (e.g. `staff`) – staff will use this to log in
   - **Email** (e.g. `staff@smilerental.com`)
   - **Password** (min 6 characters)
3. Click **Create Staff User**.
4. Go to **Login** and sign in with the **username** and password. You will be redirected to the Staff Dashboard.

**Security:** Remove or restrict access to `create-staff.php` after creating staff accounts (e.g. delete the file or allow only from localhost).

## Guest email and in-app notifications

When staff **confirms** or **cancels** a booking:

1. **Email** – The guest receives an email at their registered address with the booking status and details (room, check-in, check-out).
2. **In-app notification** – A notification is stored so when the guest logs in they see it under **Notifications** (link in the header dropdown). Unread count is shown as a badge.

**Setup:** Ensure the `notifications` table exists. If you use the full `database/database.sql` it is included. For an existing database, run `database/add-notifications-table.sql`.  
**Email:** Edit `NOTIFICATION_FROM_EMAIL` and `NOTIFICATION_FROM_NAME` in `config/config.php`. On Windows/Laragon, email may require SMTP; see your server docs if mail is not sent.

## Staff duties (UI)

| Duty | Where |
|------|--------|
| View all bookings | Staff Dashboard – list with filters (All, Pending, Confirmed, Cancelled) |
| Confirm booking | Dashboard – **Confirm** button on pending bookings |
| Cancel booking | Dashboard – **Cancel** button on pending bookings |
| Mark booking complete | Dashboard – **Complete** button on confirmed bookings |
| View contact messages | **Contact Messages** – list of messages from the contact form |
| Mark message as read | Contact Messages – **Mark read** on new messages |

## Login behaviour

- **One login page** (`login.php`): one field accepts **Email or Username**.
- If the account has role **guest** → redirect to home (`index.php`).
- If the account has role **staff** → redirect to **Staff Dashboard** (`staff/dashboard.php`).

## Files

- `config/config.php` – `isStaff()`, `getRole()`, session stores `role`
- `login.php` – login by email or username; redirect by role
- `staff/dashboard.php` – bookings list and status actions
- `staff/contacts.php` – contact messages list and mark read
- `staff/header.php`, `staff/footer.php` – staff area layout
- `create-staff.php` – one-time script to create staff user
- `database/database.sql` – `users.role` column; `database/add-role-and-staff.sql` – migration for existing DB
