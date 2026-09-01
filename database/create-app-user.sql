-- Run this once in phpMyAdmin (SQL tab) while logged in as root.
-- Creates a user for the hotel-booking app so you don't need to use root.

CREATE USER IF NOT EXISTS 'hotel_app'@'localhost' IDENTIFIED BY 'hotel_app_pass';
CREATE USER IF NOT EXISTS 'hotel_app'@'127.0.0.1' IDENTIFIED BY 'hotel_app_pass';

GRANT ALL PRIVILEGES ON hotel_booking.* TO 'hotel_app'@'localhost';
GRANT ALL PRIVILEGES ON hotel_booking.* TO 'hotel_app'@'127.0.0.1';

FLUSH PRIVILEGES;
