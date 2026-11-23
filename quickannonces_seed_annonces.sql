-- Idempotent sample announcements for the existing Aiven defaultdb.
-- Requires the Gmail sample accounts and categories created by the user's SQL.
-- Inserts naturally fire trg_annonce_set_pub_date and trg_after_insert_annonce_copie.
USE defaultdb;

INSERT INTO annonce (
    user_id, category_id, annonce_type, title, description,
    price, currency, city, item_condition, status, date_publication, date_expiration
)
SELECT u.id, c.id, 'sale',
       'Audi A4 Diesel 2019 très propre',
       'Audi A4 Diesel année 2019, faible kilométrage, entretien à jour.',
       215000.00, 'MAD', 'Rabat', 'Très bon état', 'approved',
       CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
FROM users u
JOIN categories c ON c.slug = 'vehicules'
WHERE u.email = 'youssef.benali@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM annonce a
      WHERE a.user_id = u.id AND a.title = 'Audi A4 Diesel 2019 très propre'
  )
LIMIT 1;

INSERT INTO annonce (
    user_id, category_id, annonce_type, title, description,
    price, currency, city, item_condition, status, date_publication, date_expiration
)
SELECT u.id, c.id, 'sale',
       'VTT Rockrider 27.5 pouces',
       'Vélo VTT tout terrain idéal montagne et balade.',
       2400.00, 'MAD', 'Tanger', 'Bon état', 'approved',
       CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
FROM users u
JOIN categories c ON c.slug = 'velo'
WHERE u.email = 'salma.elidrissi@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM annonce a
      WHERE a.user_id = u.id AND a.title = 'VTT Rockrider 27.5 pouces'
  )
LIMIT 1;

INSERT INTO annonce (
    user_id, category_id, annonce_type, title, description,
    price, currency, city, item_condition, status, date_publication, date_expiration
)
SELECT u.id, c.id, 'sale',
       'PC Portable HP ProBook i5',
       'PC portable bureau et études, SSD 512Go, 16Go RAM.',
       3200.00, 'MAD', 'Rabat', 'Bon état', 'approved',
       DATE_SUB(CURDATE(), INTERVAL 1 DAY),
       DATE_ADD(DATE_SUB(CURDATE(), INTERVAL 1 DAY), INTERVAL 30 DAY)
FROM users u
JOIN categories c ON c.slug = 'informatique-pc'
WHERE u.email = 'youssef.benali@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM annonce a
      WHERE a.user_id = u.id AND a.title = 'PC Portable HP ProBook i5'
  )
LIMIT 1;

INSERT INTO annonce (
    user_id, category_id, annonce_type, title, description,
    price, currency, city, item_condition, status, date_publication, date_expiration
)
SELECT u.id, c.id, 'sale',
       'PC Gamer RTX 3060',
       'PC fixe gaming complet.',
       7800.00, 'MAD', 'Tanger', 'Comme neuf', 'approved',
       CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)
FROM users u
JOIN categories c ON c.slug = 'informatique-pc'
WHERE u.email = 'salma.elidrissi@gmail.com'
  AND NOT EXISTS (
      SELECT 1 FROM annonce a
      WHERE a.user_id = u.id AND a.title = 'PC Gamer RTX 3060'
  )
LIMIT 1;

-- Confirm the seeded rows. Re-running this script will not duplicate them.
SELECT id, title, city, status
FROM annonce
WHERE title IN (
    'Audi A4 Diesel 2019 très propre',
    'VTT Rockrider 27.5 pouces',
    'PC Portable HP ProBook i5',
    'PC Gamer RTX 3060'
)
ORDER BY id;
