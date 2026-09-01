# Fix phpMyAdmin Session Error

If you're getting this error in phpMyAdmin:
```
Error during session start; please check your PHP and/or webserver log file
session_start(): Session cannot be started after headers have already been sent
```

## Quick Fixes (Try in order)

### Solution 1: Clear Browser Cache & Cookies
1. Clear your browser cache and cookies
2. Close and reopen your browser
3. Try accessing phpMyAdmin again: `http://localhost/phpmyadmin`

### Solution 2: Restart Laragon Services
1. In Laragon, click **"Stop All"**
2. Wait 5 seconds
3. Click **"Start All"**
4. Try phpMyAdmin again

### Solution 3: Clear phpMyAdmin Temp Files
1. Close Laragon
2. Navigate to: `C:\laragon\tmp\`
3. Delete all files in this folder (or just the phpMyAdmin related ones)
4. Restart Laragon
5. Try phpMyAdmin again

### Solution 4: Check PHP Output Buffering
1. Open: `C:\laragon\bin\php\php-8.x.x\php.ini` (your PHP version)
2. Find: `output_buffering`
3. Set it to: `output_buffering = 4096` or `On`
4. Save the file
5. Restart Laragon

### Solution 5: Use Alternative Database Tool
If phpMyAdmin continues to have issues, you can use:

**Option A: MySQL Command Line (Laragon Terminal)**
```bash
# Open Laragon Terminal
mysql -u root -p
# Press Enter (password is empty by default)
# Then run:
source C:/laragon/www/hotel-booking/database/database.sql
```

**Option B: Use setup.php Script**
1. Visit: `http://localhost/hotel-booking/setup.php`
2. It will create the database automatically
3. Then import `database/database.sql` manually if needed

**Option C: HeidiSQL or MySQL Workbench**
- Download HeidiSQL (free, lightweight)
- Connect to: localhost, user: root, password: (empty)
- Import the SQL file

### Solution 6: Reinstall phpMyAdmin in Laragon
1. Stop Laragon
2. Delete: `C:\laragon\etc\apps\phpmyadmin\`
3. Restart Laragon
4. Laragon will reinstall phpMyAdmin automatically

## Alternative: Import Database via setup.php

The easiest way is to use the setup script:

1. **Visit**: `http://localhost/hotel-booking/setup.php`
2. It will:
   - Test MySQL connection
   - Create the database if needed
   - Check if tables exist
   - Guide you through setup

3. **If tables are missing**, you can import manually:
   - Use MySQL command line (see Solution 5, Option A)
   - Or use HeidiSQL/MySQL Workbench

## Verify Fix

After trying any solution:
1. Visit: `http://localhost/phpmyadmin`
2. Should see phpMyAdmin login screen (no error)
3. Login with: **root** (password: empty)
4. Check if `hotel_booking` database exists

---

**Note**: This error is usually a phpMyAdmin/Laragon configuration issue, not a problem with your project files. The project files have been fixed to prevent similar issues.
