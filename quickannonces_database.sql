-- QuickAnnonces database schema
-- MySQL 8.0+ / Aiven for MySQL
-- This script is intended for a NEW, EMPTY database.

CREATE DATABASE IF NOT EXISTS quickannonces
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quickannonces;

-- 1. Users
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NULL,
    city VARCHAR(100) NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_verified TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Categories
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. Advertisements (annonces)
CREATE TABLE annonce (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    annonce_type ENUM('sale', 'wanted') NOT NULL DEFAULT 'sale',
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency CHAR(3) NOT NULL DEFAULT 'MAD',
    city VARCHAR(100) NOT NULL,
    item_condition VARCHAR(50) NULL,
    status ENUM('pending', 'approved', 'rejected', 'sold', 'archived') NOT NULL DEFAULT 'pending',
    moderation_note TEXT NULL,
    moderated_by BIGINT UNSIGNED NULL,
    moderated_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_annonce_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_annonce_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_annonce_moderator FOREIGN KEY (moderated_by)
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_annonce_status (status),
    INDEX idx_annonce_category (category_id),
    INDEX idx_annonce_user (user_id),
    INDEX idx_annonce_city (city),
    INDEX idx_annonce_date (created_at),
    FULLTEXT INDEX ft_annonce_search (title, description)
) ENGINE=InnoDB;

-- 4. Advertisement images
-- Store Cloudinary URLs and public IDs here, not the image files themselves.
CREATE TABLE annonce_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    annonce_id BIGINT UNSIGNED NOT NULL,
    cloudinary_public_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(2048) NOT NULL,
    position INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_annonce_images_annonce FOREIGN KEY (annonce_id)
        REFERENCES annonce(id) ON DELETE CASCADE,
    UNIQUE KEY uq_cloudinary_public_id (cloudinary_public_id),
    INDEX idx_annonce_images_order (annonce_id, position)
) ENGINE=InnoDB;

-- 5. Favorites
CREATE TABLE favorites (
    user_id BIGINT UNSIGNED NOT NULL,
    annonce_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, annonce_id),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_favorites_annonce FOREIGN KEY (annonce_id)
        REFERENCES annonce(id) ON DELETE CASCADE,
    INDEX idx_favorites_annonce (annonce_id)
) ENGINE=InnoDB;

-- 6. Comments and replies on advertisements
CREATE TABLE annonce_comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    annonce_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    parent_comment_id BIGINT UNSIGNED NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_annonce_comments_annonce FOREIGN KEY (annonce_id)
        REFERENCES annonce(id) ON DELETE CASCADE,
    CONSTRAINT fk_annonce_comments_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_annonce_comments_parent FOREIGN KEY (parent_comment_id)
        REFERENCES annonce_comments(id) ON DELETE SET NULL,
    INDEX idx_annonce_comments_thread (annonce_id, parent_comment_id, created_at)
) ENGINE=InnoDB;

-- 7. Conversations between a buyer and a seller about an advertisement
CREATE TABLE conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    annonce_id BIGINT UNSIGNED NOT NULL,
    buyer_id BIGINT UNSIGNED NOT NULL,
    seller_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversations_annonce FOREIGN KEY (annonce_id)
        REFERENCES annonce(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_buyer FOREIGN KEY (buyer_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversations_seller FOREIGN KEY (seller_id)
        REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_conversation_annonce_buyer_seller (annonce_id, buyer_id, seller_id),
    INDEX idx_conversations_buyer (buyer_id),
    INDEX idx_conversations_seller (seller_id)
) ENGINE=InnoDB;

-- 8. Messages inside conversations
CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL,
    message_text TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id)
        REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id)
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation_date (conversation_id, created_at),
    INDEX idx_messages_sender (sender_id)
) ENGINE=InnoDB;

-- 9. Seller reviews / ratings (for the seller profile rating shown in the UI)
CREATE TABLE seller_reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reviewer_id BIGINT UNSIGNED NOT NULL,
    seller_id BIGINT UNSIGNED NOT NULL,
    annonce_id BIGINT UNSIGNED NULL,
    rating TINYINT UNSIGNED NOT NULL,
    review_text TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seller_reviews_reviewer FOREIGN KEY (reviewer_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_seller_reviews_seller FOREIGN KEY (seller_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_seller_reviews_annonce FOREIGN KEY (annonce_id)
        REFERENCES annonce(id) ON DELETE SET NULL,
    CONSTRAINT chk_seller_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    UNIQUE KEY uq_review_per_annonce (reviewer_id, seller_id, annonce_id),
    INDEX idx_seller_reviews_seller (seller_id, created_at)
) ENGINE=InnoDB;

-- 10. Saved search alerts
CREATE TABLE search_alerts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    search_query VARCHAR(255) NOT NULL,
    city VARCHAR(100) NULL,
    max_price DECIMAL(12,2) NULL,
    category_id INT UNSIGNED NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_search_alerts_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_search_alerts_category FOREIGN KEY (category_id)
        REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_search_alerts_user_active (user_id, is_active)
) ENGINE=InnoDB;

-- 11. Password reset tokens
CREATE TABLE password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_password_reset_user_expiry (user_id, expires_at)
) ENGINE=InnoDB;

-- Initial categories. INSERT IGNORE prevents duplicate-key errors if rerun.
INSERT IGNORE INTO categories (name, slug) VALUES
    ('Immobilier', 'immobilier'),
    ('Véhicules', 'vehicules'),
    ('Électronique', 'electronique'),
    ('Mode', 'mode'),
    ('Maison & Jardin', 'maison-jardin'),
    ('Sports', 'sports'),
    ('Services', 'services');

-- Verify that all tables were created:
SHOW TABLES;
