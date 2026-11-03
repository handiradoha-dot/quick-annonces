CREATE TABLE IF NOT EXISTS qa_users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qa_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qa_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_listings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  seller_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  city VARCHAR(120) NOT NULL,
  listing_type ENUM('sell', 'wanted') NOT NULL DEFAULT 'sell',
  item_condition VARCHAR(80) NULL,
  image_url VARCHAR(2048) NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_qa_listings_status_created (status, created_at),
  KEY ix_qa_listings_seller_created (seller_id, created_at),
  CONSTRAINT fk_qa_listings_seller FOREIGN KEY (seller_id) REFERENCES qa_users (id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_listings_category FOREIGN KEY (category_id) REFERENCES qa_categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_favorites (
  user_id BIGINT UNSIGNED NOT NULL,
  listing_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, listing_id),
  CONSTRAINT fk_qa_favorites_user FOREIGN KEY (user_id) REFERENCES qa_users (id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_favorites_listing FOREIGN KEY (listing_id) REFERENCES qa_listings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_alerts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NULL,
  search_text VARCHAR(150) NOT NULL,
  city VARCHAR(120) NULL,
  max_price DECIMAL(12,2) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_qa_alerts_user_created (user_id, created_at),
  CONSTRAINT fk_qa_alerts_user FOREIGN KEY (user_id) REFERENCES qa_users (id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_alerts_category FOREIGN KEY (category_id) REFERENCES qa_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_conversations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id BIGINT UNSIGNED NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qa_conversation_listing_buyer_seller (listing_id, buyer_id, seller_id),
  KEY ix_qa_conversations_buyer (buyer_id, created_at),
  KEY ix_qa_conversations_seller (seller_id, created_at),
  CONSTRAINT fk_qa_conversations_listing FOREIGN KEY (listing_id) REFERENCES qa_listings (id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_conversations_buyer FOREIGN KEY (buyer_id) REFERENCES qa_users (id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_conversations_seller FOREIGN KEY (seller_id) REFERENCES qa_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversation_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_qa_messages_conversation_created (conversation_id, created_at, id),
  CONSTRAINT fk_qa_messages_conversation FOREIGN KEY (conversation_id) REFERENCES qa_conversations (id) ON DELETE CASCADE,
  CONSTRAINT fk_qa_messages_sender FOREIGN KEY (sender_id) REFERENCES qa_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO qa_categories (name) VALUES
  ('Informatique'), ('Téléphones'), ('Maison'), ('Véhicules'), ('Mode'), ('Loisirs'), ('Immobilier'), ('Autres');
