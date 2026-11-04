# QuickAnnonces

Application statique servie par Vercel avec fonctions PHP, MySQL Aiven et Cloudinary.

## Variables Vercel

Dans les environnements utilisés par le projet, configurer :

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` (Aiven)
- `DB_NAME` si le nom de base n'est pas `gestionproduit_v2`
- `CLOUDINARY_URL` (Cloudinary)

Le certificat public Aiven est versionné dans `api/ca.pem`; aucune variable Vercel n'est nécessaire pour le certificat. `api/config.php` local est ignoré par Git. `api/config.php.example` lit les variables ci-dessus.

## Stockage des données

- Les comptes sont dans `qa_users`; l'authentification sans JWT utilise un cookie opaque HttpOnly et la table `qa_sessions`.
- Les catégories viennent de `qa_categories`.
- Les annonces sont dans `produit` (`reference`, `libelle`, `prixUnitaire`, `dateAchat`, `photoProduit`, `idCategorie`).
- `produit` ne contient pas le vendeur, la ville, la description ou le statut de modération. L'API crée `qa_listing_meta` pour conserver ces informations et relier chaque annonce à `produit.reference`. Les produits existants sont ajoutés comme annonces approuvées.
- Les favoris, alertes, conversations et messages utilisent respectivement `qa_favorites`, `qa_alerts`, `qa_conversations` et `qa_messages`.
- Les commentaires utilisent `qa_comments`, car cette table ne figure pas dans le schéma fourni.

L'API crée `qa_sessions`, `qa_listing_meta` et `qa_comments` si nécessaire. L'utilisateur MySQL configuré dans Vercel doit avoir les droits `CREATE`, `SELECT`, `INSERT`, `UPDATE` et `DELETE`.

Les images sont envoyées à Cloudinary par l'API PHP; seule leur URL est sauvegardée dans `produit.photoProduit`.

## Déploiement

`vercel.json` configure le runtime PHP des routes `api/*.php`. Après un changement de code, pousser la branche reliée à Vercel puis vérifier `/api/health.php` et `/api/categories.php`.
