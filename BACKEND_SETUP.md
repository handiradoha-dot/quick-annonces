# Backend setup

## 1. Create the database tables

The PHP API expects the tables and category rows in [`database/schema.sql`](database/schema.sql). Run that file once against the MySQL database configured for the app. The script is safe to rerun: it creates missing tables and inserts categories without duplicating them.

## 2. Configure PHP

Use PHP 8.1 or newer with the PDO MySQL extension enabled. Set these environment variables in the terminal or hosting platform:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, and `DB_USER` (optional when using the defaults in `config/db.php`)
- `DB_PASSWORD` (required)
- `AUTH_SECRET` (required; a private random value of at least 32 characters)

For local PowerShell, set secrets only in the current session:

```powershell
$secureDbPassword = Read-Host "Database password" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $secureDbPassword).Password
$env:AUTH_SECRET = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

The default database connection uses the included public Aiven CA certificate at `certs/ca.pem` and verifies the TLS server certificate. Keep database credentials and `AUTH_SECRET` out of source control.

## 3. Run locally

From the project directory, start PHP's built-in server:

```powershell
php -S localhost:8000
```

Open `http://localhost:8000/index.html`. The built-in PHP server serves both the interface and the `api/` endpoints; opening the HTML file directly or using a static-only server will not run the API.

## 4. Create an administrator

Choose an administrator email and password, set them as environment variables, then run the CLI-only script:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$secureAdminPassword = Read-Host "New admin password" -AsSecureString
$env:ADMIN_PASSWORD = [System.Net.NetworkCredential]::new("", $secureAdminPassword).Password
php scripts/create-admin.php
Remove-Item Env:ADMIN_PASSWORD
```

The script creates or promotes that email to the admin role. Run it only after the database tables exist and the database environment variables are configured.

## 5. Deploy to Vercel

Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `AUTH_SECRET` in the Vercel project's environment settings. Deploy the project with `vercel.json`; it configures the PHP runtime for `api/*.php`. Provision the schema separately in the MySQL database before using the deployed app.
