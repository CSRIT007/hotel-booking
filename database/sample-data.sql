-- Sample data for hotel_booking
USE hotel_booking;

-- Basic users (guests)
INSERT INTO users (username, email, password, role)
VALUES
  ('john', 'john@example.com',  '$2y$10$abcdefghijklmnopqrstuvABCDEFGHijklmnopqrstu', 'guest'),
  ('mary', 'mary@example.com',  '$2y$10$abcdefghijklmnopqrstuvABCDEFGHijklmnopqrstu', 'guest')
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Simple rooms inventory if empty
INSERT INTO rooms (hotel_id, name, description, price, max_persons, size, view_type, beds)
SELECT 1, 'Deluxe Room 101', 'Sample deluxe room', 100.00, 2, '25m2', 'city', 1
WHERE NOT EXISTS (SELECT 1 FROM rooms LIMIT 1);

-- A few example bookings for dashboard and history
INSERT INTO bookings (user_id, room_id, check_in, check_out, guests, total_price, status)
VALUES
  (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 2, 200.00, 'confirmed'),
  (2, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 1, 150.00, 'completed')
ON DUPLICATE KEY UPDATE total_price = VALUES(total_price);

-- Example contact messages
INSERT INTO contacts (name, email, subject, message, status)
VALUES
  ('Alice Guest', 'alice@example.com', 'Question about booking', 'Can I check in early?', 'new'),
  ('Bob Guest', 'bob@example.com', 'Airport pickup', 'Do you offer airport pickup service?', 'new');

-- Simple housekeeping tasks if module exists
INSERT INTO housekeeping_tasks (room_id, assigned_to, task_type, priority, status, scheduled_date)
SELECT 1, NULL, 'cleaning', 'medium', 'pending', CURDATE()
WHERE EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'hotel_booking' AND TABLE_NAME = 'housekeeping_tasks');

-- POS demo data if POS tables exist
INSERT INTO pos_categories (name, description, type)
SELECT 'Restaurant', 'Main restaurant', 'food'
WHERE NOT EXISTS (SELECT 1 FROM information_schema.TABLES t
                  JOIN pos_categories c ON 1=0
                  WHERE t.TABLE_SCHEMA = 'hotel_booking' AND t.TABLE_NAME = 'pos_categories');

-- POS products for Products sub-page
INSERT INTO pos_products (category_id, name, description, price, cost, sku, stock_quantity, min_stock_level, status)
SELECT c.id, 'Grilled Salmon', 'Signature grilled salmon with lemon butter sauce', 18.00, 9.00, 'FOOD-GRILL-SAL', 30, 5, 'active'
FROM pos_categories c
WHERE c.name = 'Restaurant'
  AND NOT EXISTS (SELECT 1 FROM pos_products WHERE name = 'Grilled Salmon')
LIMIT 1;

INSERT INTO pos_products (category_id, name, description, price, cost, sku, stock_quantity, min_stock_level, status)
SELECT c.id, 'Caesar Salad', 'Fresh romaine lettuce with Caesar dressing', 9.50, 4.00, 'FOOD-SAL-CAES', 40, 5, 'active'
FROM pos_categories c
WHERE c.name = 'Restaurant'
  AND NOT EXISTS (SELECT 1 FROM pos_products WHERE name = 'Caesar Salad')
LIMIT 1;

INSERT INTO pos_products (category_id, name, description, price, cost, sku, stock_quantity, min_stock_level, status)
SELECT c.id, 'House Coffee', 'Freshly brewed house blend coffee', 3.50, 0.80, 'DRINK-COF-HSE', 100, 10, 'active'
FROM pos_categories c
WHERE c.name = 'Restaurant'
  AND NOT EXISTS (SELECT 1 FROM pos_products WHERE name = 'House Coffee')
LIMIT 1;

INSERT INTO pos_transactions (booking_id, guest_id, staff_id, transaction_type, subtotal, tax, discount, total_amount, payment_method, payment_status)
SELECT 1, 1, 1, 'restaurant', 50.00, 5.00, 0.00, 55.00, 'cash', 'paid'
WHERE EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'hotel_booking' AND TABLE_NAME = 'pos_transactions');

-- Event module demo data if tables exist
INSERT INTO event_spaces (name, location, capacity, amenities, hourly_rate, status, notes)
SELECT 'Grand Ballroom', '1st Floor', 200, 'Stage, sound system, projector', 250.00, 'available', 'Sample demo hall'
WHERE EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'hotel_booking' AND TABLE_NAME = 'event_spaces')
  AND NOT EXISTS (SELECT 1 FROM event_spaces LIMIT 1);

INSERT INTO event_bookings (space_id, event_name, contact_name, contact_email, contact_phone, event_date, start_time, end_time, guests, total_amount, notes, status)
SELECT id, 'Sample Conference', 'Demo Client', 'client@example.com', '123456789', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '09:00', '13:00', 80, 1000.00, 'Demo booking for dashboards', 'confirmed'
FROM event_spaces
WHERE EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'hotel_booking' AND TABLE_NAME = 'event_bookings')
  AND NOT EXISTS (SELECT 1 FROM event_bookings LIMIT 1)
LIMIT 1;

