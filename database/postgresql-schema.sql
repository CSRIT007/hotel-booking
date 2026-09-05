-- ============================================================================
-- Hotel Booking — PostgreSQL schema
-- dialect: postgres
-- ============================================================================
-- Use this as reference to create tables in Tadabase (Tadabase uses PostgreSQL).
-- In Tadabase you create tables in the UI; field names below match the app.
--
-- To create and use a real PostgreSQL database:
--   1. Create database:  createdb hotel_booking
--   2. Run this file:    psql -d hotel_booking -f database/postgresql-schema.sql
-- ============================================================================

-- Users (guests and staff)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'guest' CHECK (role IN ('guest', 'staff')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
    failed_login_count INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Hotels
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    image VARCHAR(255),
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    hotel_id INT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    max_persons INT NOT NULL DEFAULT 2,
    size VARCHAR(20),
    view_type VARCHAR(50),
    beds INT NOT NULL DEFAULT 1,
    image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'maintenance')),
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);

-- Notifications (optional)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('confirmed', 'cancelled')),
    message TEXT NOT NULL,
    is_read SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials
CREATE TABLE IF NOT EXISTS testimonials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    message TEXT NOT NULL,
    image VARCHAR(255),
    rating INT DEFAULT 5,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Contacts (contact form submissions)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    image VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- POS Products (for admin POS Products page)
CREATE TABLE IF NOT EXISTS pos_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- POS Transactions (for admin POS Sales / Transactions pages)
CREATE TABLE IF NOT EXISTS pos_transactions (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES pos_products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'room_charge', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Expenses (Finance > Expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'other')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Audit log (staff and guest actions)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INT REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(100),
    actor_role VARCHAR(20),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id INT,
    summary TEXT NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity);

-- ============================================================================
-- Sample data (only inserted when tables are empty)
-- ============================================================================
INSERT INTO hotels (name, description, location, image)
SELECT * FROM (VALUES
  ('Sheraton', 'Comfort and style in the heart of the city.', 'Cairo', 'images/services-1.jpg'),
  ('The Plaza Hotel', 'Premium accommodation with excellent service.', 'New York', 'images/image_4.jpg'),
  ('The Ritz', 'Luxury and elegance for every guest.', 'Paris', 'images/image_4.jpg')
) AS v(name, description, location, image)
WHERE NOT EXISTS (SELECT 1 FROM hotels LIMIT 1);

INSERT INTO rooms (hotel_id, name, description, price, max_persons, size, view_type, beds, image)
SELECT * FROM (VALUES
  (1, 'Suite Room', 'Luxurious suite with modern amenities', 120.00, 3, '45 m2', 'Sea View', 1, 'images/room-1.jpg'),
  (1, 'Standard Room', 'Comfortable standard room', 80.00, 2, '30 m2', 'City View', 1, 'images/room-2.jpg'),
  (1, 'Family Room', 'Spacious room for families', 150.00, 4, '60 m2', 'Sea View', 2, 'images/room-3.jpg'),
  (1, 'Deluxe Room', 'Premium deluxe accommodation', 200.00, 3, '50 m2', 'Sea View', 1, 'images/room-4.jpg')
) AS v(hotel_id, name, description, price, max_persons, size, view_type, beds, image)
WHERE NOT EXISTS (SELECT 1 FROM rooms LIMIT 1);

INSERT INTO testimonials (name, position, message, image, rating)
SELECT * FROM (VALUES
  ('Racky Henderson', 'Father', 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', 'images/person_1.jpg', 5),
  ('Henry Dee', 'Businesswoman', 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', 'images/person_2.jpg', 5)
) AS v(name, position, message, image, rating)
WHERE NOT EXISTS (SELECT 1 FROM testimonials LIMIT 1);

INSERT INTO services (name, description, icon, image, status)
SELECT * FROM (VALUES
  ('Map Direction', 'Easy directions to reach us.', 'flaticon-map', 'images/services-1.jpg', 'active'),
  ('Accommodation', 'Comfortable rooms and amenities.', 'flaticon-hotel', 'images/services-2.jpg', 'active'),
  ('Great Experience', 'Memorable stays for every guest.', 'flaticon-star', 'images/image_2.jpg', 'active')
) AS v(name, description, icon, image, status)
WHERE NOT EXISTS (SELECT 1 FROM services LIMIT 1);

INSERT INTO pos_products (name, category, price, stock, status)
SELECT * FROM (VALUES
  ('Mineral Water', 'Beverages', 2.50, 100, 'active'),
  ('Coffee', 'Beverages', 4.00, 50, 'active'),
  ('Sandwich', 'Food', 8.00, 30, 'active'),
  ('Snack Pack', 'Food', 5.00, 40, 'active'),
  ('Toiletries Set', 'Amenities', 15.00, 25, 'active')
) AS v(name, category, price, stock, status)
WHERE NOT EXISTS (SELECT 1 FROM pos_products LIMIT 1);

INSERT INTO pos_transactions (product_id, quantity, total_amount, payment_method, status)
SELECT * FROM (VALUES
  (1, 2, 5.00, 'cash', 'paid'),
  (2, 1, 4.00, 'card', 'paid'),
  (3, 3, 24.00, 'room_charge', 'paid'),
  (4, 1, 5.00, 'cash', 'pending'),
  (5, 1, 15.00, 'card', 'refunded')
) AS v(product_id, quantity, total_amount, payment_method, status)
WHERE NOT EXISTS (SELECT 1 FROM pos_transactions LIMIT 1);

INSERT INTO expenses (description, category, amount, expense_date, payment_method)
SELECT v.description, v.category, v.amount, CURRENT_DATE - v.days_ago, v.payment_method
FROM (VALUES
  ('Electricity bill', 'Utilities', 420.00, 12, 'bank_transfer'),
  ('Housekeeping supplies', 'Supplies', 85.50, 8, 'cash'),
  ('Facebook ads', 'Marketing', 120.00, 3, 'card'),
  ('AC repair - Suite Room', 'Maintenance', 95.00, 1, 'cash')
) AS v(description, category, amount, days_ago, payment_method)
WHERE NOT EXISTS (SELECT 1 FROM expenses LIMIT 1);

-- HR
CREATE TABLE IF NOT EXISTS hr_employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    department VARCHAR(40) NOT NULL DEFAULT 'Other',
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(120),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    salary DECIMAL(12, 2) DEFAULT 0,
    salary_type VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (salary_type IN ('hourly', 'monthly', 'annual')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_schedules (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'morning' CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night')),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hr_payroll (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES hr_employees(id) ON DELETE RESTRICT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0,
    overtime_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
    bonuses DECIMAL(12, 2) NOT NULL DEFAULT 0,
    deductions DECIMAL(12, 2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_date DATE,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'check')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payroll_id INT UNIQUE REFERENCES hr_payroll(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS hr_leaves (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL DEFAULT 'vacation' CHECK (leave_type IN ('vacation', 'sick', 'personal', 'unpaid', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL DEFAULT 1,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS home_slides (
    id SERIAL PRIMARY KEY,
    eyebrow VARCHAR(120),
    title VARCHAR(200) NOT NULL,
    subtitle TEXT,
    image VARCHAR(255) NOT NULL,
    button_label VARCHAR(80),
    button_link VARCHAR(200),
    sort_order INT NOT NULL DEFAULT 1 CHECK (sort_order BETWEEN 1 AND 3),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
