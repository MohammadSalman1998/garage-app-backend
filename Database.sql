-- Users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'garage_admin', 'employee', 'customer') NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    reset_password_token VARCHAR(255) UNIQUE,
    reset_password_expires TIMESTAMP,
    total_loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- notifications table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    related_entity_id INT NOT NULL,
    type ENUM('email', 'in_app') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sent', 'read') DEFAULT 'pending',
    related_entity ENUM('booking', 'transaction', 'register', 'rating'),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Garages table
CREATE TABLE garages (
    garage_id INT PRIMARY KEY AUTO_INCREMENT,
    manager_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    governorate VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_capacity INT NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    floors_number INT NOT NULL,
    working_hours JSON,
    available_spots INT DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    cancellation_policy TEXT,
    min_booking_hours DECIMAL(4,2) DEFAULT 1.00,
    cancellation_fee DECIMAL(10,2) DEFAULT 0,
    overstay_rate_per_minute DECIMAL(10,2) DEFAULT 0.00,
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(user_id)
);



-- garage_images table
CREATE TABLE garage_images (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    garage_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE
);

-- parking_spots table
CREATE TABLE parking_spots (
    parking_spot_id INT AUTO_INCREMENT PRIMARY KEY,
    garage_id INT NOT NULL,
    floor_number INT NOT NULL,
    spot_number VARCHAR(50) NOT NULL,
    spot_type ENUM('normal', 'electric', 'vip') DEFAULT 'normal',
    status ENUM('available', 'occupied', 'under_maintenance') DEFAULT 'available',
    price_modifier DECIMAL(5,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    last_booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE,
    UNIQUE (garage_id, floor_number, spot_number)
);

-- Garage Employees table
CREATE TABLE garage_employees (
    garage_employee_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    garage_id INT NOT NULL,
    role ENUM('supervisor', 'scanner'),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id),
    UNIQUE (user_id, garage_id)
);

-- Wallets table
CREATE TABLE wallets (
    wallet_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    garage_id INT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'SYR',
    isActive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_garage_wallet (user_id, garage_id)
);

-- Bookings table
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    garage_id INT NOT NULL,
    spot_id INT NOT NULL,
    subscription_id INT NULL,
    payment_status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
    qr_code_identifier VARCHAR(255) UNIQUE NOT NULL,
    qr_code_expiry TIMESTAMP NULL DEFAULT NULL,
    entry_time_actual TIMESTAMP NULL DEFAULT NULL,
    exit_time_actual TIMESTAMP NULL DEFAULT NULL,
    booked_entry_time DATETIME NOT NULL,
    booked_exit_time DATETIME NOT NULL,
    booked_duration_hours DECIMAL(10, 2) NOT NULL,
    booking_fee DECIMAL(10, 2) NOT NULL,
    additional_charges DECIMAL(10, 2) DEFAULT 0.00,
    cancellation_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_charges DECIMAL(10, 2) DEFAULT 0.00,
    overstay_duration_minutes INT DEFAULT 0,
    overstay_fee DECIMAL(10, 2) DEFAULT 0.00,
    loyalty_discount_applied DECIMAL(10, 2) DEFAULT 0.00,
    cancellation_time TIMESTAMP NULL DEFAULT NULL,
    is_cancelled_within_grace_period BOOLEAN DEFAULT NULL,
    status ENUM('pending_payment', 'confirmed', 'active', 'completed', 'cancelled', 'overstayed') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id),
    FOREIGN KEY (spot_id) REFERENCES parking_spots(parking_spot_id),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id)
);

-- Transactions table
CREATE TABLE transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    wallet_id INT NOT NULL,
    booking_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('booking_fee', 'top_up', 'refund', 'overstay_charge', 'cancellation_fee', 'system_adjustment') NOT NULL,
    payment_method ENUM('e_wallet', 'cash') NOT NULL,
    status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- Ratings table
CREATE TABLE ratings (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    garage_id INT NOT NULL,
    booking_id INT,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- audit_logs table
CREATE TABLE audit_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- subscriptions table
CREATE TABLE subscriptions (
    subscription_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    garage_id INT NOT NULL,
    subscription_type ENUM('monthly', 'yearly') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id)
);

-- loyalty_points table
CREATE TABLE loyalty_points (
    loyalty_point_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    points_earned INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    booking_id INT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);



CREATE INDEX idx_user_id ON users (user_id);
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_location ON garages(latitude, longitude);
CREATE INDEX idx_garage_status ON parking_spots(garage_id, status);
CREATE INDEX idx_user_garage ON wallets(user_id, garage_id);
CREATE INDEX idx_qr_code ON bookings(qr_code_identifier);
CREATE INDEX idx_bookings_spots ON bookings(customer_id, garage_id, status);
CREATE INDEX idx_wallet_booking ON transactions(wallet_id, booking_id);
CREATE INDEX idx_garage_id ON ratings(garage_id);