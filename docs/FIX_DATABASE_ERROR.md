# 🔧 FIX: Database Table Missing Error

## ❌ Error Message
```
Fatal error: Table 'hotel_booking.guest_profiles' doesn't exist
```

---

## ✅ QUICK FIX (2 minutes)

### Step 1: Open This URL
```
http://localhost/hotel-booking/setup-pms-tables.php
```

### Step 2: Wait for Setup
The page will automatically:
- ✅ Create `guest_profiles` table
- ✅ Create `housekeeping_tasks` table
- ✅ Create `room_amenities` table
- ✅ Create `loyalty_transactions` table
- ✅ Create `staff_profiles` table

### Step 3: Click "Guest Management"
After setup completes, click the button to test the page.

---

## 🎯 That's It!

The error will be fixed and all PMS pages will work.

---

## 📋 What This Does

Creates 5 essential tables needed for the PMS system:

1. **guest_profiles** - Extended guest information (phone, address, VIP status, loyalty points)
2. **housekeeping_tasks** - Daily cleaning and maintenance tasks
3. **room_amenities** - Room inventory tracking
4. **loyalty_transactions** - Guest loyalty points history
5. **staff_profiles** - Staff information for task assignments

---

## ⚠️ Alternative: Import All Tables

If you want ALL 60+ tables for all 15 modules:

### Option A: Use phpMyAdmin
1. Go to: `http://localhost/phpmyadmin`
2. Select database: `hotel_booking`
3. Click: **Import**
4. Choose file: `database/hotel-management-system.sql`
5. Click: **Go**

### Option B: Use the full import script
```
http://localhost/hotel-booking/import-pms-tables.php
```

---

## 🐛 Still Having Issues?

### Check MySQL is Running
1. Open Laragon
2. Make sure MySQL is started (green light)

### Check Database Exists
1. Go to: `http://localhost/phpmyadmin`
2. Look for `hotel_booking` database in the left sidebar
3. If missing, create it or run `database/database.sql` first

---

## ✅ Quick Summary

**Just open this URL:**
```
http://localhost/hotel-booking/setup-pms-tables.php
```

**Problem solved in 30 seconds!** 🎉

---

**Files Created:**
- `setup-pms-tables.php` - Quick setup (5 essential tables)
- `import-pms-tables.php` - Full import (60+ tables)
