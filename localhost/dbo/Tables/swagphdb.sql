-- 1. Create the database first
CREATE DATABASE swagphdb;
GO

-- 2. Switch context to your new database
USE swagphdb;
GO

-- 3. Create the parent 'users' table
CREATE TABLE users (
    user_id CHAR(6) PRIMARY KEY,
    full_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(15) DEFAULT 'CLIENT',
    status VARCHAR(10) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT GETDATE()
);

-- 4. Create the 'orders' table (depends on users)
CREATE TABLE orders (
    order_id CHAR(6) PRIMARY KEY,
    user_id CHAR(6),
    o_details NVARCHAR(MAX),
    o_amount DECIMAL(10, 2) DEFAULT 0.00,
    o_status VARCHAR(20) DEFAULT 'PENDING',
    o_date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 5. Create the 'products' table
CREATE TABLE products (
    product_id CHAR(6) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL,
    description NVARCHAR(MAX)
);

-- 6. Create the 'payments' table (depends on orders)
CREATE TABLE payments (
    payment_id CHAR(6) PRIMARY KEY,
    order_id CHAR(6),
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATETIME DEFAULT GETDATE(),
    payment_method VARCHAR(20), 
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
);
GO

-- 7. Insert the admin user safely using the correct table schema columns
INSERT INTO users (user_id, full_name, email, password_hash, role) 
VALUES ('ADM001', 'System Admin', 'admin@swagph.com', 'Admin123', 'ADMIN');
GO

-- 8. Verify the insert worked
SELECT * FROM users;