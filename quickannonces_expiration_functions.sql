-- QuickAnnonces: add 30-day expiration function and expired-announcement procedure
-- For the existing QuickAnnonces Aiven database configured for this project.
-- Run this script once after backing up the database.

USE defaultdb;

-- 1) Add publication and expiration dates to the existing annonce table.
ALTER TABLE annonce
    ADD COLUMN date_publication DATE NULL AFTER created_at,
    ADD COLUMN date_expiration DATE NULL AFTER date_publication;

-- Preserve existing announcements: use their created_at date as publication date,
-- then calculate their expiration date as 30 days later.
UPDATE annonce
SET date_publication = DATE(created_at),
    date_expiration = DATE_ADD(DATE(created_at), INTERVAL 30 DAY)
WHERE date_publication IS NULL
   OR date_expiration IS NULL;

-- The project schema uses English ENUM statuses. "expired" represents "Expirée".
ALTER TABLE annonce
    MODIFY COLUMN status
    ENUM('pending', 'approved', 'rejected', 'sold', 'archived', 'expired')
    NOT NULL DEFAULT 'pending';

-- 2) Function: return the expiration date (publication date + 30 days).
DROP FUNCTION IF EXISTS calculer_date_expiration;

DELIMITER $$

CREATE FUNCTION calculer_date_expiration(p_date_publication DATE)
RETURNS DATE
DETERMINISTIC
NO SQL
BEGIN
    RETURN DATE_ADD(p_date_publication, INTERVAL 30 DAY);
END$$

DELIMITER ;

-- 3) Procedure: mark expired announcements and return the number changed.
DROP PROCEDURE IF EXISTS desactiver_annonces_expirees;

DELIMITER $$

CREATE PROCEDURE desactiver_annonces_expirees(OUT p_nb INT)
BEGIN
    UPDATE annonce
    SET status = 'expired'
    WHERE date_expiration < CURDATE()
      AND status <> 'expired';

    SET p_nb = ROW_COUNT();
END$$

DELIMITER ;

-- 4) Test the function.
SELECT calculer_date_expiration('2026-11-12') AS date_expiration_attendue;

-- 5) Test the procedure and show how many announcements were updated.
CALL desactiver_annonces_expirees(@nb_annonces_desactivees);
SELECT @nb_annonces_desactivees AS nombre_annonces_desactivees;

-- 6) Check the current announcement dates and statuses.
SELECT id, title, date_publication, date_expiration, status
FROM annonce
ORDER BY id;
