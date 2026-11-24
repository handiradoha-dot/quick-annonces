# QuickAnnonces

QuickAnnonces serves one home page at `public/index.html`, with dedicated login, registration, account, and admin pages in `public/`. The PHP endpoints are organized under `api/`, configuration under `config/`, and shared helpers under `includes/`. Form requests go to PHP, which stores records in Aiven MySQL and uploads photos to Cloudinary. The root `Dockerfile.vercel` runs the app with FrankenPHP on Vercel.

## Before deploying

1. Load `quickannonces_database.sql` into the Aiven database named `quickannonces`. The SQL creates the tables, phone and image format checks, expiration and reporting routines, announcement triggers, copy table, and Tanger view; it is written for a new, empty database. If you already imported it into Aiven's `defaultdb`, set `DB_NAME=defaultdb` instead.
2. Set the environment variables listed below in Vercel for Preview and Production, then redeploy.
3. Register the intended administrator, then promote that account directly in MySQL. Replace the example address below with the registered administrator's email:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

For an existing Aiven installation, `quickannonces_expiration_functions.sql` remains the migration path and targets `defaultdb`. The main schema now includes the expiration columns, status, and routines for new installations. Back up an existing database and verify what is already installed before applying any migration; do not run the new-install schema against an existing database.

The sample announcement data is in `quickannonces_seed_annonces.sql`. It targets the existing `defaultdb`, uses the updated `youssef.benali@gmail.com` and `salma.elidrissi@gmail.com` accounts, and safely skips rows already present. Run this file only after those accounts and the `vehicules`, `velo`, and `informatique-pc` categories exist. Its inserts use the database triggers for publication dates and archiving.

The previously completed cleanup of sample rows `annonce.id` 34–36 and `categories.id` 8–10 is recorded in `quickannonces_cleanup_test_rows.sql`. It deletes reviews first, verifies the IDs are absent and reports the user count, then commits. This is a one-time maintenance script for the existing `defaultdb`, not part of new database setup.

The expiration feature requires `date_publication` and `date_expiration` columns, an `expired` value in the `annonce.status` enum, and the `calculer_date_expiration` function and `desactiver_annonces_expirees` procedure. Do not rerun the migration blindly: it adds columns and drops/recreates routines. Check the target database first:

```sql
USE defaultdb;
SHOW COLUMNS FROM annonce LIKE 'date_publication';
SHOW COLUMNS FROM annonce LIKE 'date_expiration';
SHOW COLUMNS FROM annonce LIKE 'status';
SELECT ROUTINE_NAME, ROUTINE_TYPE
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_NAME IN ('calculer_date_expiration', 'desactiver_annonces_expirees');
```

If anything is missing, take a backup and apply only the missing schema/routine changes from `quickannonces_expiration_functions.sql`; do not rerun its `ALTER TABLE` or `DROP ...` statements without confirming they are safe for the current database.

Vercel runs the expiration procedure daily at 02:00 UTC through `/api/maintenance/expiration`. Set a long random `CRON_SECRET` in Vercel's Production environment (and Preview if scheduled previews are enabled), then redeploy. The endpoint requires `Authorization: Bearer <CRON_SECRET>` and reports the number of rows changed. Local setup uses the same variable in `.env`; invoke the endpoint manually with that bearer token to test it. If deploying outside Vercel, configure an equivalent daily scheduler to call the protected endpoint.

An announcement is created as `pending` with its publication date set to `CURDATE()` and its expiration date calculated by the MySQL function. It remains hidden until moderation. Approval does not reset those dates. The public listing API also excludes dates already past in MySQL, so an announcement does not remain publicly active while waiting for the scheduled procedure.

## Vercel environment variables

| Name | Value |
| --- | --- |
| `DB_HOST` | Aiven host: `mysql-34da4a91-quick-announce-2.c.aivencloud.com` |
| `DB_PORT` | `20440` |
| `DB_NAME` | `defaultdb` for the current Aiven setup, where the tables were created |
| `DB_USER` | The configured application writer account (for example `annonce_user`); do not use `readonly_user` for the API |
| `DB_PASSWORD` | The password for that Aiven account; do not paste it into chat or source files |
| `CLOUDINARY_CLOUD_NAME` | `xth8g9ff` |
| `CLOUDINARY_API_KEY` | The API key shown in Cloudinary |
| `CLOUDINARY_API_SECRET` | Your current Cloudinary API secret; keep it private |
| `AUTH_SECRET` | A random secret with at least 32 characters |
| `CRON_SECRET` | A long random secret used to authorize the scheduled expiration endpoint |
| `APP_URL` | The public site address used in reset emails, e.g. `https://your-app.vercel.app` (optional on Vercel: `VERCEL_PROJECT_PRODUCTION_URL` is used when it is unset) |
| `RESEND_API_KEY` | API key from [Resend](https://resend.com), used to send password reset emails |
| `MAIL_FROM` | Sender, e.g. `QuickAnnonces <no-reply@your-domain.com>`; the domain must be verified in Resend |

Keep `DB_PASSWORD`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, and `AUTH_SECRET` in Vercel environment variables. Never commit their values to the repository or share them in chat.

The public Aiven CA certificate `ca.pem` is included at the project root and used directly for the database TLS connection. TLS verification stays enabled.

For local development, fill in the ignored root `.env` file (or copy `.env.example` first) with your credentials and a random `AUTH_SECRET` of at least 32 characters. `config/env.php` loads `.env` locally; environment variables already set by the process take precedence. `.env` is ignored by Git and excluded from the Docker build. In Vercel, set the same variable names in Project Settings → Environment Variables, then redeploy.

## Local setup with WAMP

1. Select or install PHP 8.2 or newer in WAMP (`composer.json` requires PHP `^8.2`) and confirm `php -v` reports that version. Enable `pdo_mysql`, `fileinfo`, and `mbstring` in the PHP configuration used by the command line.
2. From PowerShell, run:

```powershell
cd C:\Users\MSI\Desktop\quick-annonces
composer install
php -S 127.0.0.1:8000 dev-router.php
```

3. Open `http://127.0.0.1:8000/`. `dev-router.php` serves files from `public/` and forwards `/api/*` requests into the existing API router. Fill the ignored root `.env` with the Aiven TLS settings, writer account, Cloudinary keys, and a random `AUTH_SECRET` before testing account or upload workflows. Keep `readonly_user` out of `DB_USER`, because the API creates and updates records.

The root `ca.pem` is used for verified MySQL TLS. `composer install` creates `vendor/` and a lockfile; neither was present in this workspace when checked. The production Docker image currently resolves the Cloudinary dependency during its image build.

## Backend layout

- `config/db.php` and `config/env.php` provide database, Cloudinary, and environment setup.
- `dev-router.php` supports local WAMP PHP development; production requests use `Caddyfile` or Vercel rewrites.
- `api/auth/`, `api/users/`, `api/annonces/`, and `api/admin/` contain the PHP endpoints.
- `includes/` contains authentication, shared functions, and security helpers.
- `public/` contains the single home page, login, registration, account, and admin HTML pages plus the shared frontend assets.

## Current feature coverage

- Accounts: new registrations require a 10-digit Moroccan phone number beginning with `05` or `06`; existing accounts may keep a null phone. Login and administrator access are unchanged. Registration, password hashing, signed one-week HttpOnly cookies and CSRF tokens remain in place.
- Password reset: `POST /api/auth/forgot` emails a one-hour, single-use link (`login.html#/reset/<token>`) through Resend; `POST /api/auth/reset` sets the new password. Tokens are stored hashed in `password_reset_tokens`.
- Listings: approved listing search/detail, create (pending moderation), owner's listings, edit and delete API operations.
- Photos: JPG and JPEG uploads up to 8 MB each (maximum five per listing) are MIME-checked by PHP and sent to Cloudinary; URLs and public IDs are stored in MySQL. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Vercel or the local `.env`.
- Admin reports: VTT/Vélo, cheapest PC, announcement count by publication date, totals by city, the Tanger SQL view, recent Rabat announcements and Audi A4 Diesel listings after 2016.
- Favorites, comments, buyer/seller conversations and messages, saved search alerts, and administrator moderation API.
- The active frontend and its CSS/JavaScript live in `public/`; the JSON API has separate endpoint files under `api/`.

## Known setup gaps

- Password reset answers 503 until `RESEND_API_KEY`, `MAIL_FROM` and an app URL are configured.
- A user promoted to admin in MySQL must log out and log in again; the role is read from the session cookie.
- Registration does not verify email or phone; the original design's verification badges are not implemented as real verification.
- Dashboard analytics, QuickMatch recommendations, comparison, and seller profile screens are still design demonstrations; their backend workflows are not connected yet.
- Aiven TLS connectivity, announcement CRUD in a rolled-back transaction, stored procedures, the date function, Tanger view and both special filters were checked against the configured database. Cloudinary uploads, Resend delivery and the Docker/Vercel build still need a real deployment check.
- Use Vercel's Container preset if the project is detected as a different framework. `Dockerfile.vercel` is intentionally named to take precedence when another framework is detected.
