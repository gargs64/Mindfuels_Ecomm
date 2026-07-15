-- MySQL Database Schema for Mindfuels E-Commerce

-- 1. Users table (Stores customer profiles matched from Auth0)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `auth0_id` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_auth0` (`auth0_id`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Products table (Google Sheet is the source of truth, synced to MySQL)
CREATE TABLE IF NOT EXISTS `products` (
  `product_id` VARCHAR(100) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `tag1` VARCHAR(100) NULL,
  `tag2` VARCHAR(100) NULL,
  `tag3` VARCHAR(100) NULL,
  `mrp` DECIMAL(10, 2) NOT NULL,
  `sp` DECIMAL(10, 2) NOT NULL,
  `stock_qty` INT NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `image1` VARCHAR(1024) NULL,
  `image2` VARCHAR(1024) NULL,
  `image3` VARCHAR(1024) NULL,
  `image4` VARCHAR(1024) NULL,
  `image5` VARCHAR(1024) NULL,
  `image6` VARCHAR(1024) NULL,
  `image7` VARCHAR(1024) NULL,
  `weight` DECIMAL(8, 3) NOT NULL DEFAULT 0.000, -- weight in kg
  `length` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,  -- length in cm
  `width` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,   -- width in cm
  `height` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,  -- height in cm
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tags` (`tag1`, `tag2`, `tag3`),
  INDEX `idx_sp` (`sp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Shipping Address table (Multiple addresses per user, one default)
CREATE TABLE IF NOT EXISTS `shipping_address` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `pincode` VARCHAR(10) NOT NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_address_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_address` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Cart table (User database cart storage, synced upon login)
CREATE TABLE IF NOT EXISTS `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
  INDEX `idx_cart_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Wishlist table (Saves wishlisted products per user)
CREATE TABLE IF NOT EXISTS `wishlist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `product_id` VARCHAR(100) NOT NULL,
  `added_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_wishlist_user_product` (`user_id`, `product_id`),
  INDEX `idx_wishlist_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Orders table (Saves orders details, shipping rates)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `address_id` INT NOT NULL,
  `total_amount` DECIMAL(10, 2) NOT NULL, -- Total amount charged (sum of product sp * qty)
  `shipping_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- internal Fship cost bookkeeping, free to customer
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending, Processing, Shipped, Delivered, Cancelled
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'Unpaid', -- Unpaid, Paid, Failed, Refunded
  `payment_id` VARCHAR(255) NULL, -- Razorpay Payment ID or Transaction link
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_orders_address` FOREIGN KEY (`address_id`) REFERENCES `shipping_address` (`id`),
  INDEX `idx_order_user` (`user_id`),
  INDEX `idx_order_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Order Items table (Stores ordered line items snapshots at checkout)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) NOT NULL, -- unit sell price at purchase
  `weight` DECIMAL(8, 3) NOT NULL,  -- weight in kg
  `length` DECIMAL(8, 2) NOT NULL,  -- length in cm
  `width` DECIMAL(8, 2) NOT NULL,   -- width in cm
  `height` DECIMAL(8, 2) NOT NULL,  -- height in cm
  CONSTRAINT `fk_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  INDEX `idx_items_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Payments table (Stores transaction logs of Razorpay callbacks/webhooks)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `razorpay_order_id` VARCHAR(255) NOT NULL,
  `razorpay_payment_id` VARCHAR(255) NOT NULL,
  `razorpay_signature` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `status` VARCHAR(50) NOT NULL, -- captured, failed, etc.
  `paid_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_payment_order` (`order_id`),
  INDEX `idx_razorpay_pay_id` (`razorpay_payment_id`),
  INDEX `idx_razorpay_ord_id` (`razorpay_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Shipments table (Fship logistics status updates tracking)
CREATE TABLE IF NOT EXISTS `shipments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `fship_order_id` VARCHAR(255) NOT NULL, -- Fship unique order reference ID
  `fship_api_order_id` VARCHAR(255) NULL, -- Fship API response ID
  `awb_code` VARCHAR(100) NOT NULL,       -- Waybill Tracking code
  `courier_name` VARCHAR(255) NOT NULL,   -- Courier Partner name (e.g. Delhivery, Bluedart)
  `tracking_url` VARCHAR(1024) NULL,      -- Courier tracking URL
  `status` VARCHAR(50) NOT NULL DEFAULT 'Booked', -- Booked, In-Transit, Out-for-Delivery, Delivered, Returned
  `shipped_at` DATETIME NULL,
  `delivered_at` DATETIME NULL,
  CONSTRAINT `fk_shipments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  INDEX `idx_shipment_order` (`order_id`),
  INDEX `idx_awb` (`awb_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
