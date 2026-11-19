# QuickAnnonces

QuickAnnonces serves one home page at `public/index.html`, with dedicated login, registration, account, and admin pages in `public/`. The PHP endpoints are organized under `api/`, configuration under `config/`, and shared helpers under `includes/`. Form requests go to PHP, which stores records in Aiven MySQL and uploads photos to Cloudinary. The root `Dockerfile.vercel` runs the app with FrankenPHP on Vercel.

## Before deploying

1. Load `quickannonces_database.sql` into the Aiven database named `quickannonces`. The SQL creates the database and tables; it is written for a new, empty database. If you already imported it into Aiven's `defaultdb`, set `DB_NAME=defaultdb` instead.
2. Set the environment variables listed below in Vercel for Preview and Production, then redeploy.
3. The app expects users to register; there is no seeded administrator. Promote the intended admin account directly in MySQL by setting its `users.role` to `admin` after registration.

For the existing Aiven setup, run `quickannonces_expiration_functions.sql` once against `defaultdb` to add announcement publication/expiration dates and the expiration function/procedure. Back up the database before applying schema changes.

## Vercel environment variables

| Name | Value |
| --- | --- |
| `DB_HOST` | Aiven host: `mysql-34da4a91-quick-announce-2.c.aivencloud.com` |
| `DB_PORT` | `20440` |
| `DB_NAME` | `defaultdb` for the current Aiven setup, where the tables were created |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | The Aiven password from the service console; do not paste it into chat or source files |
| `CLOUDINARY_CLOUD_NAME` | `xth8g9ff` |
| `CLOUDINARY_API_KEY` | The API key shown in Cloudinary |
| `CLOUDINARY_API_SECRET` | Your current Cloudinary API secret; keep it private |
| `AUTH_SECRET` | A random secret with at least 32 characters |
| `APP_URL` | The public site address used in reset emails, e.g. `https://your-app.vercel.app` (optional on Vercel: `VERCEL_PROJECT_PRODUCTION_URL` is used when it is unset) |
| `RESEND_API_KEY` | API key from [Resend](https://resend.com), used to send password reset emails |
| `MAIL_FROM` | Sender, e.g. `QuickAnnonces <no-reply@your-domain.com>`; the domain must be verified in Resend |

Keep `DB_PASSWORD`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, and `AUTH_SECRET` in Vercel environment variables. Never commit their values to the repository or share them in chat.

The public Aiven CA certificate `ca.pem` is included at the project root and used directly for the database TLS connection. TLS verification stays enabled.

For local development, fill in the ignored root `.env` file (or copy `.env.example` first) with your credentials and a random `AUTH_SECRET` of at least 32 characters. `config/env.php` loads `.env` locally; environment variables already set by the process take precedence. `.env` is ignored by Git and excluded from the Docker build. In Vercel, set the same variable names in Project Settings → Environment Variables, then redeploy.

## Local setup

Use PHP 8.4, Composer 2, Docker, and the Vercel CLI. Install the Cloudinary SDK with Composer and commit both `composer.json` and `composer.lock`. Then build the `Dockerfile.vercel` image and exercise `/api/health` and the application with configured environment variables.

There is no `composer.lock` yet because Composer is not installed in this workspace. The current container build resolves the SDK during image build; generate and commit the lockfile with Composer before treating the build as reproducible.

## Backend layout

- `config/db.php` and `config/env.php` provide database, Cloudinary, and environment setup.
- `api/auth/`, `api/users/`, `api/annonces/`, and `api/admin/` contain the PHP endpoints.
- `includes/` contains authentication, shared functions, and security helpers.
- `public/` contains the single home page, login, registration, account, and admin HTML pages plus the shared frontend assets.

## Current feature coverage

- Accounts: registration, login, logout, password hashing, signed one-week HttpOnly cookies and CSRF tokens.
- Password reset: `POST /api/auth/forgot` emails a one-hour, single-use link (`login.html#/reset/<token>`) through Resend; `POST /api/auth/reset` sets the new password. Tokens are stored hashed in `password_reset_tokens`.
- Listings: approved listing search/detail, create (pending moderation), owner's listings, edit and delete API operations.
- Photos: JPG, PNG and WebP uploads up to 8 MB each (maximum five per listing) go from PHP to Cloudinary; URLs and public IDs are stored in MySQL.
- Favorites, comments, buyer/seller conversations and messages, saved search alerts, and administrator moderation API.
- The active frontend and its CSS/JavaScript live in `public/`; the JSON API has separate endpoint files under `api/`.

## Known setup gaps

- Password reset answers 503 until `RESEND_API_KEY`, `MAIL_FROM` and an app URL are configured.
- A user promoted to admin in MySQL must log out and log in again; the role is read from the session cookie.
- Registration does not verify email or phone; the original design's verification badges are not implemented as real verification.
- Dashboard analytics, QuickMatch recommendations, comparison, and seller profile screens are still design demonstrations; their backend workflows are not connected yet.
- The uploaded SQL must be applied to Aiven before the app can use its API. No Aiven password was supplied, so the live connection could not be checked here.
- The API and pages were tested end to end against a local SQLite copy of the schema; the Aiven MySQL connection, Cloudinary uploads, Resend delivery and the Docker/Vercel build have not been run against the real services.
- Use Vercel's Container preset if the project is detected as a different framework. `Dockerfile.vercel` is intentionally named to take precedence when another framework is detected.
