-- Hotel Booking Database Schema
-- Run this SQL file in phpMyAdmin or MySQL command line to create the database

CREATE DATABASE IF NOT EXISTS hotel_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_booking;

-- Users table (guests and staff: role = 'guest' or 'staff')
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('guest', 'staff') DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(100) NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hotel_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    max_persons INT NOT NULL DEFAULT 2,
    size VARCHAR(20),
    view_type VARCHAR(50),
    beds INT NOT NULL DEFAULT 1,
    image VARCHAR(255),
    status ENUM('available', 'booked', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_room (room_id),
    INDEX idx_dates (check_in, check_out)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table (for guests when staff confirms/cancels booking)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_id INT NOT NULL,
    type ENUM('confirmed', 'cancelled') NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100),
    message TEXT NOT NULL,
    image VARCHAR(255),
    rating INT DEFAULT 5,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact messages table
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    image VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data
INSERT INTO hotels (name, description, location, image) VALUES
('Sheraton', 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.', 'Cairo', 'images/services-1.jpg'),
('The Plaza Hotel', 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.', 'New York', 'images/image_4.jpg'),
('The Ritz', 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.', 'Paris', 'images/image_4.jpg');

INSERT INTO rooms (hotel_id, name, description, price, max_persons, size, view_type, beds, image) VALUES
(1, 'Suite Room', 'Luxurious suite with modern amenities', 120.00, 3, '45 m2', 'Sea View', 1, 'images/room-1.jpg'),
(1, 'Standard Room', 'Comfortable standard room', 80.00, 2, '30 m2', 'City View', 1, 'images/room-2.jpg'),
(1, 'Family Room', 'Spacious room perfect for families', 150.00, 4, '60 m2', 'Sea View', 2, 'images/room-3.jpg'),
(1, 'Deluxe Room', 'Premium deluxe accommodation', 200.00, 3, '50 m2', 'Sea View', 1, 'images/room-4.jpg'),
(2, 'Luxury Room', 'Ultra-luxury room with premium features', 300.00, 3, '55 m2', 'Sea View', 1, 'images/room-5.jpg'),
(2, 'Superior Room', 'Superior room with excellent amenities', 180.00, 2, '40 m2', 'Garden View', 1, 'images/room-6.jpg');

INSERT INTO testimonials (name, position, message, image, rating) VALUES
('Racky Henderson', 'Father', 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', 'images/person_1.jpg', 5),
('Henry Dee', 'Businesswoman', 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', 'images/person_2.jpg', 5),
('Mark Huff', 'Businesswoman', 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', 'images/person_3.jpg', 5),
('Rodel Golez', 'Businesswoman', 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', 'images/person_4.jpg', 5),
('Ken Bosh', 'Businesswoman', 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts.', 'images/person_1.jpg', 5);

INSERT INTO services (name, description, icon, image, status) VALUES
('Map Direction', 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.', 'flaticon-map', 'images/services-1.jpg', 'active'),
('Accomodation Services', 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.', 'flaticon-hotel', 'images/services-2.jpg', 'active'),
('Great Experience', 'Even the all-powerful Pointing has no control about the blind texts it is an almost unorthographic.', 'flaticon-star', 'images/image_2.jpg', 'active');
