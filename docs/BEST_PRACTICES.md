# Best Practices for Hotel Booking System

Practical guidelines for security, database, code structure, and maintenance. Apply these across the system.

---

## 1. Security

### 1.1 Authentication & Authorization
- **Every staff page** must start with:
  ```php
  require_once __DIR__ . '/../config/config.php';
  if (!isLoggedIn() || !isStaff()) { header('Location: ../login.php'); exit; }
  ```
- **Sensitive actions** (delete, approve, pay): check role/permission before executing.
- **Session:** Use `session_regenerate_id(true)` after login to avoid session fixation.
- **Logout:** Destroy session and cookies: `session_destroy(); setcookie(session_name(), '', ...)`.

### 1.2 SQL Injection Prevention
- **Always use prepared statements** for any user input:
  ```php
  $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
  $stmt->bind_param("i", $user_id);
  $stmt->execute();
  ```
- **Never** concatenate `$_GET`, `$_POST`, or `$_REQUEST` directly into SQL.
- For dynamic table/column names (rare), whitelist allowed values in PHP, then use them.

### 1.3 XSS (Cross-Site Scripting) Prevention
- **Escape all output** that comes from DB or user input:
  ```php
  echo htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
  ```
- In attributes: `value="<?php echo htmlspecialchars($input); ?>"`.
- For rich text, use a sanitizer library or allow only safe tags.

### 1.4 CSRF (Cross-Site Request Forgery) Prevention
- For **state-changing forms** (create, update, delete), use a token:
  ```php
  // On form display: store in session
  $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
  // In form: <input type="hidden" name="csrf_token" value="...">
  // On submit: if (empty($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) { die('Invalid request'); }
  ```
- Regenerate token after use.

### 1.5 Passwords
- **Hash with `password_hash()`** (PASSWORD_DEFAULT / bcrypt).
- **Verify with `password_verify()`**.
- Never store or log plain passwords.

### 1.6 Sensitive Data
- **Config:** Keep DB credentials in `config/config.php`; do **not** commit real passwords to public repos (use `.env` or env-specific config).
- **Errors:** In production, do not show `$conn->error` or stack traces to users; log them server-side.

---

## 2. Database

### 2.1 Queries
- Use **prepared statements** for all user-driven queries.
- Prefer **indexes** on columns used in `WHERE`, `JOIN`, and `ORDER BY`.
- Avoid `SELECT *` when you only need a few columns.
- Close or reuse statements/connections appropriately; avoid opening many connections per request.

### 2.2 Schema & Migrations
- **One logical change per migration** (e.g. one new table or one new column).
- Store migrations as versioned SQL files (e.g. `database/add-<feature>-table.sql`).
- Document in migration file what it does and any dependencies.
- Prefer **CREATE TABLE IF NOT EXISTS** and **ALTER TABLE** in migrations so they can be re-run safely where possible.

### 2.3 Backups
- **Regular backups** of the database (daily or per release).
- Test restore occasionally.
- Keep backups off the web server (different machine or secure storage).

### 2.4 Naming
- Tables: `snake_case`, plural when it’s a collection (e.g. `bookings`, `tax_records`).
- Columns: `snake_case` (e.g. `created_at`, `user_id`).
- Primary key: `id` (INT AUTO_INCREMENT) unless there is a good reason otherwise.

---

## 3. Code Structure

### 3.1 Entry Points
- **Single entry** per page (one main PHP file per URL).
- Require **config** at the top; then auth check; then business logic; then include header/content/footer.

### 3.2 Shared Logic
- **Config:** `config/config.php` for DB, session, base path, and global helpers.
- **Helpers:** Reusable functions (e.g. `isLoggedIn()`, `isStaff()`) in config or a dedicated `includes/helpers.php`.
- **Include path:** Use `__DIR__` for relative includes: `require_once __DIR__ . '/../config/config.php';`.

### 3.3 Output
- **No output before `header()`** (no echo, no BOM, no space before `<?php`).
- Prefer **templates** (PHP with minimal logic in the HTML) or a simple templating pattern so logic and presentation are separated.

### 3.4 Naming
- **Files:** `kebab-case` or `snake_case` (e.g. `pms-housekeeping.php`, `accounting_taxation.php`).
- **Variables/functions:** `camelCase` or `snake_case` consistently within a file.
- **Constants:** `UPPER_SNAKE_CASE` (e.g. `BASE_PATH`).

---

## 4. Error Handling & Logging

### 4.1 User-Facing Errors
- Show **generic messages** to users (e.g. “Something went wrong. Please try again.”).
- Do **not** expose SQL errors, file paths, or stack traces in production.

### 4.2 Logging
- **Log** errors and important actions (login, failed login, delete, payment) to a file or logging service.
- Include: timestamp, user id (if any), action, and minimal context (e.g. entity id).
- Rotate and protect log files (not under public web root if possible).

### 4.3 Development vs Production
- **Development:** `display_errors = On`, log level verbose.
- **Production:** `display_errors = Off`, `log_errors = On`, log to file only.

---

## 5. Performance

### 5.1 Database
- Use **indexes** on foreign keys and frequently filtered/sorted columns.
- Avoid N+1 queries: prefer one query with JOINs or a small set of queries instead of a loop of single-row queries.
- Paginate long lists (e.g. `LIMIT 20 OFFSET 0` and next/prev).

### 5.2 Front-End
- Load **jQuery/scripts in `<head>` or before** any inline script that uses them (e.g. staff header).
- Minimize inline JS; use event delegation where possible (e.g. `$(document).on('click', '.btn', ...)`).
- Use **cache-busting** for critical JS/CSS (e.g. `?v=1` or build hash) when needed.

### 5.3 Caching
- For rarely changing data (e.g. room types), consider short-lived caching (e.g. in-memory or file) to reduce DB hits.
- Respect **browser cache** for static assets (images, CSS, JS) via server headers.

---

## 6. Environment & Deployment

### 6.1 Configuration
- **Different config per environment** (dev/staging/prod): different DB credentials, base URL, debug flags.
- Prefer **environment variables** or a single `config.php` that reads from env (e.g. `getenv('DB_PASS')`) so secrets are not in code.

### 6.2 Version Control
- **Do not commit** `config/config.php` with real production passwords; use `.env` or similar and add `.env` to `.gitignore`.
- **Do commit** schema and migrations (SQL files).
- **Do not commit** logs, uploads, or caches that contain user data.

### 6.3 Post-Deploy
- Run **migrations** after deploy if needed.
- Clear or refresh **caches** after code/config changes.
- Smoke-test critical flows: login, booking, payment, staff actions.

---

## 7. Maintenance & Hygiene

### 7.1 Dependencies
- Prefer **known versions** for JS/CSS libs (e.g. CDN with version).
- Periodically check for security advisories (PHP, MySQL, libraries).

### 7.2 Cleanup
- Remove or **disable** debug/test scripts (e.g. `test-*.php`, `debug-*.php`, `fix-typo-now.php`) in production.
- Avoid leaving **temporary files** or one-off fix scripts in the repo long term; document and then remove or move to a “scripts” area.

### 7.3 Documentation
- Keep **README.md** and **FILE_CATEGORIES.md** updated when adding major features or pages.
- Document **setup steps** (DB create, migrations, env vars) in QUICK_START or README.
- Comment **non-obvious business rules** (e.g. “Revenue = confirmed + completed bookings only”).

---

## 8. Quick Checklist for New Features

- [ ] Auth check on every staff page.
- [ ] All DB inputs via prepared statements.
- [ ] All output escaped with `htmlspecialchars()`.
- [ ] CSRF token on forms that change data (optional but recommended).
- [ ] Meaningful error messages for users; details only in logs.
- [ ] Migration SQL for new/updated tables; document in FILE_CATEGORIES or README.
- [ ] No secrets in repo; config from env or excluded file.
- [ ] Scripts (jQuery, etc.) loaded before inline code that uses them.

---

## 9. References in This Project

| Area           | Where to look                          |
|----------------|----------------------------------------|
| Auth           | `config/config.php`, `login.php`       |
| DB pattern     | `staff/accounting-gl.php`, `staff/pms-housekeeping.php` |
| Staff layout   | `staff/header.php`, `staff/footer.php`  |
| File index     | `FILE_CATEGORIES.md`                    |
| Setup          | `README.md`, `QUICK_START.md`           |

Using these practices will keep the system secure, maintainable, and performant.
