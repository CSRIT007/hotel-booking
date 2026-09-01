# 🚨 Database Import Required

Your database tables are missing! Follow these steps to fix it:

## ✅ Quick Fix (Recommended)

### Option 1: Quick Import Script (Fastest)
1. Visit: **`http://localhost/hotel-booking/quick-import.php`**
2. The script will automatically:
   - Create the database
   - Import all tables
   - Verify everything is set up
3. Done! Visit `index.php` to see your site

### Option 2: Full Import Script (With UI)
1. Visit: **`http://localhost/hotel-booking/import-database.php`**
2. Click **"Import Database Now"** button
3. Wait for confirmation
4. Done!

### Option 3: MySQL Command Line
1. Open **Laragon Terminal** (or Command Prompt)
2. Run:
   ```bash
   cd C:\laragon\www\hotel-booking
   mysql -u root -p < database/database.sql
   ```
3. Press Enter when asked for password (it's empty by default)

### Option 4: phpMyAdmin (If working)
1. Open: `http://localhost/phpmyadmin`
2. Select database: `hotel_booking` (or create it)
3. Click **"Import"** tab
4. Choose file: `database/database.sql`
5. Click **"Go"**

## 🔍 Verify Import

After importing, visit:
- **Setup Check**: `http://localhost/hotel-booking/setup.php`
- **Homepage**: `http://localhost/hotel-booking/index.php`

## ⚠️ Troubleshooting

### "Access denied" error
- Make sure Laragon MySQL is running
- Check database credentials in `config/config.php`

### "File not found" error
- Verify `database/database.sql` exists
- Check file path is correct

### Import fails with errors
- Try the **quick-import.php** script (handles errors better)
- Check MySQL error logs in Laragon
- Make sure MySQL version is 5.7+ or 8.0+

## 📋 What Gets Imported

The database includes:
- ✅ Users table (for login/registration)
- ✅ Hotels table (hotel listings)
- ✅ Rooms table (room details)
- ✅ Bookings table (reservations)
- ✅ Testimonials table (customer reviews)
- ✅ Contacts table (contact form submissions)
- ✅ Services table (service listings)
- ✅ Sample data (3 hotels, 6 rooms, 5 testimonials, 3 services)

---

**Need Help?** Check `FIX_PHPMYADMIN.md` for phpMyAdmin issues.
