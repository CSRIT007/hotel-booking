# 🔧 Fix: Import Missing Database Tables

## Problem
The PMS pages require additional database tables that haven't been imported yet.

**Error:** `Table 'hotel_booking.guest_profiles' doesn't exist`

---

## ✅ Solution - Quick Import

### Step 1: Run the Import Script

Open your browser and go to:

```
http://localhost/hotel-booking/import-pms-tables.php
```

This will automatically:
- ✅ Import all 60+ tables from the comprehensive schema
- ✅ Create guest_profiles, housekeeping_tasks, loyalty_transactions, etc.
- ✅ Verify all tables are created
- ✅ Show you the results

### Step 2: Verify

After running the import, you should see:
- ✅ "Successfully executed: X queries"
- ✅ "All required tables created successfully!"

### Step 3: Test the Pages

Click the links at the bottom of the import page to test:
- Guest Management
- Booking Management
- Housekeeping

---

## 📋 Alternative Method - Manual Import

If the PHP script doesn't work, you can import manually:

### Using phpMyAdmin:
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select database: `hotel_booking`
3. Click "Import" tab
4. Choose file: `c:\laragon\www\hotel-booking\database\hotel-management-system.sql`
5. Click "Go"

### Using MySQL Command Line:
```bash
cd c:\laragon\www\hotel-booking\database
mysql -u root hotel_booking < hotel-management-system.sql
```

---

## 📊 What Gets Created

The import creates **60+ tables** for all 15 modules:

### PMS Module (Required for current pages):
- ✅ `guest_profiles` - Extended guest information
- ✅ `housekeeping_tasks` - Cleaning schedules
- ✅ `room_amenities` - Room inventory
- ✅ `loyalty_transactions` - Points history

### Other Modules (For future features):
- POS System (4 tables)
- Central Reservation (4 tables)
- CRM (3 tables)
- Revenue Management (3 tables)
- Finance & Accounting (5 tables)
- HR (7 tables)
- Maintenance (3 tables)
- Security (3 tables)
- Analytics (2 tables)
- Reviews (2 tables)
- Mobile (2 tables)
- Events (2 tables)
- Integrations (2 tables)
- Sustainability (4 tables)
- System (2 tables)

---

## 🎯 After Import

Once tables are imported, all PMS pages will work:
- ✅ `pms-bookings.php` - Full booking management
- ✅ `pms-guests.php` - Guest profiles & loyalty
- ✅ `pms-housekeeping.php` - Task scheduling

---

## ⚠️ Important Notes

1. **Safe to run multiple times** - The SQL uses `CREATE TABLE IF NOT EXISTS`, so it won't duplicate tables
2. **Preserves existing data** - Won't delete any data from existing tables
3. **Sample data included** - Default settings, rate plans, and templates are added
4. **One-time setup** - Only needs to be run once per installation

---

## 🐛 Troubleshooting

### If import fails:
1. Check MySQL is running (Laragon control panel)
2. Check database exists: `hotel_booking`
3. Check file path is correct
4. Check MySQL user has CREATE TABLE permissions

### If tables still missing:
1. Run the import script again
2. Check the error messages
3. Manually create missing tables from the SQL file

---

## ✅ Quick Fix Summary

**Just run this URL:**
```
http://localhost/hotel-booking/import-pms-tables.php
```

**Then test:**
```
http://localhost/hotel-booking/staff/pms-guests.php
```

**Problem solved!** 🎉

---

**Need help?** Check the error messages in the import script output.
