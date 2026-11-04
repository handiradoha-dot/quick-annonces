# QuickAnnonces

Application statique servie par Vercel avec fonctions PHP et MySQL Aiven. Les comptes et les annonces passent par l'API PHP.

## Certificat CA Aiven

Le certificat public Aiven est versionné dans `api/ca.pem`. L'API charge ce fichier directement avec PDO, en local comme sur Vercel. Il n'est pas nécessaire de créer une variable Vercel pour le certificat.

## Variables d'environnement Vercel

Définir dans Production (et Preview/Development si nécessaire) :

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` : valeurs fournies par Aiven.
- `DB_NAME` : nom de la base; facultatif si la base s'appelle `gestionproduit_v2`.
- `CLOUDINARY_URL` : URL de connexion du produit Cloudinary. Cette variable est lue uniquement par l'API PHP et ne doit jamais être envoyée au navigateur.

L'API accepte aussi `QA_DB_DSN`, `QA_DB_USER` et `QA_DB_PASSWORD` si tu préfères le format DSN.

`api/config.php` local est ignoré par Git. `api/config.php.example` est le modèle. `vercel.json` configure `vercel-php@0.9.0`, qui nécessite Node.js 22; `package.json` fixe cette version pour le build Vercel.

## Sessions sans JWT

L'authentification utilise un jeton aléatoire opaque dans un cookie `HttpOnly`, `SameSite=Lax` et `Secure` en HTTPS. Seul son hash SHA-256 est enregistré dans `qa_sessions`; l'expiration est de 14 jours. Avant le premier déploiement, exécutez une fois [`api/migrations/001_qa_sessions.sql`](api/migrations/001_qa_sessions.sql) dans Aiven.

## Schéma annonces

Les captures ne montrent pas les colonnes de `qa_listings`. L'API reconnaît des variantes courantes, mais a besoin de `id`, titre, prix, propriétaire et statut pour publier et modérer. Les colonnes reconnues sont documentées dans `api/listings.php`.

Les photos sont envoyées par le serveur à Cloudinary, puis leur URL est enregistrée dans l'annonce. Favoris, alertes, conversations et messages restent à synchroniser avec leurs tables.

## Développement

Servir le projet via un serveur web avec PHP et les variables d'environnement. `file://` ne permet pas d'appeler l'API.
