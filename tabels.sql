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
    total_loyalty_points INT DEFAULT 0
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
    garage_employe_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    garage_id INT NOT NULL,
    role ENUM('supervisor', 'worker', 'other'),
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
    FOREIGN KEY (spot_id) REFERENCES parking_spots(parking_spot_id)
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
    subscription_type ENUM('monthly', 'annual') NOT NULL,
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













---------------------------------------------------------------------------------------

-- إنشاء جدول subscriptions لتخزين معلومات الاشتراكات
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

-- إضافة حقل subscription_id إلى جدول bookings
ALTER TABLE bookings ADD COLUMN subscription_id INT NULL,
ADD FOREIGN KEY (subscription_id) REFERENCES subscriptions(subscription_id);

-- إضافة حقول للرسوم الإضافية إلى جدول bookings
ALTER TABLE bookings ADD COLUMN overstay_duration_minutes INT DEFAULT 0,
ADD COLUMN overstay_fee DECIMAL(10, 2) DEFAULT 0.00;

-- إضافة حقل overstay_rate_per_minute إلى جدول garages
ALTER TABLE garages ADD COLUMN overstay_rate_per_minute DECIMAL(10, 2) DEFAULT 0.00;

-- إنشاء جدول loyalty_points لتخزين نقاط الولاء
CREATE TABLE loyalty_points (
    loyalty_point_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    points_earned INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    booking_id INT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- إضافة حقل total_loyalty_points إلى جدول users
ALTER TABLE users ADD COLUMN total_loyalty_points INT DEFAULT 0;

-- إضافة حقل loyalty_discount_applied إلى جدول bookings
ALTER TABLE bookings ADD COLUMN loyalty_discount_applied DECIMAL(10, 2) DEFAULT 0.00;














---------------------------------------------------------------------------------------

-- إضافة جدول أنواع الاشتراكات
CREATE TABLE subscription_plans (
    plan_id INT PRIMARY KEY AUTO_INCREMENT,
    garage_id INT NOT NULL,
    plan_name VARCHAR(255) NOT NULL, -- مثل "اشتراك شهري VIP", "اشتراك سنوي عادي"
    plan_type ENUM('monthly', 'yearly') NOT NULL,
    duration_months INT NOT NULL, -- 1 للشهري، 12 للسنوي
    price DECIMAL(10, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00, -- خصم على الحجوزات العادية
    max_bookings_per_month INT DEFAULT NULL, -- عدد الحجوزات المسموحة شهرياً (NULL = غير محدود)
    max_hours_per_booking DECIMAL(4, 2) DEFAULT NULL, -- أقصى ساعات للحجز الواحد
    priority_booking BOOLEAN DEFAULT FALSE, -- أولوية في الحجز
    free_cancellations INT DEFAULT 0, -- عدد الإلغاءات المجانية شهرياً
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE
);

-- جدول اشتراكات العملاء
CREATE TABLE user_subscriptions (
    subscription_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    garage_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'expired', 'cancelled', 'suspended') DEFAULT 'active',
    payment_status ENUM('paid', 'pending', 'failed') DEFAULT 'pending',
    auto_renewal BOOLEAN DEFAULT FALSE,
    bookings_used_this_month INT DEFAULT 0,
    cancellations_used_this_month INT DEFAULT 0,
    last_monthly_reset DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(plan_id),
    UNIQUE KEY unique_active_subscription (user_id, garage_id, status)
);

-- جدول نقاط الولاء
CREATE TABLE loyalty_programs (
    program_id INT PRIMARY KEY AUTO_INCREMENT,
    garage_id INT NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    points_per_booking INT DEFAULT 1, -- نقاط لكل حجز
    points_per_sar_spent DECIMAL(5, 2) DEFAULT 0.10, -- نقاط لكل ريال منفق
    reward_threshold INT NOT NULL, -- عدد النقاط المطلوبة للمكافأة
    reward_type ENUM('discount_percentage', 'fixed_amount', 'free_hours') NOT NULL,
    reward_value DECIMAL(10, 2) NOT NULL, -- قيمة المكافأة
    max_rewards_per_month INT DEFAULT 1, -- أقصى مكافآت شهرياً
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE
);

-- جدول نقاط العملاء
CREATE TABLE user_loyalty_points (
    user_loyalty_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    garage_id INT NOT NULL,
    program_id INT NOT NULL,
    total_points INT DEFAULT 0,
    used_points INT DEFAULT 0,
    available_points INT GENERATED ALWAYS AS (total_points - used_points) STORED,
    rewards_claimed_this_month INT DEFAULT 0,
    last_monthly_reset DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES loyalty_programs(program_id),
    UNIQUE KEY unique_user_garage_loyalty (user_id, garage_id)
);

-- جدول معاملات النقاط
CREATE TABLE loyalty_transactions (
    loyalty_transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    user_loyalty_id INT NOT NULL,
    booking_id INT NULL,
    transaction_type ENUM('earned', 'redeemed', 'expired', 'adjusted') NOT NULL,
    points INT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_loyalty_id) REFERENCES user_loyalty_points(user_loyalty_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

-- جدول سياسات الرسوم الإضافية (التأخير)
CREATE TABLE overstay_policies (
    policy_id INT PRIMARY KEY AUTO_INCREMENT,
    garage_id INT NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    grace_period_minutes INT DEFAULT 15, -- فترة سماح بالدقائق
    billing_increment_minutes INT DEFAULT 15, -- كل كم دقيقة يتم الحساب
    rate_per_increment DECIMAL(10, 2) NOT NULL, -- رسوم لكل فترة
    max_daily_overstay_charge DECIMAL(10, 2) DEFAULT NULL, -- أقصى رسوم يومية
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (garage_id) REFERENCES garages(garage_id) ON DELETE CASCADE
);

-- ============================================
-- التعديلات المطلوبة على الجداول الموجودة
-- ============================================

-- 1. تعديل جدول الكراجات (garages)
ALTER TABLE garages 
ADD COLUMN overstay_policy_id INT DEFAULT NULL,
ADD COLUMN loyalty_program_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN subscription_enabled BOOLEAN DEFAULT TRUE;

-- إضافة المفتاح الخارجي بعد إنشاء جدول overstay_policies
-- ALTER TABLE garages ADD FOREIGN KEY (overstay_policy_id) REFERENCES overstay_policies(policy_id);

-- 2. تعديل جدول الحجوزات (bookings)
ALTER TABLE bookings 
ADD COLUMN subscription_id INT DEFAULT NULL,
ADD COLUMN loyalty_points_earned INT DEFAULT 0,
ADD COLUMN loyalty_discount_applied DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN subscription_discount_applied DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN overstay_minutes INT DEFAULT 0,
ADD COLUMN overstay_charges DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN original_total_before_discounts DECIMAL(10, 2) DEFAULT 0.00;

-- إضافة المفتاح الخارجي بعد إنشاء جدول user_subscriptions
-- ADD FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(subscription_id);

-- 3. تعديل جدول المعاملات (transactions)
ALTER TABLE transactions 
MODIFY COLUMN transaction_type ENUM(
    'booking_fee', 
    'top_up', 
    'refund', 
    'overstay_charge', 
    'cancellation_fee', 
    'system_adjustment', 
    'subscription_payment', 
    'loyalty_discount',
    'subscription_renewal',
    'loyalty_reward_redemption'
) NOT NULL;

-- 4. تعديل جدول المحافظ (wallets) - إضافة حقول اختيارية
ALTER TABLE wallets 
ADD COLUMN loyalty_points_balance INT DEFAULT 0,
ADD COLUMN last_loyalty_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 5. تعديل جدول الإشعارات (notifications) - إضافة أنواع جديدة
ALTER TABLE notifications 
MODIFY COLUMN related_entity ENUM(
    'booking', 
    'transaction', 
    'register', 
    'rating',
    'subscription',
    'loyalty',
    'overstay'
) DEFAULT NULL;

-- 6. تعديل جدول المستخدمين (users) - إضافة حقول اختيارية
ALTER TABLE users 
ADD COLUMN subscription_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN loyalty_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN overstay_notifications BOOLEAN DEFAULT TRUE;

-- ============================================
-- إضافة المفاتيح الخارجية بعد إنشاء الجداول الجديدة
-- ============================================

-- إضافة المفاتيح الخارجية للجداول المعدلة
ALTER TABLE garages ADD CONSTRAINT fk_garage_overstay_policy 
FOREIGN KEY (overstay_policy_id) REFERENCES overstay_policies(policy_id);

ALTER TABLE bookings ADD CONSTRAINT fk_booking_subscription 
FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(subscription_id);

-- ============================================
-- إضافة فهارس محسنة للأداء
-- ============================================

-- فهارس للجداول الجديدة
CREATE INDEX idx_subscription_user_garage ON user_subscriptions(user_id, garage_id, status);
CREATE INDEX idx_subscription_dates ON user_subscriptions(start_date, end_date);
CREATE INDEX idx_subscription_status_end_date ON user_subscriptions(status, end_date);
CREATE INDEX idx_loyalty_user_garage ON user_loyalty_points(user_id, garage_id);
CREATE INDEX idx_loyalty_available_points ON user_loyalty_points(user_id, available_points);
CREATE INDEX idx_loyalty_transactions ON loyalty_transactions(user_loyalty_id, transaction_type);
CREATE INDEX idx_loyalty_transactions_date ON loyalty_transactions(user_loyalty_id, created_at);

-- فهارس للجداول المحدثة
CREATE INDEX idx_overstay_policy ON garages(overstay_policy_id);
CREATE INDEX idx_booking_subscription ON bookings(subscription_id);
CREATE INDEX idx_booking_overstay ON bookings(garage_id, status, overstay_minutes);
CREATE INDEX idx_booking_loyalty_points ON bookings(customer_id, loyalty_points_earned);

-- فهارس مركبة مفيدة
CREATE INDEX idx_bookings_customer_status_date ON bookings(customer_id, status, created_at);
CREATE INDEX idx_transactions_wallet_type_date ON transactions(wallet_id, transaction_type, created_at);





















-- //////////////////////////////////////////////////////////////////////

-- CREATE TABLE IF NOT EXISTS vehicles (
--     vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     make VARCHAR(50) NOT NULL,
--     model VARCHAR(50) NOT NULL,
--     license_plate VARCHAR(20) UNIQUE NOT NULL,
--     color VARCHAR(30),
--     year INT,
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
-- );







-- -- Recurring Bookings table
-- -- CREATE TABLE recurring_bookings (
-- --     id INT PRIMARY KEY AUTO_INCREMENT,
-- --     customer_id INT NOT NULL,
-- --     garage_id INT NOT NULL,
-- --     spot_id INT NOT NULL,
-- --     start_time TIME NOT NULL,
-- --     end_time TIME NOT NULL,
-- --     days_of_week VARCHAR(20) NOT NULL,
-- --     recurrence_pattern ENUM('daily', 'weekly', 'monthly') NOT NULL,
-- --     end_date DATE NOT NULL,
-- --     status ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
-- --     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
-- --     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
-- --     FOREIGN KEY (customer_id) REFERENCES users(user_id),
-- --     FOREIGN KEY (garage_id) REFERENCES garages(id),
-- --     FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
-- -- );

-- CREATE TABLE recurring_bookings (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     customer_id INT NOT NULL,
--     garage_id INT NOT NULL,
--     spot_id INT NOT NULL,
--     frequency ENUM('daily', 'weekly') NOT NULL,
--     start_date DATE NOT NULL,
--     end_date DATE NOT NULL,
--     is_cancelled BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (customer_id) REFERENCES users(user_id),
--     FOREIGN KEY (garage_id) REFERENCES garages(id),
--     FOREIGN KEY (spot_id) REFERENCES parking_spots(id)
-- );





-- -- Loyalty Points table
-- CREATE TABLE loyalty_points (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     customer_id INT NOT NULL,
--     points_balance INT DEFAULT 0,
--     points_value DECIMAL(10, 2) DEFAULT 0.00,
--     tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
--     points_expiry_date DATE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (customer_id) REFERENCES users(user_id)
-- );

-- -- Points Transactions table
-- CREATE TABLE points_transactions (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     loyalty_points_id INT NOT NULL,
--     points_amount INT NOT NULL,
--     transaction_type ENUM('earned', 'redeemed', 'adjusted') NOT NULL,
--     description VARCHAR(255),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (loyalty_points_id) REFERENCES loyalty_points(id)
-- );

-- -- Peak Hours Predictions table
-- CREATE TABLE peak_hours_predictions (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     garage_id INT NOT NULL,
--     day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
--     hour_of_day INT NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day < 24),
--     predicted_occupancy DECIMAL(5,2) NOT NULL,
--     confidence_score DECIMAL(5,2) NOT NULL,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (garage_id) REFERENCES garages(id)
-- );

-- -- Maintenance Schedules table
-- CREATE TABLE maintenance_schedules (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     garage_id INT NOT NULL,
--     maintenance_type VARCHAR(100) NOT NULL,
--     description TEXT,
--     scheduled_date DATETIME NOT NULL,
--     completed_date DATETIME,
--     status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
--     assigned_to INT,
--     priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (garage_id) REFERENCES garages(id),
--     FOREIGN KEY (assigned_to) REFERENCES users(user_id)
-- );

-- -- Incidents table
-- CREATE TABLE incidents (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     reported_by_employee_id INT NOT NULL,
--     booking_id INT,
--     incident_type VARCHAR(100) NOT NULL,
--     description TEXT NOT NULL,
--     resolution TEXT,
--     priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
--     assigned_to INT,
--     status ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (reported_by_employee_id) REFERENCES users(user_id),
--     FOREIGN KEY (booking_id) REFERENCES bookings(id),
--     FOREIGN KEY (assigned_to) REFERENCES users(user_id)
-- );

-- -- Emergency Incidents table
-- CREATE TABLE emergency_incidents (
--     id INT PRIMARY KEY AUTO_INCREMENT,
--     garage_id INT NOT NULL,
--     reported_by INT NOT NULL,
--     incident_type VARCHAR(100) NOT NULL,
--     description TEXT NOT NULL,
--     severity_level ENUM('low', 'medium', 'high', 'critical') NOT NULL,
--     status ENUM('reported', 'in_progress', 'resolved', 'closed') DEFAULT 'reported',
--     resolution_notes TEXT,
--     reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     resolved_at TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (garage_id) REFERENCES garages(id),
--     FOREIGN KEY (reported_by) REFERENCES users(user_id)
-- );





-- -- Services table
-- CREATE TABLE services (
--     service_id INT PRIMARY KEY AUTO_INCREMENT,
--     garage_id INT NOT NULL,
--     name VARCHAR(255) NOT NULL,
--     description TEXT,
--     price DECIMAL(10, 2) NOT NULL,
--     duration_minutes INT NOT NULL,
--     category VARCHAR(100) NOT NULL,
--     is_active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     FOREIGN KEY (garage_id) REFERENCES garages(id) ON DELETE CASCADE
-- );