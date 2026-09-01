# HR System - Complete Implementation

## Overview

Full HR (Human Resources) module with dashboard, employees, schedules, payroll, and leave management. All sub-pages have CRUD logic and use the HR database tables.

---

## Database Tables

### 1. `staff_profiles`
- Links to `users` (role = staff)
- **Columns:** user_id, employee_id, department, position, hire_date, termination_date, salary, salary_type, phone, emergency_contact, emergency_phone, address, status, notes
- **Departments:** front_desk, housekeeping, maintenance, food_beverage, management, sales, accounting, security, other
- **Status:** active, on_leave, terminated

### 2. `staff_schedules`
- **Columns:** staff_id, shift_date, shift_start, shift_end, shift_type, status, notes
- **Shift types:** morning, afternoon, evening, night, split
- **Status:** scheduled, completed, absent, cancelled

### 3. `staff_attendance`
- **Columns:** staff_id, schedule_id, clock_in, clock_out, break_duration, total_hours, overtime_hours, status, notes
- **Status:** present, late, absent, half_day

### 4. `payroll`
- **Columns:** staff_id, pay_period_start, pay_period_end, base_salary, overtime_pay, bonuses, deductions, net_pay, payment_date, payment_method, status, notes
- **Payment method:** bank_transfer, cash, check
- **Status:** draft, approved, paid

### 5. `performance_reviews`
- **Columns:** staff_id, reviewer_id, review_date, review_period_start/end, overall_rating, strengths, areas_for_improvement, goals, comments, status

### 6. `staff_leaves`
- **Columns:** staff_id, leave_type, start_date, end_date, days_count, reason, status, approved_by, approval_date, notes
- **Leave types:** vacation, sick, personal, maternity, paternity, unpaid, other
- **Status:** pending, approved, rejected, cancelled

---

## Setup

**Create HR tables (one-time):**
```
http://localhost/hotel-booking/setup-hr-tables.php
```
Creates: staff_profiles, staff_schedules, staff_attendance, payroll, performance_reviews, staff_leaves

---

## Pages & Logic

### 1. HR Dashboard (`staff/hr-dashboard.php`)
- **Logic:** Reads from staff_profiles, staff_schedules, payroll, staff_leaves
- **Stats:** Total employees, active/on_leave/terminated; shifts this week; payroll this month; pending leaves
- **Lists:** Upcoming shifts (next 10), Pending leave requests (5)
- **Auto:** Redirects to setup if tables missing

### 2. Employees (`staff/hr-employees.php`)
- **CRUD:** Create/Update staff_profiles for users with role=staff
- **Filters:** Department, status, search (name, email, employee_id, position)
- **Logic:** If no profile exists, INSERT; else UPDATE. Employee ID, department, position, hire date, salary, contact info, status.
- **Stats:** Total, active, on_leave, terminated

### 3. Schedules (`staff/hr-schedules.php`)
- **CRUD:** Create, Update, Delete shifts in staff_schedules
- **Filters:** Date range, staff, status
- **Logic:** Add shift (staff, date, start/end time, shift type); edit (date, times, type, status); delete
- **Stats:** Total shifts, scheduled, completed in period

### 4. Payroll (`staff/hr-payroll.php`)
- **CRUD:** Create, Update, Delete (draft only) payroll records
- **Logic:** Net pay = base_salary + overtime_pay + bonuses - deductions. Status: draft → approved → paid.
- **Filters:** Month, staff, status
- **Stats:** Record count, total amount, paid amount, draft count

### 5. Leaves (`staff/hr-leaves.php`)
- **CRUD:** Create leave request; Update (pending only); Approve/Reject/Cancel
- **Logic:** Days count from start/end; on approve/reject set approved_by and approval_date. Only pending can be edited or cancelled.
- **Filters:** Staff, status, leave type
- **Stats:** Total, pending, approved, rejected

---

## Auto-Updates & Business Rules

- **Employees:** Changing status to terminated can set termination_date (optional in UI).
- **Schedules:** Status can be set to completed/absent/cancelled; used for reporting.
- **Payroll:** Net pay computed on create/update; draft records can be deleted.
- **Leaves:** Approve/Reject sets approved_by (current user) and approval_date (today).

---

## Files Created/Updated

1. `setup-hr-tables.php` - Creates all 6 HR tables
2. `staff/hr-dashboard.php` - Dashboard with stats and lists
3. `staff/hr-employees.php` - Employee profiles CRUD
4. `staff/hr-schedules.php` - Shifts CRUD
5. `staff/hr-payroll.php` - Payroll CRUD
6. `staff/hr-leaves.php` - Leave requests and approvals
7. `HR_SYSTEM_COMPLETE.md` - This documentation

---

## Navigation (from header)

- HR → Dashboard
- HR → Employees
- HR → Schedules
- HR → Payroll
- HR → Leaves

All pages check for required tables and redirect to `setup-hr-tables.php` if missing.
