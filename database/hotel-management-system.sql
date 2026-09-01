-- ============================================================================
-- COMPREHENSIVE HOTEL MANAGEMENT SYSTEM DATABASE SCHEMA
-- ============================================================================
-- This schema includes all 15 modules for a complete Hotel Management System
-- Run this after the base database.sql to add advanced features
-- ============================================================================

USE hotel_booking;

-- ============================================================================
-- 1. PROPERTY MANAGEMENT SYSTEM (PMS) - Enhanced Tables
-- ============================================================================

-- Guest Profiles (Enhanced user management)
CREATE TABLE IF NOT EXISTS guest_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    passport_number VARCHAR(50),
    id_number VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),
    preferences TEXT COMMENT 'JSON: room preferences, dietary needs, etc.',
    vip_status ENUM('regular', 'silver', 'gold', 'platinum') DEFAULT 'regular',
    loyalty_points INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_vip (vip_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Housekeeping Management
CREATE TABLE IF NOT EXISTS housekeeping_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    assigned_to INT COMMENT 'Staff user_id',
    task_type ENUM('cleaning', 'maintenance', 'inspection', 'turndown', 'deep_clean') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    completed_at TIMESTAMP NULL,
    notes TEXT,
    checklist TEXT COMMENT 'JSON: cleaning checklist items',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room (room_id),
    INDEX idx_status (status),
    INDEX idx_date (scheduled_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Room Inventory & Amenities
CREATE TABLE IF NOT EXISTS room_amenities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    amenity_name VARCHAR(100) NOT NULL,
    quantity INT DEFAULT 1,
    condition_status ENUM('good', 'fair', 'needs_replacement') DEFAULT 'good',
    last_checked DATE,
    notes TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. POINT OF SALE (POS) SYSTEM
-- ============================================================================

-- POS Categories (Restaurant, Bar, Spa, etc.)
CREATE TABLE IF NOT EXISTS pos_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('food', 'beverage', 'spa', 'retail', 'other') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POS Products/Services
CREATE TABLE IF NOT EXISTS pos_products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) DEFAULT 0,
    sku VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    min_stock_level INT DEFAULT 0,
    image VARCHAR(255),
    status ENUM('active', 'inactive', 'out_of_stock') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES pos_categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POS Transactions
CREATE TABLE IF NOT EXISTS pos_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT COMMENT 'Link to guest booking if applicable',
    guest_id INT COMMENT 'Guest user_id',
    staff_id INT NOT NULL COMMENT 'Staff who processed transaction',
    transaction_type ENUM('restaurant', 'bar', 'spa', 'retail', 'room_service', 'other') NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('cash', 'card', 'room_charge', 'mobile', 'other') NOT NULL,
    payment_status ENUM('pending', 'paid', 'refunded', 'cancelled') DEFAULT 'paid',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_date (transaction_date),
    INDEX idx_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- POS Transaction Items
CREATE TABLE IF NOT EXISTS pos_transaction_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (transaction_id) REFERENCES pos_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES pos_products(id) ON DELETE RESTRICT,
    INDEX idx_transaction (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. CENTRAL RESERVATION SYSTEM (CRS)
-- ============================================================================

-- Rate Plans
CREATE TABLE IF NOT EXISTS rate_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    min_nights INT DEFAULT 1,
    max_nights INT DEFAULT 365,
    advance_booking_days INT DEFAULT 0,
    cancellation_policy TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dates (valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Room Rate Calendar
CREATE TABLE IF NOT EXISTS room_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    rate_plan_id INT,
    date DATE NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    dynamic_price DECIMAL(10, 2) NOT NULL COMMENT 'Price after dynamic pricing',
    availability INT NOT NULL DEFAULT 1,
    min_stay INT DEFAULT 1,
    max_stay INT DEFAULT 365,
    closed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id) ON DELETE SET NULL,
    UNIQUE KEY unique_room_date (room_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Channel Manager (OTA Integrations)
CREATE TABLE IF NOT EXISTS distribution_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Booking.com, Expedia, Airbnb, etc.',
    channel_type ENUM('ota', 'gds', 'direct', 'corporate', 'travel_agent') NOT NULL,
    commission_percentage DECIMAL(5, 2) DEFAULT 0,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    status ENUM('active', 'inactive', 'testing') DEFAULT 'active',
    last_sync TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Channel Bookings Tracking
CREATE TABLE IF NOT EXISTS channel_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    channel_id INT NOT NULL,
    channel_booking_ref VARCHAR(100),
    commission_amount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES distribution_channels(id) ON DELETE RESTRICT,
    INDEX idx_booking (booking_id),
    INDEX idx_channel (channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. CUSTOMER RELATIONSHIP MANAGEMENT (CRM)
-- ============================================================================

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    campaign_type ENUM('email', 'sms', 'push', 'social', 'promotional') NOT NULL,
    target_segment VARCHAR(100) COMMENT 'VIP, returning guests, etc.',
    discount_code VARCHAR(50),
    discount_value DECIMAL(10, 2),
    start_date DATE,
    end_date DATE,
    status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
    sent_count INT DEFAULT 0,
    open_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    conversion_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guest Communication Log
CREATE TABLE IF NOT EXISTS guest_communications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    campaign_id INT,
    communication_type ENUM('email', 'sms', 'call', 'chat', 'in_person') NOT NULL,
    subject VARCHAR(200),
    message TEXT,
    sent_by INT COMMENT 'Staff user_id',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_guest (guest_id),
    INDEX idx_date (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Loyalty Program
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    transaction_type ENUM('earn', 'redeem', 'expire', 'adjustment') NOT NULL,
    points INT NOT NULL,
    booking_id INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    INDEX idx_guest (guest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. REVENUE MANAGEMENT SYSTEM (RMS)
-- ============================================================================

-- Demand Forecasting
CREATE TABLE IF NOT EXISTS demand_forecast (
    id INT AUTO_INCREMENT PRIMARY KEY,
    forecast_date DATE NOT NULL,
    room_type_id INT,
    predicted_occupancy DECIMAL(5, 2) COMMENT 'Percentage',
    predicted_adr DECIMAL(10, 2) COMMENT 'Average Daily Rate',
    predicted_revpar DECIMAL(10, 2) COMMENT 'Revenue Per Available Room',
    confidence_level DECIMAL(5, 2),
    factors TEXT COMMENT 'JSON: events, seasonality, etc.',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_forecast (forecast_date, room_type_id),
    INDEX idx_date (forecast_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pricing Rules
CREATE TABLE IF NOT EXISTS pricing_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_type ENUM('occupancy_based', 'event_based', 'seasonal', 'day_of_week', 'length_of_stay') NOT NULL,
    condition_json TEXT COMMENT 'JSON: conditions for rule',
    adjustment_type ENUM('percentage', 'fixed_amount') NOT NULL,
    adjustment_value DECIMAL(10, 2) NOT NULL,
    priority INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Competitor Rate Tracking
CREATE TABLE IF NOT EXISTS competitor_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competitor_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    room_type VARCHAR(100),
    rate DECIMAL(10, 2) NOT NULL,
    availability ENUM('available', 'limited', 'sold_out') DEFAULT 'available',
    source VARCHAR(100),
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_competitor_date (competitor_name, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. ACCOUNTING & FINANCIAL MANAGEMENT (Enhanced)
-- ============================================================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_code VARCHAR(20) NOT NULL UNIQUE,
    account_name VARCHAR(200) NOT NULL,
    account_type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
    parent_account_id INT,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    INDEX idx_type (account_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- General Ledger
CREATE TABLE IF NOT EXISTS general_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    debit DECIMAL(12, 2) DEFAULT 0,
    credit DECIMAL(12, 2) DEFAULT 0,
    reference_type VARCHAR(50) COMMENT 'booking, expense, pos_transaction, etc.',
    reference_id INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_account (account_id),
    INDEX idx_date (transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expenses (Enhanced from existing finance tables)
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL COMMENT 'Utilities, Salaries, Supplies, Marketing, etc.',
    subcategory VARCHAR(100),
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method ENUM('cash', 'bank_transfer', 'card', 'check', 'other') NOT NULL,
    vendor_name VARCHAR(200),
    invoice_number VARCHAR(100),
    receipt_file VARCHAR(255),
    account_id INT COMMENT 'Link to chart of accounts',
    status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
    approved_by INT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_date (expense_date),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    booking_id INT,
    guest_id INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2) NOT NULL,
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_status (status),
    INDEX idx_guest (guest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT,
    booking_id INT,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer', 'mobile_payment', 'check', 'other') NOT NULL,
    transaction_reference VARCHAR(100),
    gateway VARCHAR(50) COMMENT 'Stripe, PayPal, etc.',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    notes TEXT,
    processed_by INT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice (invoice_id),
    INDEX idx_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. HUMAN RESOURCES (HR) MANAGEMENT
-- ============================================================================

-- Staff Profiles (Enhanced)
CREATE TABLE IF NOT EXISTS staff_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department ENUM('front_desk', 'housekeeping', 'maintenance', 'food_beverage', 'management', 'sales', 'accounting', 'security', 'other') NOT NULL,
    position VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    termination_date DATE,
    salary DECIMAL(10, 2),
    salary_type ENUM('hourly', 'monthly', 'annual') DEFAULT 'monthly',
    phone VARCHAR(20),
    emergency_contact VARCHAR(200),
    emergency_phone VARCHAR(20),
    address TEXT,
    status ENUM('active', 'on_leave', 'terminated') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_department (department),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Schedules
CREATE TABLE IF NOT EXISTS staff_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    shift_date DATE NOT NULL,
    shift_start TIME NOT NULL,
    shift_end TIME NOT NULL,
    shift_type ENUM('morning', 'afternoon', 'evening', 'night', 'split') NOT NULL,
    status ENUM('scheduled', 'completed', 'absent', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_staff_date (staff_id, shift_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance & Time Tracking
CREATE TABLE IF NOT EXISTS staff_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    schedule_id INT,
    clock_in TIMESTAMP NOT NULL,
    clock_out TIMESTAMP,
    break_duration INT DEFAULT 0 COMMENT 'Minutes',
    total_hours DECIMAL(5, 2),
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    status ENUM('present', 'late', 'absent', 'half_day') DEFAULT 'present',
    notes TEXT,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES staff_schedules(id) ON DELETE SET NULL,
    INDEX idx_staff (staff_id),
    INDEX idx_date (clock_in)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payroll
CREATE TABLE IF NOT EXISTS payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    base_salary DECIMAL(10, 2) NOT NULL,
    overtime_pay DECIMAL(10, 2) DEFAULT 0,
    bonuses DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    net_pay DECIMAL(10, 2) NOT NULL,
    payment_date DATE,
    payment_method ENUM('bank_transfer', 'cash', 'check') DEFAULT 'bank_transfer',
    status ENUM('draft', 'approved', 'paid') DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_staff (staff_id),
    INDEX idx_period (pay_period_start, pay_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Performance Reviews
CREATE TABLE IF NOT EXISTS performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    review_date DATE NOT NULL,
    review_period_start DATE,
    review_period_end DATE,
    overall_rating DECIMAL(3, 2) COMMENT 'Out of 5.00',
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    comments TEXT,
    status ENUM('draft', 'completed', 'acknowledged') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_staff (staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Management
CREATE TABLE IF NOT EXISTS staff_leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    leave_type ENUM('vacation', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    approved_by INT,
    approval_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_staff (staff_id),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. MAINTENANCE MANAGEMENT
-- ============================================================================

-- Maintenance Requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT,
    location VARCHAR(200) COMMENT 'If not room-specific',
    request_type ENUM('repair', 'preventive', 'inspection', 'emergency', 'upgrade') NOT NULL,
    category VARCHAR(100) COMMENT 'Plumbing, Electrical, HVAC, Furniture, etc.',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    description TEXT NOT NULL,
    reported_by INT,
    assigned_to INT,
    status ENUM('open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled') DEFAULT 'open',
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_date DATE,
    completed_date TIMESTAMP NULL,
    estimated_cost DECIMAL(10, 2),
    actual_cost DECIMAL(10, 2),
    notes TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_room (room_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Maintenance Schedule (Preventive)
CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_name VARCHAR(200) NOT NULL COMMENT 'HVAC Unit 1, Elevator, Pool Pump, etc.',
    asset_location VARCHAR(200),
    maintenance_type VARCHAR(100) NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly', 'quarterly', 'annually') NOT NULL,
    last_service_date DATE,
    next_service_date DATE NOT NULL,
    assigned_to INT,
    checklist TEXT COMMENT 'JSON: maintenance checklist',
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_next_date (next_service_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Spare Parts Inventory
CREATE TABLE IF NOT EXISTS spare_parts_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(100),
    category VARCHAR(100),
    quantity INT NOT NULL DEFAULT 0,
    min_quantity INT DEFAULT 0,
    unit_cost DECIMAL(10, 2),
    supplier VARCHAR(200),
    location VARCHAR(100),
    last_restocked DATE,
    status ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. SECURITY & ACCESS CONTROL
-- ============================================================================

-- Access Logs
CREATE TABLE IF NOT EXISTS access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    room_id INT,
    access_type ENUM('key_card', 'mobile_key', 'master_key', 'manual') NOT NULL,
    access_point VARCHAR(100) COMMENT 'Room door, main entrance, etc.',
    access_granted TINYINT(1) NOT NULL,
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    denied_reason VARCHAR(200),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_room (room_id),
    INDEX idx_time (access_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security Incidents
CREATE TABLE IF NOT EXISTS security_incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_type ENUM('theft', 'vandalism', 'unauthorized_access', 'safety_hazard', 'disturbance', 'medical', 'fire', 'other') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    location VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    reported_by INT NOT NULL,
    reported_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_to INT,
    status ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open',
    resolution TEXT,
    resolved_time TIMESTAMP NULL,
    police_notified TINYINT(1) DEFAULT 0,
    police_report_number VARCHAR(100),
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_time (reported_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Surveillance Camera Logs
CREATE TABLE IF NOT EXISTS surveillance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    camera_location VARCHAR(200) NOT NULL,
    event_type ENUM('motion_detected', 'person_detected', 'alarm_triggered', 'manual_review', 'other') NOT NULL,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    video_file VARCHAR(255),
    reviewed_by INT,
    notes TEXT,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_camera (camera_id),
    INDEX idx_time (event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. ANALYTICS & REPORTING (Enhanced)
-- ============================================================================

-- Daily Operations Report
CREATE TABLE IF NOT EXISTS daily_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    total_rooms INT NOT NULL,
    occupied_rooms INT NOT NULL,
    occupancy_rate DECIMAL(5, 2),
    adr DECIMAL(10, 2) COMMENT 'Average Daily Rate',
    revpar DECIMAL(10, 2) COMMENT 'Revenue Per Available Room',
    total_revenue DECIMAL(12, 2),
    room_revenue DECIMAL(12, 2),
    fb_revenue DECIMAL(12, 2) COMMENT 'Food & Beverage',
    other_revenue DECIMAL(12, 2),
    arrivals INT DEFAULT 0,
    departures INT DEFAULT 0,
    no_shows INT DEFAULT 0,
    cancellations INT DEFAULT 0,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Guest Satisfaction Metrics
CREATE TABLE IF NOT EXISTS guest_satisfaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    guest_id INT NOT NULL,
    overall_rating DECIMAL(3, 2) COMMENT 'Out of 5.00',
    cleanliness_rating DECIMAL(3, 2),
    service_rating DECIMAL(3, 2),
    amenities_rating DECIMAL(3, 2),
    value_rating DECIMAL(3, 2),
    location_rating DECIMAL(3, 2),
    feedback TEXT,
    would_recommend TINYINT(1),
    survey_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. ONLINE REVIEWS & REPUTATION MANAGEMENT
-- ============================================================================

-- External Reviews
CREATE TABLE IF NOT EXISTS external_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform ENUM('google', 'tripadvisor', 'booking_com', 'expedia', 'yelp', 'facebook', 'other') NOT NULL,
    reviewer_name VARCHAR(200),
    review_date DATE NOT NULL,
    rating DECIMAL(3, 2) NOT NULL,
    title VARCHAR(255),
    review_text TEXT,
    review_url VARCHAR(500),
    booking_id INT,
    response_text TEXT,
    responded_by INT,
    response_date TIMESTAMP NULL,
    sentiment ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
    flagged TINYINT(1) DEFAULT 0,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_platform (platform),
    INDEX idx_date (review_date),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Review Response Templates
CREATE TABLE IF NOT EXISTS review_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    sentiment_type ENUM('positive', 'neutral', 'negative') NOT NULL,
    template_text TEXT NOT NULL,
    usage_count INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. MOBILE SOLUTIONS
-- ============================================================================

-- Mobile Check-ins
CREATE TABLE IF NOT EXISTS mobile_checkins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    guest_id INT NOT NULL,
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_type VARCHAR(50),
    device_id VARCHAR(200),
    digital_key_issued TINYINT(1) DEFAULT 0,
    key_expiry TIMESTAMP NULL,
    status ENUM('pending', 'approved', 'completed') DEFAULT 'pending',
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Service Requests (Mobile App)
CREATE TABLE IF NOT EXISTS service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    guest_id INT NOT NULL,
    booking_id INT,
    request_type ENUM('housekeeping', 'room_service', 'concierge', 'maintenance', 'wake_up_call', 'extra_amenities', 'other') NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    assigned_to INT,
    status ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    requested_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_time TIMESTAMP NULL,
    guest_rating DECIMAL(3, 2),
    notes TEXT,
    FOREIGN KEY (guest_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_guest (guest_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. EVENT MANAGEMENT
-- ============================================================================

-- Event Spaces
CREATE TABLE IF NOT EXISTS event_spaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    space_name VARCHAR(200) NOT NULL,
    capacity INT NOT NULL,
    area_sqm DECIMAL(10, 2),
    space_type ENUM('conference_room', 'ballroom', 'meeting_room', 'outdoor', 'restaurant', 'other') NOT NULL,
    amenities TEXT COMMENT 'JSON: projector, wifi, catering, etc.',
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    image VARCHAR(255),
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (space_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event Bookings
CREATE TABLE IF NOT EXISTS event_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    space_id INT NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    client_email VARCHAR(100),
    client_phone VARCHAR(20),
    event_type ENUM('conference', 'wedding', 'meeting', 'seminar', 'party', 'exhibition', 'other') NOT NULL,
    event_name VARCHAR(200),
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    expected_guests INT,
    setup_type VARCHAR(100) COMMENT 'Theater, Classroom, Banquet, etc.',
    catering_required TINYINT(1) DEFAULT 0,
    av_equipment TEXT COMMENT 'JSON: equipment needed',
    special_requirements TEXT,
    total_cost DECIMAL(12, 2),
    deposit_paid DECIMAL(12, 2) DEFAULT 0,
    status ENUM('inquiry', 'tentative', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'inquiry',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES event_spaces(id) ON DELETE RESTRICT,
    INDEX idx_space_date (space_id, event_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. INTEGRATION WITH EXTERNAL SYSTEMS
-- ============================================================================

-- API Integrations
CREATE TABLE IF NOT EXISTS api_integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    integration_name VARCHAR(100) NOT NULL,
    integration_type ENUM('payment_gateway', 'ota', 'pms', 'accounting', 'crm', 'email', 'sms', 'analytics', 'other') NOT NULL,
    provider VARCHAR(100) COMMENT 'Stripe, PayPal, Booking.com, etc.',
    api_endpoint VARCHAR(500),
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    webhook_url VARCHAR(500),
    status ENUM('active', 'inactive', 'testing', 'error') DEFAULT 'active',
    last_sync TIMESTAMP NULL,
    sync_frequency INT COMMENT 'Minutes',
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (integration_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Transaction Logs
CREATE TABLE IF NOT EXISTS api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    integration_id INT NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    request_data TEXT,
    response_data TEXT,
    status_code INT,
    success TINYINT(1) NOT NULL,
    error_message TEXT,
    execution_time INT COMMENT 'Milliseconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (integration_id) REFERENCES api_integrations(id) ON DELETE CASCADE,
    INDEX idx_integration (integration_id),
    INDEX idx_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. SUSTAINABILITY MANAGEMENT
-- ============================================================================

-- Energy Consumption Tracking
CREATE TABLE IF NOT EXISTS energy_consumption (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reading_date DATE NOT NULL,
    meter_type ENUM('electricity', 'water', 'gas', 'heating', 'cooling') NOT NULL,
    meter_location VARCHAR(200),
    reading_value DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) COMMENT 'kWh, liters, cubic meters, etc.',
    cost DECIMAL(10, 2),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date_type (reading_date, meter_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Waste Management
CREATE TABLE IF NOT EXISTS waste_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_date DATE NOT NULL,
    waste_type ENUM('general', 'recyclable', 'organic', 'hazardous', 'electronic') NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    disposal_method VARCHAR(100),
    cost DECIMAL(10, 2),
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (tracking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sustainability Initiatives
CREATE TABLE IF NOT EXISTS sustainability_initiatives (
    id INT AUTO_INCREMENT PRIMARY KEY,
    initiative_name VARCHAR(200) NOT NULL,
    category ENUM('energy', 'water', 'waste', 'carbon', 'procurement', 'community', 'other') NOT NULL,
    description TEXT,
    start_date DATE,
    target_date DATE,
    status ENUM('planned', 'in_progress', 'completed', 'on_hold') DEFAULT 'planned',
    baseline_value DECIMAL(10, 2),
    target_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    unit VARCHAR(50),
    cost DECIMAL(12, 2),
    savings DECIMAL(12, 2),
    responsible_person INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (responsible_person) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carbon Footprint Tracking
CREATE TABLE IF NOT EXISTS carbon_footprint (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tracking_date DATE NOT NULL,
    source ENUM('electricity', 'heating', 'transportation', 'waste', 'water', 'food', 'other') NOT NULL,
    activity_data DECIMAL(10, 2) NOT NULL,
    activity_unit VARCHAR(50),
    emission_factor DECIMAL(10, 6),
    co2_equivalent DECIMAL(10, 2) COMMENT 'kg CO2e',
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (tracking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SYSTEM CONFIGURATION & SETTINGS
-- ============================================================================

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50),
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values TEXT COMMENT 'JSON',
    new_values TEXT COMMENT 'JSON',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_table (table_name),
    INDEX idx_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSERT SAMPLE/DEFAULT DATA
-- ============================================================================

-- Default Chart of Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description) VALUES
('1000', 'Cash', 'asset', 'Cash on hand and in bank'),
('1100', 'Accounts Receivable', 'asset', 'Money owed by guests'),
('1200', 'Inventory', 'asset', 'Food, beverage, and supplies inventory'),
('2000', 'Accounts Payable', 'liability', 'Money owed to suppliers'),
('2100', 'Salaries Payable', 'liability', 'Unpaid staff salaries'),
('3000', 'Owner Equity', 'equity', 'Owner investment'),
('4000', 'Room Revenue', 'revenue', 'Revenue from room bookings'),
('4100', 'Food & Beverage Revenue', 'revenue', 'F&B sales revenue'),
('4200', 'Other Revenue', 'revenue', 'Spa, events, and other services'),
('5000', 'Salaries Expense', 'expense', 'Staff salaries and wages'),
('5100', 'Utilities Expense', 'expense', 'Electricity, water, gas'),
('5200', 'Supplies Expense', 'expense', 'Cleaning and operational supplies'),
('5300', 'Marketing Expense', 'expense', 'Advertising and promotions'),
('5400', 'Maintenance Expense', 'expense', 'Repairs and maintenance');

-- Default Distribution Channels
INSERT INTO distribution_channels (name, channel_type, commission_percentage, status) VALUES
('Direct Website', 'direct', 0, 'active'),
('Booking.com', 'ota', 15.00, 'active'),
('Expedia', 'ota', 18.00, 'active'),
('Airbnb', 'ota', 12.00, 'active'),
('Agoda', 'ota', 15.00, 'active'),
('Corporate Accounts', 'corporate', 10.00, 'active'),
('Travel Agents', 'travel_agent', 10.00, 'active');

-- Default Rate Plans
INSERT INTO rate_plans (name, description, discount_percentage, min_nights, status, valid_from, valid_to) VALUES
('Standard Rate', 'Regular booking rate', 0, 1, 'active', '2024-01-01', '2026-12-31'),
('Early Bird', '15% off for bookings 30+ days in advance', 15.00, 2, 'active', '2024-01-01', '2026-12-31'),
('Weekend Special', '20% off for weekend stays', 20.00, 2, 'active', '2024-01-01', '2026-12-31'),
('Extended Stay', '25% off for stays 7+ nights', 25.00, 7, 'active', '2024-01-01', '2026-12-31');

-- Default POS Categories
INSERT INTO pos_categories (name, description, type, status) VALUES
('Restaurant - Breakfast', 'Breakfast menu items', 'food', 'active'),
('Restaurant - Lunch', 'Lunch menu items', 'food', 'active'),
('Restaurant - Dinner', 'Dinner menu items', 'food', 'active'),
('Bar - Alcoholic', 'Alcoholic beverages', 'beverage', 'active'),
('Bar - Non-Alcoholic', 'Soft drinks and juices', 'beverage', 'active'),
('Spa Services', 'Spa and wellness services', 'spa', 'active'),
('Gift Shop', 'Retail items and souvenirs', 'retail', 'active');

-- Default System Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
('hotel_name', 'SmileRental Hotel', 'string', 'general', 'Hotel name'),
('hotel_currency', 'USD', 'string', 'general', 'Currency code'),
('tax_rate', '10', 'number', 'financial', 'Tax percentage'),
('check_in_time', '14:00', 'string', 'operations', 'Standard check-in time'),
('check_out_time', '11:00', 'string', 'operations', 'Standard check-out time'),
('cancellation_hours', '24', 'number', 'policy', 'Free cancellation hours before check-in'),
('loyalty_points_per_dollar', '10', 'number', 'loyalty', 'Points earned per dollar spent'),
('min_booking_advance_hours', '2', 'number', 'booking', 'Minimum hours before check-in to book');

-- Default Review Templates
INSERT INTO review_templates (template_name, sentiment_type, template_text, status) VALUES
('Positive - Thank You', 'positive', 'Thank you so much for your wonderful review! We are thrilled to hear that you enjoyed your stay with us. We look forward to welcoming you back soon!', 'active'),
('Neutral - Acknowledgment', 'neutral', 'Thank you for taking the time to share your feedback. We appreciate your comments and are always working to improve our services.', 'active'),
('Negative - Apology', 'negative', 'We sincerely apologize for the issues you experienced during your stay. Your feedback is very important to us, and we are taking immediate steps to address these concerns. We would love the opportunity to make it right on your next visit.', 'active');

-- Default Event Spaces
INSERT INTO event_spaces (space_name, capacity, area_sqm, space_type, hourly_rate, daily_rate, status) VALUES
('Grand Ballroom', 500, 600.00, 'ballroom', 300.00, 2000.00, 'active'),
('Executive Meeting Room A', 20, 50.00, 'meeting_room', 50.00, 300.00, 'active'),
('Executive Meeting Room B', 15, 40.00, 'meeting_room', 40.00, 250.00, 'active'),
('Conference Hall', 100, 150.00, 'conference_room', 150.00, 1000.00, 'active'),
('Rooftop Terrace', 80, 200.00, 'outdoor', 200.00, 1200.00, 'active');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
