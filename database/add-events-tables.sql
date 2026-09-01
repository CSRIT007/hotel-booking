-- Event Spaces and Event Bookings tables for Events module
USE hotel_booking;

-- Event spaces (venues/facilities)
CREATE TABLE IF NOT EXISTS event_spaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) DEFAULT NULL,
    capacity INT NOT NULL DEFAULT 50,
    amenities TEXT DEFAULT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('available', 'unavailable', 'maintenance') DEFAULT 'available',
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event bookings (reservations for event spaces)
CREATE TABLE IF NOT EXISTS event_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    space_id INT NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(50) DEFAULT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    guests INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (space_id) REFERENCES event_spaces(id) ON DELETE CASCADE,
    INDEX idx_space (space_id),
    INDEX idx_date (event_date),
    INDEX idx_status (status),
    INDEX idx_event_date_status (event_date, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
