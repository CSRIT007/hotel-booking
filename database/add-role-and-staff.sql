-- Run this on existing database to add staff support
USE hotel_booking;

-- Add role column (ignore error if it already exists)
ALTER TABLE users ADD COLUMN role ENUM('guest', 'staff') DEFAULT 'guest' AFTER password;

-- Set existing users to guest
UPDATE users SET role = 'guest' WHERE role IS NULL OR TRIM(COALESCE(role, '')) = '';

-- Staff user: create via create-staff.php in project root (sets password securely)
