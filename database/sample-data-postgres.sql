-- ============================================================================
-- Sample data for all relevant tables (PostgreSQL)
-- Run after postgresql-schema.sql. Safe to run multiple times (skips if exists).
-- ============================================================================

-- Enable bcrypt password hashing (same as Node bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- USERS (guests — Admin/staff create via: node vue-app/api-server/create-admin.js)
-- ============================================================================
INSERT INTO users (username, email, password, role)
SELECT v.username, v.email, crypt(v.pass, gen_salt('bf')), v.role
FROM (VALUES
  ('john', 'john@example.com', 'guest123', 'guest'),
  ('mary', 'mary@example.com', 'guest123', 'guest'),
  ('alice', 'alice@example.com', 'guest123', 'guest')
) AS v(username, email, pass, role)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'john');

-- ============================================================================
-- BOOKINGS (uses existing users and rooms; skip if sample bookings already exist)
-- ============================================================================
INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status)
SELECT u.id, 1, CURRENT_DATE + 7, CURRENT_DATE + 9, 2, 240.00, 'pending'
FROM users u
WHERE u.role = 'guest' AND u.username = 'john'
  AND NOT EXISTS (SELECT 1 FROM bookings LIMIT 1)
LIMIT 1;

INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status)
SELECT u.id, 2, CURRENT_DATE - 5, CURRENT_DATE - 3, 2, 300.00, 'completed'
FROM users u
WHERE u.role = 'guest' AND u.username = 'mary'
  AND (SELECT COUNT(*) FROM bookings) < 2
LIMIT 1;

INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status)
SELECT u.id, 3, CURRENT_DATE + 14, CURRENT_DATE + 16, 3, 360.00, 'confirmed'
FROM users u
WHERE u.role = 'guest' AND u.username = 'alice'
  AND (SELECT COUNT(*) FROM bookings) < 3
LIMIT 1;

-- ============================================================================
-- CONTACTS (contact form messages)
-- ============================================================================
INSERT INTO contacts (name, email, subject, message, status)
SELECT 'Alice Guest', 'alice@example.com', 'Early check-in', 'Can I check in before 3 PM?', 'new'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'alice@example.com' AND subject = 'Early check-in');

INSERT INTO contacts (name, email, subject, message, status)
SELECT 'Bob Smith', 'bob@example.com', 'Airport pickup', 'Do you offer airport transfer?', 'read'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'bob@example.com' AND subject = 'Airport pickup');

INSERT INTO contacts (name, email, subject, message, status)
SELECT 'Emma Wilson', 'emma@example.com', 'Group booking', 'We need 5 rooms for a wedding. Please contact me.', 'new'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE email = 'emma@example.com' AND subject = 'Group booking');

-- ============================================================================
-- NOTIFICATIONS (optional — when staff confirms/cancels a booking)
-- ============================================================================
INSERT INTO notifications (user_id, booking_id, type, message, is_read)
SELECT b.user_id, b.id, 'confirmed', 'Your booking for ' || r.name || ' has been confirmed.', 0
FROM bookings b
JOIN rooms r ON r.id = b.room_id
WHERE b.status = 'confirmed'
  AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.booking_id = b.id)
LIMIT 1;

-- ============================================================================
-- Extra HOTELS (if you want more)
-- ============================================================================
INSERT INTO hotels (name, description, location, image)
SELECT * FROM (VALUES
  ('Sunset Resort', 'Beachfront resort with pool and spa.', 'Bali', 'images/image_4.jpg')
) AS v(name, description, location, image)
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE name = 'Sunset Resort');

-- ============================================================================
-- Extra ROOMS (for hotel id 4 if Sunset Resort was just inserted)
-- ============================================================================
INSERT INTO rooms (hotel_id, name, description, price, max_persons, size, view_type, beds, image)
SELECT 4, 'Ocean View Suite', 'Stunning ocean view with balcony.', 280.00, 4, '55 m2', 'Ocean View', 2, 'images/room-4.jpg'
FROM hotels
WHERE name = 'Sunset Resort' AND NOT EXISTS (SELECT 1 FROM rooms WHERE hotel_id = 4 AND name = 'Ocean View Suite')
LIMIT 1;

-- ============================================================================
-- Extra TESTIMONIALS
-- ============================================================================
INSERT INTO testimonials (name, position, message, image, rating, status)
SELECT * FROM (VALUES
  ('Mark Huff', 'Businessman', 'Wonderful stay. The staff was very helpful and the room was spotless.', 'images/person_3.jpg', 5, 'active'),
  ('Rodel Golez', 'Traveler', 'Best hotel in the area. Will definitely come back!', 'images/person_4.jpg', 5, 'active')
) AS v(name, position, message, image, rating, status)
WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE name = 'Mark Huff');

-- ============================================================================
-- Extra SERVICES
-- ============================================================================
INSERT INTO services (name, description, icon, image, status)
SELECT 'Airport Transfer', 'Comfortable transfer to and from the airport.', 'flaticon-transport', 'images/services-1.jpg', 'active'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Airport Transfer');
