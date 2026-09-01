# Best Practices Applied: Trial Balance & Taxation

Summary of best practices implemented on **Trial Balance** and **Taxation** pages.

---

## Trial Balance (`staff/accounting-trial-balance.php`)

| Practice | Implementation |
|----------|----------------|
| **Date validation** | `from` and `to` must match `YYYY-MM-DD`. Invalid values are ignored. |
| **Date range logic** | If `from` > `to`, `to` is set to `from` (single-day report). |
| **Range limit** | Report limited to 366 days (1 year) to avoid huge queries and timeouts. |
| **Period label** | Header shows "As of YYYY-MM-DD" or "Period: from to" when dates are set. |
| **Prepared statements** | All date-filtered queries use `prepare` + `bind_param` (no raw user input in SQL). |
| **Output escaping** | All displayed values use `htmlspecialchars()` and `number_format()` where appropriate. |
| **Auth** | Page requires staff login; redirects to login if not authenticated. |

---

## Taxation (`staff/accounting-taxation.php`)

| Practice | Implementation |
|----------|----------------|
| **CSRF protection** | All POST forms (Add, Mark Paid, Delete) include a hidden `csrf_token`. Token is validated with `hash_equals()` before any state change; invalid token redirects with error. |
| **Prepared statements** | Add (INSERT), Mark Paid (SELECT + UPDATE), Delete (DELETE), and filtered list (SELECT with status/type) use `prepare` + `bind_param` only. No concatenated user input in SQL. |
| **Input whitelist** | Tax type on add is restricted to: VAT, Income Tax, Property Tax, Withholding Tax, Sales Tax, Payroll Tax, Other. |
| **Input validation** | Amount > 0; due_date and paid_date must match `YYYY-MM-DD` (invalid paid_date falls back to today). |
| **Input length limits** | `tax_period` 50 chars, `agency` 200, `reference_number` 100, `notes` truncated to DB limit via `mb_substr`. |
| **Filter safety** | Status and type filters for list use prepared statement parameters (no raw GET in SQL). |
| **Output escaping** | All table and form output uses `htmlspecialchars()`. Amounts use `number_format()`. |
| **Auth** | Page requires staff login. |
| **Table creation** | `tax_records` is created with `CREATE TABLE IF NOT EXISTS` and indexes; no duplicate schema in page logic. |

---

## Quick Reference

- **Trial Balance:** Read-only report; best practices focus on date validation, range limits, and safe queries.
- **Taxation:** CRUD + Mark Paid; best practices focus on CSRF, prepared statements, whitelist/validation, and length limits.

These settings are applied in the code; no extra configuration is required.
