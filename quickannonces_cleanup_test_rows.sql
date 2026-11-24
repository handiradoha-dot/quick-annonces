-- One-time cleanup recorded from the existing Aiven defaultdb maintenance.
-- These exact IDs were already deleted; rerunning this script is safe.
USE defaultdb;

START TRANSACTION;

DELETE FROM seller_reviews
WHERE annonce_id IN (34, 35, 36);

DELETE FROM annonce
WHERE id IN (34, 35, 36);

DELETE FROM categories
WHERE id IN (8, 9, 10);

-- Expected: both ID checks return zero and total_users returns 7.
SELECT id FROM annonce WHERE id IN (34, 35, 36);
SELECT id FROM categories WHERE id IN (8, 9, 10);
SELECT COUNT(*) AS total_users FROM users;

COMMIT;
