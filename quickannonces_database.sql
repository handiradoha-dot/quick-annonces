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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_phone_format
        CHECK (phone IS NULL OR phone REGEXP '^(05|06)[0-9]{8}$')
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
    status ENUM('pending', 'approved', 'rejected', 'sold', 'archived', 'expired') NOT NULL DEFAULT 'pending',
    moderation_note TEXT NULL,
    moderated_by BIGINT UNSIGNED NULL,
    moderated_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_publication DATE NULL,
    date_expiration DATE NULL,
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
    INDEX idx_annonce_city_perf (city),
    INDEX idx_annonce_date (created_at),
    FULLTEXT INDEX ft_annonce_search (title, description)
) ENGINE=InnoDB;

-- Snapshot of announcement fields at creation time, as configured in Aiven.
CREATE TABLE CopieAnnonce (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    original_annonce_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    annonce_type ENUM('sale', 'wanted') NOT NULL DEFAULT 'sale',
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency CHAR(3) NOT NULL DEFAULT 'MAD',
    city VARCHAR(100) NOT NULL,
    item_condition VARCHAR(50) NULL,
    status VARCHAR(30) NOT NULL,
    copied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    CONSTRAINT chk_annonce_images_format
        CHECK (image_url REGEXP '\\.(jpg|jpeg)(\\?.*)?$'),
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
    ('Services', 'services'),
    ('Véhicules', 'vehicules'),
    ('Vélo', 'velo'),
    ('Informatique / PC', 'informatique-pc');

-- Rename legacy sample accounts in place when this file is applied to a
-- database that already contains them. Their IDs, credentials, roles, and
-- linked announcements stay attached to the same accounts. If a target Gmail
-- address is already in use, leave the legacy row untouched for manual review.
UPDATE users AS legacy_user
LEFT JOIN users AS gmail_user
    ON gmail_user.email = CASE legacy_user.email
        WHEN 'youssef@example.com' THEN 'youssef.benali@gmail.com'
        WHEN 'salma@example.com' THEN 'salma.elidrissi@gmail.com'
        WHEN 'admin@quickannonces.ma' THEN 'admin.quickannonces@gmail.com'
    END
SET legacy_user.email = CASE legacy_user.email
    WHEN 'youssef@example.com' THEN 'youssef.benali@gmail.com'
    WHEN 'salma@example.com' THEN 'salma.elidrissi@gmail.com'
    WHEN 'admin@quickannonces.ma' THEN 'admin.quickannonces@gmail.com'
END
WHERE legacy_user.email IN (
    'youssef@example.com',
    'salma@example.com',
    'admin@quickannonces.ma'
)
AND gmail_user.id IS NULL;

-- 12. Announcement expiration routines
-- New listings are assigned these dates by the API. The procedure is called
-- by the protected daily maintenance endpoint to mark past listings expired.
DELIMITER $$

CREATE FUNCTION calculer_date_expiration(p_date_publication DATE)
RETURNS DATE
DETERMINISTIC
NO SQL
BEGIN
    RETURN DATE_ADD(p_date_publication, INTERVAL 30 DAY);
END$$

CREATE PROCEDURE desactiver_annonces_expirees(OUT p_nb INT)
BEGIN
    UPDATE annonce
    SET status = 'expired'
    WHERE date_expiration < CURDATE()
      AND status <> 'expired';

    SET p_nb = ROW_COUNT();
END$$

CREATE TRIGGER trg_annonce_set_pub_date
BEFORE INSERT ON annonce
FOR EACH ROW
BEGIN
    SET NEW.date_publication = CURDATE();
    IF NEW.date_expiration IS NULL THEN
        SET NEW.date_expiration = calculer_date_expiration(CURDATE());
    END IF;
END$$

CREATE TRIGGER trg_after_insert_annonce_copie
AFTER INSERT ON annonce
FOR EACH ROW
BEGIN
    INSERT INTO CopieAnnonce (
        original_annonce_id, user_id, category_id, annonce_type,
        title, description, price, currency, city, item_condition, status
    )
    VALUES (
        NEW.id, NEW.user_id, NEW.category_id, NEW.annonce_type,
        NEW.title, NEW.description, NEW.price, NEW.currency, NEW.city,
        NEW.item_condition, NEW.status
    );
END$$

-- 13. Reusable listing reports from the supplied SQL additions.
CREATE PROCEDURE sp_annonces_vtt_velo()
BEGIN
    SELECT a.*
    FROM annonce a
    JOIN categories c ON c.id = a.category_id
    WHERE LOWER(c.name) = 'vélo'
      AND (LOWER(a.title) LIKE '%vtt%' OR LOWER(a.description) LIKE '%vtt%');
END$$

CREATE PROCEDURE sp_pc_moins_cher()
BEGIN
    SELECT *
    FROM annonce
    WHERE LOWER(title) LIKE '%pc%'
       OR LOWER(description) LIKE '%pc%'
    ORDER BY price ASC
    LIMIT 1;
END$$

CREATE FUNCTION fn_nb_annonces_date(p_date DATE)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_total INT;
    SELECT COUNT(*) INTO v_total
    FROM annonce
    WHERE COALESCE(date_publication, DATE(created_at)) = p_date;
    RETURN v_total;
END$$

CREATE PROCEDURE sp_total_annonces_par_ville()
BEGIN
    SELECT city, COUNT(*) AS total_annonces
    FROM annonce
    GROUP BY city
    ORDER BY total_annonces DESC, city ASC;
END$$

DELIMITER ;

CREATE OR REPLACE VIEW VueAnnoncesTanger AS
SELECT *
FROM annonce
WHERE LOWER(city) = 'tanger';

-- Verify that all tables were created:
SHOW TABLES;

-- The one-time Aiven cleanup of test announcement/category IDs 34-36 and 8-10
-- is documented separately in quickannonces_cleanup_test_rows.sql.
