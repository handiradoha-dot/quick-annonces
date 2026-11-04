# QuickAnnonces

Application statique sur Vercel avec API PHP, MySQL Aiven et Cloudinary.

## Variables Vercel

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- `DB_NAME` si différent de `gestionproduit_v2`
- `CLOUDINARY_URL`

Le certificat Aiven public est versionné dans `api/ca.pem`. `api/config.php.example` lit les variables d'environnement; le fichier local `api/config.php` est ignoré par Git.

## Données et migrations

- Les comptes utilisent `qa_users`; les sessions sans JWT utilisent `qa_sessions`.
- Les catégories viennent de `qa_categories`.
- L'accueil lit directement les annonces de `produit`. Les anciens produits restent visibles même si les tables applicatives sont absentes.
- `qa_listing_meta` relie les annonces à leur vendeur et stocke ville, description et état de modération.
- Favoris, alertes, conversations et messages utilisent `qa_favorites`, `qa_alerts`, `qa_conversations` et `qa_messages`.
- Les commentaires utilisent `qa_comments`.

L'API ne crée plus de tables à l'exécution et n'a donc pas besoin du droit `CREATE`. Exécuter une fois dans Aiven, avec un utilisateur autorisé, les scripts `api/migrations/001_qa_sessions.sql` et `api/migrations/002_app_tables.sql`. Le `DB_USER` de Vercel a ensuite seulement besoin des droits de lecture/écriture sur les tables utilisées.

Les images sont envoyées à Cloudinary par l'API; leur URL est stockée dans `produit.photoProduit`.

## Déploiement

Après un push vers la branche connectée à Vercel, vérifier `/api/health.php` et `/api/categories.php`.
