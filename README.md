# QuickAnnonces — Front-end

Projet de démonstration front-end inspiré de la maquette PDF QuickAnnonces.

## Démarrer
1. Décompressez le dossier.
2. Ouvrez `index.html` dans votre navigateur. Chaque section est accessible depuis Accueil avec une page HTML dédiée.
3. Pour une meilleure expérience de développement, ouvrez le dossier dans VS Code et utilisez l'extension **Live Server**.

## Organisation
- `index.html` : page d'accueil et point d'entrée.
- Les autres fichiers `.html` : recherche, détail, publication, favoris, messages, connexion, QuickMatch et les autres écrans.
- `admin-login.html` : connexion de démonstration pour ouvrir l’espace de modération.
- `demo.html` : parcours guidé pour essayer les principaux écrans côté client et côté admin.
- `styles.css` : styles, grille, composants et responsive.
- `app.js` : données, stockage local, navigation et interactions communes aux pages.
- `index.html` et `index.js` : la page d'accueil et son rendu.
- Chaque autre page HTML est rangée à côté de son fichier JavaScript correspondant, par exemple `reset.html` et `reset.js`. Toutes les pages chargent aussi `app.js` pour leurs fonctions communes.

## Pages incluses
Accueil, recherche et filtres, détail d'annonce, publication, mes annonces, favoris, messages, connexion, inscription, mot de passe oublié, réinitialisation, QuickMatch, recherche personnalisée, alertes, comparaison, sécurité/confiance, tableaux de bord et modération admin.

## Limites
- Front-end uniquement : aucune API, authentification réelle, base de données, envoi d'e-mail ou chat temps réel. Les photos et données restent dans le navigateur, sans téléversement serveur.
- Les données de démonstration sont conservées dans le stockage local du navigateur : annonces, favoris, filtres et messages.
- Les actions de connexion, d'alerte et de modération sont des démonstrations.
- Les nouvelles annonces restent en attente jusqu’à leur approbation dans l’espace admin. L’admin peut les rechercher, prévisualiser, approuver, refuser ou supprimer après confirmation.
- Le formulaire d’annonce valide les champs et prévisualise les images avant leur publication.
- Les connexions client et admin sont des écrans de démonstration uniquement. Il n’y a pas encore de comptes, de mots de passe vérifiés ou de contrôle d’accès sécurisé côté serveur.
- Le PDF fourni est une planche récapitulative des écrans ; certains détails fins du Figma original (mesures exactes, images, composants ou états non visibles) ne peuvent pas être reproduits au pixel près depuis cette seule planche.




