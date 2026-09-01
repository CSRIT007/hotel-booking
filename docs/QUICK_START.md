# 🚀 Quick Start Guide - Laragon

## Step 1: Start Laragon
1. Open **Laragon** application
2. Click **"Start All"** button (or make sure Apache and MySQL are running - they should be green)
3. Wait for services to start (usually takes a few seconds)

## Step 2: Setup Database

### Option A: Using Setup Script (Recommended)
1. Open your browser
2. Go to: `http://localhost/hotel-booking/setup.php`
3. Follow the on-screen instructions
4. If tables are missing, it will guide you to import the database

### Option B: Using phpMyAdmin
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click on **"Import"** tab
3. Click **"Choose File"** and select `database/database.sql` from the project folder
4. Click **"Go"** button
5. Wait for import to complete

### Option C: Using MySQL Command Line
```bash
# In Laragon terminal or MySQL command line:
mysql -u root -p < database/database.sql
# (Press Enter when asked for password, as default is empty)
```

## Step 3: Access Your Website

Open your browser and visit:
- **Main URL**: `http://localhost/hotel-booking/`
- **Or if you have virtual host**: `http://hotel-booking.test/`

## Step 4: Test the System

1. **Register a new account**: Click "Register" and create an account
2. **Login**: Use your credentials to login
3. **Browse Rooms**: Check out available rooms
4. **Make a Booking**: Select a room and book it
5. **Contact Form**: Try submitting the contact form

## 📋 Default Laragon Settings

- **Apache Port**: 80
- **MySQL Port**: 3306
- **Database User**: root
- **Database Password**: (empty)
- **phpMyAdmin**: `http://localhost/phpmyadmin`

## 🔧 Troubleshooting

### Database Connection Error?
- ✅ Make sure MySQL is running in Laragon
- ✅ Check `config.php` has correct credentials
- ✅ Verify database `hotel_booking` exists

### Page Not Found?
- ✅ Make sure Apache is running
- ✅ Check URL: `http://localhost/hotel-booking/`
- ✅ Verify files are in `C:\laragon\www\hotel-booking\`

### Import Database Failed?
- ✅ Make sure MySQL is running
- ✅ Check file path to `database.sql`
- ✅ Try importing through phpMyAdmin instead

### Still Having Issues?
1. Run `setup.php` to diagnose: `http://localhost/hotel-booking/setup.php`
2. Check Laragon logs
3. Verify PHP version (should be 7.4+)

## 📁 Project Structure

```
hotel-booking/
├── index.php              ← Start here!
├── setup.php              ← Run this first for setup
├── config/
│   └── config.php        ← Database configuration
├── database/
│   └── database.sql      ← Import this to database
└── ...
```

## ✅ Success Checklist

- [ ] Laragon is running (Apache + MySQL green)
- [ ] Database `hotel_booking` exists
- [ ] Tables are created (users, hotels, rooms, etc.)
- [ ] Can access `http://localhost/hotel-booking/`
- [ ] Can register a new user
- [ ] Can login
- [ ] Can view rooms

---

**Need Help?** Check `README.md` for more detailed information.
