# QuickAnnonces — HTML, JavaScript et PHP API

QuickAnnonces utilise une interface HTML/JavaScript statique. JavaScript appelle les endpoints PHP avec `fetch()`, et PHP communique avec MySQL sur Aiven.

## Démarrer en local

Ouvrez un terminal PowerShell dans le dossier du projet et configurez le mot de passe Aiven pour la session :

```powershell
$secureDbPassword = Read-Host "Aiven database password" -AsSecureString
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new("", $secureDbPassword).Password
$env:AUTH_SECRET = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
php -S localhost:8000
```

Ouvrez ensuite `http://localhost:8000/index.html`. Ouvrir le fichier en `file://` ou utiliser Live Server seul ne démarre pas PHP.

Les valeurs par défaut de `config/db.php` utilisent l'hôte Aiven principal, le port `19206`, l'utilisateur `avnadmin`, la base `gestionproduit_v2` et le certificat `certs/ca.pem`. Le mot de passe reste uniquement dans une variable d'environnement. Configurez aussi `AUTH_SECRET` avec une valeur aléatoire privée d'au moins 32 caractères pour signer les cookies de connexion.

Pour créer l'administrateur, suivez les étapes de [BACKEND_SETUP.md](BACKEND_SETUP.md). Pour Vercel, définissez `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` et `AUTH_SECRET` dans les paramètres d'environnement du projet. `vercel.json` configure le runtime PHP des fichiers `api/*.php`.

## Structure

- `index.html`, `styles.css` et `app.js` : interface statique et appels `fetch()`.
- `api/` : endpoints PHP pour annonces, catégories, comptes, favoris, annonces personnelles et modération.
- `database/schema.sql` : tables MySQL et catégories de départ nécessaires à l'API.
- `config/db.php` : connexion PDO à Aiven avec TLS.
- `certs/ca.pem` : certificat public de l'autorité Aiven.
- `scripts/create-admin.php` : création sécurisée du compte administrateur depuis la ligne de commande.
- `BACKEND_SETUP.md` : configuration locale, création des tables et déploiement.

Les annonces, catégories, comptes, favoris, conversations, messages, alertes et actions de modération sont reliés à la base. Les téléversements de photos nécessitent encore un service d'hébergement d'images. Les commentaires et la réinitialisation par e-mail restent à connecter.
