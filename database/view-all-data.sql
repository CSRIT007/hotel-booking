-- ============================================================================
-- View all data in hotel_booking (same DB the admin page uses)
-- Run: psql -d hotel_booking -f database/view-all-data.sql
-- Or in pgAdmin: connect to database "hotel_booking", then run this script
-- ============================================================================

\echo '=== USERS ==='
SELECT * FROM users;

\echo ''
\echo '=== HOTELS ==='
SELECT * FROM hotels;

\echo ''
\echo '=== ROOMS ==='
SELECT * FROM rooms;

\echo ''
\echo '=== BOOKINGS ==='
SELECT * FROM bookings;

\echo ''
\echo '=== CONTACTS ==='
SELECT * FROM contacts;

\echo ''
\echo '=== NOTIFICATIONS ==='
SELECT * FROM notifications;

\echo ''
\echo '=== TESTIMONIALS ==='
SELECT * FROM testimonials;

\echo ''
\echo '=== SERVICES ==='
SELECT * FROM services;
