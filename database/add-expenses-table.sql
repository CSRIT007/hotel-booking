-- Expenses table for staff Finance > Expense
USE hotel_booking;

CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash' COMMENT 'Accounting: cash or cash_in_bank',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (expense_date),
    INDEX idx_category (category),
    INDEX idx_payment_method (payment_method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- For existing installs: add payment_method column
-- ALTER TABLE expenses ADD COLUMN payment_method VARCHAR(50) DEFAULT 'cash' AFTER expense_date;
-- ALTER TABLE expenses ADD INDEX idx_payment_method (payment_method);
