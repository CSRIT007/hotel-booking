-- Taxation: records for taxes payable to government agencies
-- Run this once or use accounting-taxation.php which creates the table if missing

CREATE TABLE IF NOT EXISTS tax_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tax_type VARCHAR(100) NOT NULL COMMENT 'VAT, Income Tax, Property Tax, Withholding, etc.',
    tax_period VARCHAR(50) NOT NULL COMMENT 'e.g. Q1 2026, January 2026, FY2026',
    amount DECIMAL(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    agency VARCHAR(200) NOT NULL COMMENT 'Government agency or tax authority',
    reference_number VARCHAR(100) COMMENT 'Tax filing reference or invoice number',
    status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
    paid_date DATE NULL,
    paid_amount DECIMAL(12, 2) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_due_date (due_date),
    INDEX idx_tax_type (tax_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
