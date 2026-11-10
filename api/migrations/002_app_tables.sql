CREATE TABLE IF NOT EXISTS qa_listing_meta (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_reference VARCHAR(50) NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Approuvee',
    listing_type VARCHAR(50) NULL,
    condition_label VARCHAR(100) NULL,
    description TEXT NULL,
    city VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_qa_listing_meta_reference (product_reference),
    KEY idx_qa_listing_meta_user (user_id),
    KEY idx_qa_listing_meta_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qa_comments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    listing_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_qa_comments_listing (listing_id),
    KEY idx_qa_comments_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO qa_listing_meta (product_reference, status)
SELECT reference, 'Approuvee' FROM produit;
