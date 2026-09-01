# Housekeeping System Files Reference

Quick reference guide for all housekeeping-related files in the system.

---

## 🎯 Main Files

### `staff/pms-housekeeping.php`
**Primary housekeeping management interface**

- View all housekeeping tasks in table format
- Create new tasks via modal form
- Update task status with dropdown
- Assign tasks to housekeeping staff
- Delete tasks with confirmation
- Filter by date, status, and task type
- View statistics (total, pending, in progress, completed)

**Access:** Requires staff login  
**URL:** `http://localhost/hotel-booking/staff/pms-housekeeping.php`

**Features:**
- AJAX-powered for smooth updates
- Falls back to regular forms if JavaScript disabled
- Responsive design for mobile devices
- Color-coded priority badges
- Real-time status updates
- Room status integration

---

## 🔧 Setup & Fix Files

### `setup-pms-tables.php`
**Database table creation for PMS (Property Management System)**

Creates these tables:
- `housekeeping_tasks` - Main task tracking
- `guest_profiles` - Guest information
- `loyalty_transactions` - Loyalty program
- `staff_profiles` - Staff details

**When to use:** First-time setup or after database reset  
**URL:** `http://localhost/hotel-booking/setup-pms-tables.php`

---

### `fix-room-typo.php`
**One-click fix for room name typos**

- Scans for "Midle Room" typo
- Fixes to "Middle Room"
- Shows before/after verification
- Safe to run multiple times

**When to use:** When you see "Midle Room" instead of "Middle Room"  
**URL:** `http://localhost/hotel-booking/fix-room-typo.php`

**What it does:**
```sql
UPDATE rooms SET name = 'Middle Room' WHERE name = 'Midle Room';
```

---

### `fix-now.php`
**Emergency database fix script**

- Creates all missing tables
- Fixes structure issues
- Auto-redirects back after completion
- Used by error pages automatically

**When to use:** When system shows "Database Setup Required"  
**URL:** `http://localhost/hotel-booking/fix-now.php`

---

## 🧪 Testing Files

### `test-housekeeping-complete.php`
**Comprehensive system test (RECOMMENDED)**

Tests:
1. ✓ Database tables exist
2. ✓ Data quality (typos, orphaned records)
3. ✓ Current tasks overview
4. ✓ Task statistics
5. ✓ Housekeeping staff availability

Shows visual test results with pass/fail indicators  
**URL:** `http://localhost/hotel-booking/test-housekeeping-complete.php`

---

### `test-housekeeping-insert.php`
**Direct database insertion test**

- Shows table structure
- Counts existing records
- Tests INSERT operation
- Verifies data after insert
- Shows last 10 tasks

**When to use:** Debugging database write issues  
**URL:** `http://localhost/hotel-booking/test-housekeeping-insert.php`

---

### `debug-housekeeping.php`
**Advanced debugging tool**

- Step-by-step insertion process
- Detailed error messages
- Console logging
- Manual form testing

**When to use:** When create task fails  
**URL:** `http://localhost/hotel-booking/debug-housekeeping.php`

---

## 📚 Documentation Files

### `HOUSEKEEPING_CHECK.md`
**Complete system analysis report**

Contains:
- Issues found (with solutions)
- What's working correctly
- Code quality analysis
- Security notes
- UI improvement suggestions
- Testing checklist

**Purpose:** Technical reference and audit trail

---

### `HOUSEKEEPING_FIX_SUMMARY.txt`
**Quick visual summary**

ASCII art formatted summary showing:
- Issues found
- What's working
- How to fix
- Current task status
- Next steps

**Purpose:** Quick reference / print-friendly

---

### `HOUSEKEEPING_FILES.md`
**This file**

Quick reference guide for all housekeeping files.

---

## 📊 Database Tables

### `housekeeping_tasks`
```sql
CREATE TABLE housekeeping_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    assigned_to INT,
    task_type ENUM('cleaning', 'maintenance', 'inspection', 'turndown', 'deep_clean'),
    priority ENUM('low', 'medium', 'high', 'urgent'),
    status ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    checklist TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🚀 Quick Start Guide

### First Time Setup
1. Run `setup-pms-tables.php` to create tables
2. Run `seed-10-employees.php` to add sample staff (including housekeeping)
3. Access `staff/pms-housekeeping.php` with staff login
4. Create your first task

### If You See Errors
1. Run `test-housekeeping-complete.php` to diagnose
2. Run `fix-now.php` if tables are missing
3. Run `fix-room-typo.php` if room names have typos
4. Check `HOUSEKEEPING_CHECK.md` for detailed help

### Daily Usage
1. Login as staff
2. Go to `staff/pms-housekeeping.php`
3. View pending tasks
4. Assign tasks to housekeeping staff
5. Update status as tasks progress
6. Mark completed when done

---

## 🔗 Related Files

### Staff Area
- `staff/pms-bookings.php` - Booking management (creates cleaning tasks automatically)
- `staff/pms-guests.php` - Guest profiles
- `staff/rooms.php` - Room inventory
- `staff/hr-employees.php` - Employee management

### Database Files
- `database/database.sql` - Full database schema
- `database/add-role-and-staff.sql` - Role migration
- `import-pms-tables.php` - Database import tool

### Configuration
- `config/config.php` - Database connection & helpers

---

## 📞 Common Issues & Solutions

### Issue: "Database Setup Required" error
**Solution:** Click "Fix Database Now" or run `fix-now.php`

### Issue: Can't create tasks
**Solution:** 
1. Run `test-housekeeping-insert.php` to test database
2. Check browser console (F12) for JavaScript errors
3. Run `debug-housekeeping.php` for detailed debugging

### Issue: "Midle Room" typo visible
**Solution:** Run `fix-room-typo.php`

### Issue: No housekeeping staff to assign
**Solution:** 
1. Go to `staff/hr-employees.php`
2. Add employees with department "Housekeeping"
3. Or run `seed-10-employees.php` for sample data

### Issue: Tasks not showing
**Solution:**
1. Check filter settings (Date: "All Dates", Status: "All Status")
2. Verify tasks exist: run `test-housekeeping-complete.php`
3. Check database: `SELECT * FROM housekeeping_tasks`

---

## 🎯 File Usage Priority

**For Normal Use:**
1. `staff/pms-housekeeping.php` - Main interface ⭐⭐⭐⭐⭐

**For First Setup:**
1. `setup-pms-tables.php` - Create tables ⭐⭐⭐⭐⭐
2. `seed-10-employees.php` - Sample staff ⭐⭐⭐⭐

**For Troubleshooting:**
1. `test-housekeeping-complete.php` - Diagnose issues ⭐⭐⭐⭐⭐
2. `fix-now.php` - Fix missing tables ⭐⭐⭐⭐
3. `fix-room-typo.php` - Fix specific typo ⭐⭐⭐
4. `test-housekeeping-insert.php` - Test database writes ⭐⭐⭐
5. `debug-housekeeping.php` - Advanced debugging ⭐⭐

**For Reference:**
1. `HOUSEKEEPING_CHECK.md` - Full documentation ⭐⭐⭐⭐⭐
2. `HOUSEKEEPING_FIX_SUMMARY.txt` - Quick summary ⭐⭐⭐⭐
3. `HOUSEKEEPING_FILES.md` - This file ⭐⭐⭐⭐

---

## 💡 Tips

1. **Always test after database changes** - Run `test-housekeeping-complete.php`
2. **Check browser console** - Press F12 to see JavaScript errors
3. **Use filters effectively** - Filter by "Today" to see current tasks
4. **Assign tasks early** - Staff can see their assigned tasks immediately
5. **Update status regularly** - Keeps everyone informed of progress
6. **Back up before fixes** - Export database before running fix scripts

---

## 📈 Future Enhancements

See `HOUSEKEEPING_CHECK.md` section "UI Improvements (Optional - Future)" for:
- Bulk actions
- Drag & drop scheduling
- Task templates
- Mobile app view
- Photo uploads
- Time tracking
- Push notifications
- Daily email summaries

---

**Last Updated:** February 2, 2026  
**System Version:** 1.0  
**Status:** Production Ready ✅
