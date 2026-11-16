/* QuickAnnonces — front-end uniquement
   Navigation par hash, données de démonstration et interactions locales.
   Aucune API / base de données n'est connectée. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $("#app");
const state = {
  query: "",
  category: "Toutes les catégories",
  type: "Tous",
  sort: "Plus récent",
  favorites: new Set(),
  messages: [
    { user: "Yasmine Benali", text: "Bonjour, est-ce que le téléphone est encore disponible ?", mine: false },
    { user: "Vous", text: "Oui, il est toujours disponible.", mine: true }
  ],
  comments: [
    { user: "Yasmine", text: "Est-ce que le téléphone est encore disponible ?" },
    { user: "Omar", text: "La livraison est-elle possible à Tétouan ?" }
  ],
  adminFilter: "Toutes"
};

const listings = [
  { id: 1, title: "iPhone 13", price: 4500, category: "Électronique", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "📱", condition: "Très bon état", description: "Je vends cet iPhone 13 en très bon état, toujours protégé par une coque et un film de protection.", seller: "Yasmine Benali", verified: true },
  { id: 2, title: "Peugeot 208", price: 120000, category: "Véhicules", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "🚗", condition: "Bon état", description: "Peugeot 208 bien entretenue. Visible à Tanger sur rendez-vous.", seller: "Yassine B.", verified: true },
  { id: 3, title: "Appartement à louer", price: 6000, category: "Immobilier", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "🏠", condition: "2 chambres", description: "Appartement lumineux, proche des commerces et des transports.", seller: "Sarah El Idrissi", verified: true },
  { id: 4, title: "Ordinateur portable", price: 3500, category: "Électronique", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "💻", condition: "Très bon état", description: "Ordinateur portable adapté aux études et au travail.", seller: "Omar El Amrani", verified: true },
  { id: 5, title: "Samsung Galaxy S23", price: 3000, category: "Électronique", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "📲", condition: "Bon état", description: "Samsung Galaxy S23, débloqué et prêt à l'utilisation.", seller: "Imane Bennis", verified: true },
  { id: 6, title: "Voiture Renault Clio", price: 85000, category: "Véhicules", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "🚙", condition: "Bon état", description: "Renault Clio, entretien à jour. Contactez le vendeur pour plus d'informations.", seller: "Ali M.", verified: true },
  { id: 7, title: "Canapé moderne", price: 2500, category: "Maison & Jardin", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "🛋️", condition: "Très bon état", description: "Canapé moderne confortable, couleur neutre.", seller: "Sarah El Idrissi", verified: true },
  { id: 8, title: "Vélo de montagne", price: 1800, category: "Sports", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "🚲", condition: "Bon état", description: "Vélo de montagne pour sorties et loisirs.", seller: "Omar El Amrani", verified: true },
  { id: 9, title: "Machine à laver", price: 2800, category: "Maison & Jardin", city: "Tanger", age: "Il y a 2 h", type: "À vendre", emoji: "🧺", condition: "Bon état", description: "Machine à laver en bon état de fonctionnement.", seller: "Imane Bennis", verified: true },
  { id: 10, title: "iPhone 14", price: 4900, category: "Électronique", city: "Tanger", age: "Il y a 1 h", type: "À vendre", emoji: "📱", condition: "Excellent état", description: "iPhone 14 en excellent état, batterie 92%, avec boîte et accessoires.", seller: "Ali M.", verified: true },
  { id: 11, title: "Baskets Nike", price: 850, category: "Mode", city: "Tanger", age: "Il y a 3 h", type: "À vendre", emoji: "👟", condition: "Neuf", description: "Baskets confortables. Taille à confirmer avec le vendeur.", seller: "Yasmine Benali", verified: true },
  { id: 12, title: "Montre connectée", price: 700, category: "Électronique", city: "Tanger", age: "Hier", type: "À vendre", emoji: "⌚", condition: "Très bon état", description: "Montre connectée avec chargeur.", seller: "Sarah El Idrissi", verified: true }
];
const categories = [];
const money = n => new Intl.NumberFormat("fr-MA").format(n) + " MAD";
const getListing = id => listings.find(item => item.id === Number(id)) || listings[0];
const icon = name => ({ home: "⌂", search: "⌕", heart: "♡", user: "♙", plus: "+" }[name] || "•");

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
function go(page, params = "") { location.hash = `/${page}${params}`; }
function currentRoute() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [page = "home", ...rest] = raw.split("/");
  return { page: page || "home", id: rest[0] || "" };
}
function profileInitials(name = "") {
  return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("fr");
}
function header(active = "") {
  const currentUser = state.currentUser;
  const roleLabel = currentUser?.role === "admin" ? "Administrateur" : "Membre";
  const actions = currentUser
    ? `<a class="btn btn-primary" href="#/publish">＋ Publier</a>
       <button class="btn btn-outline login-label" type="button">Se déconnecter</button>
       <div class="profile-menu">
         <button class="profile-trigger" type="button" data-profile-toggle aria-expanded="false" aria-haspopup="true">
           <span class="profile-avatar">${escapeHTML(profileInitials(currentUser.full_name))}</span>
           <span class="profile-trigger-name">${escapeHTML(currentUser.full_name || "Mon profil")}</span>
           <span class="profile-chevron" aria-hidden="true">⌄</span>
         </button>
         <div class="profile-dropdown" hidden>
           <div class="profile-summary"><strong>${escapeHTML(currentUser.full_name || "")}</strong><span>${escapeHTML(currentUser.email || "")}</span><small>${roleLabel}</small></div>
           <a href="./account.html">Mon profil</a>
           ${currentUser.role === "admin" ? `<a href="./admin.html">Administration</a>` : ""}
         </div>
       </div>`
    : `<a class="login-label text-link" href="./login.html">Se connecter</a><a class="btn btn-outline" href="./register.html">Créer un compte</a>`;
  return `<header class="topbar"><nav class="nav">
    <a class="logo" href="#/home"><span class="logo-mark">Q</span>QuickAnnonces</a>
    <div class="navlinks">
      <a class="${active === "home" ? "active" : ""}" href="#/home">Accueil</a>
      <a href="#/search">Catégories</a>
      <a href="#/my-ads">Mes annonces</a>
      <a href="#/quickmatch">QuickMatch ✨</a>
      <a href="#/favorites">♡ Favoris</a>
    </div>
    <form class="nav-search" id="nav-search"><input name="q" placeholder="Rechercher une annonce..." aria-label="Rechercher une annonce"></form>
    <div class="nav-actions">${actions}</div>
  </nav></header>`;
}
function footer() {
  return `<footer class="footer"><div class="footer-inner"><a class="logo" href="#/home"><span class="logo-mark">Q</span>QuickAnnonces</a><span>Achetez, vendez et trouvez près de chez vous.</span><span>© 2026 QuickAnnonces · Front-end de démonstration</span></div></footer>`;
}
function shell(content, active = "") { app.innerHTML = header(active) + `<main class="container">${content}</main>` + footer(); bindGlobal(); }
function listingCard(item) {
  const saved = state.favorites.has(item.id);
  const cover = item.images?.[0]?.image_url;
  return `<article class="listing">
    <div class="listing-image"><span class="pill">${item.type}</span><button class="heart ${saved ? "saved" : ""}" data-fav="${item.id}" aria-label="Ajouter aux favoris">${saved ? "♥" : "♡"}</button>${cover ? `<img src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)}" style="width:100%;height:100%;object-fit:cover">` : `<span>${item.emoji}</span>`}</div>
    <a class="listing-body" href="#/detail/${item.id}"><h3>${item.title}</h3><div class="price">${money(item.price)}${item.id === 3 ? "/mois" : ""}</div><div class="meta">📍 ${item.city} · ${item.age} ${item.verified ? "· ✓ Vérifié" : ""}</div></a>
  </article>`;
}
function cards(items, cls = "") { return `<div class="grid ${cls}">${items.map(listingCard).join("")}</div>`; }
function pageTitle(title, subtitle = "") { return `<div class="page-title"><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div>`; }

function homePage() {
  shell(`<section class="hero">
    <div><span class="eyebrow">Bienvenue sur QuickAnnonces</span><h1>Trouvez. Publiez.<br>Connectez-vous.</h1>
    <p>Des annonces de vente et de recherche, avec des personnes réelles. Achetez, vendez ou recherchez facilement près de chez vous.</p>
    <form class="searchbar" id="hero-search"><input name="q" placeholder="🔎 Que recherchez-vous ?" aria-label="Que recherchez-vous ?"><button class="btn btn-primary">Rechercher</button></form>
    <div class="actions" style="margin-top:16px"><a class="btn btn-outline" href="#/search">Explorer les annonces</a><a class="btn btn-soft" href="#/publish">＋ Publier une annonce</a></div></div>
    <div class="hero-art"><div class="art-card"><div class="art-visual">🛍️</div><strong>Une bonne affaire près de vous</strong><small>Des annonces simples, des contacts directs.</small></div></div>
  </section>
  <section class="section"><div class="section-heading"><div><h2>Annonces récentes</h2><p>Découvrez les dernières annonces près de chez vous.</p></div><a class="text-link" href="#/search">Voir toutes les annonces →</a></div>${cards(listings.slice(9, 12).concat(listings.slice(0, 1)))}</section>
  <section class="section"><div class="section-heading"><div><h2>Annonces en vedette</h2><p>Des offres sélectionnées pour vous.</p></div></div>${cards(listings.slice(0, 4))}</section>
  <section class="section panel"><div class="two-col"><div><span class="eyebrow">QuickMatch ✨</span><h2>Votre recherche, en plus simple</h2><p>Décrivez ce que vous cherchez et découvrez les annonces les plus pertinentes.</p></div><div class="actions" style="align-items:center;justify-content:flex-end"><a class="btn btn-primary" href="#/find-for-me">Trouver pour moi ✨</a><a class="btn btn-outline" href="#/quickmatch">Découvrir QuickMatch</a></div></div></section>`, "home");
}
function searchPage() {
  const q = new URLSearchParams(location.search).get("q") || state.query;
  let results = listings.filter(x => (!q || x.title.toLowerCase().includes(q.toLowerCase()) || x.category.toLowerCase().includes(q.toLowerCase())) && (state.category === "Toutes les catégories" || x.category === state.category) && (state.type === "Tous" || x.type === state.type));
  if (state.sort === "Prix croissant") results.sort((a,b) => a.price-b.price);
  if (state.sort === "Prix décroissant") results.sort((a,b) => b.price-a.price);
  shell(`<div class="layout"><aside class="panel filters"><h3>Filtres</h3><form id="filter-form">
    <div class="field"><label for="category">Catégorie</label><select id="category" name="category"><option>Toutes les catégories</option>${categories.map(c=>`<option ${state.category===c?"selected":""}>${c}</option>`).join("")}</select></div>
    <div class="field"><label for="type">Type d’annonce</label><select id="type" name="type"><option>Tous</option><option ${state.type==="À vendre"?"selected":""}>À vendre</option><option ${state.type==="Je recherche"?"selected":""}>Je recherche</option></select></div>
    <div class="field"><label for="sort">Trier par</label><select id="sort" name="sort"><option>Plus récent</option><option ${state.sort==="Prix croissant"?"selected":""}>Prix croissant</option><option ${state.sort==="Prix décroissant"?"selected":""}>Prix décroissant</option></select></div>
    <button class="btn btn-primary btn-block">Appliquer les filtres</button><button type="button" class="btn btn-outline btn-block" id="reset-filters" style="margin-top:8px">Réinitialiser</button></form></aside>
    <section><div class="section-heading"><div><h1>Recherche d’annonces</h1><p>${results.length} annonce(s) trouvée(s)</p></div></div>
    <form class="searchbar" id="results-search"><input name="q" value="${escapeHTML(q)}" placeholder="Rechercher une annonce..."><button class="btn btn-primary">Rechercher</button></form>
    <div class="grid three" style="margin-top:20px">${results.map(listingCard).join("") || `<div class="empty"><div class="emoji">🔎</div><h3>Aucune annonce trouvée</h3><p>Essayez de modifier vos critères de recherche.</p></div>`}</div></section></div>`, "search");
}
function detailPage(id) {
  const item = getListing(id);
  shell(`<div class="breadcrumb"><a href="#/home">Accueil</a> / <a href="#/search">${item.category}</a> / ${item.title}</div>
  <div class="detail-layout"><section><div class="product-visual">${item.emoji}</div><div class="panel section"><h2>Description</h2><p>${item.description}</p><div class="meta">État : ${item.condition} · Catégorie : ${item.category} · 📍 ${item.city}</div></div>
  <div class="panel section"><h2>Commentaires (${state.comments.length + 6})</h2>${state.comments.map(c=>`<div class="comment"><strong>${c.user}</strong><p style="margin:0">${escapeHTML(c.text)}</p><button class="btn btn-soft" data-reply="${escapeHTML(c.user)}">Répondre</button></div>`).join("")}
  <form id="comment-form" class="section"><div class="field"><label for="comment">Ajouter un commentaire</label><textarea id="comment" name="comment" placeholder="Écrivez votre commentaire..." required></textarea></div><button class="btn btn-primary">Publier le commentaire</button></form></div></section>
  <aside class="panel product-info"><span class="pill">${item.type}</span><h1 style="font-size:30px">${item.title}</h1><div class="price">${money(item.price)}${item.id===3?"/mois":""}</div><p>${item.condition} · ${item.category}</p><div class="notice">✓ Vendeur vérifié <br>📍 ${item.city} · ${item.age}</div><div class="actions"><button class="btn btn-primary" id="contact-seller">💬 Contacter</button><button class="btn btn-outline" data-fav="${item.id}">${state.favorites.has(item.id)?"♥ Favoris":"♡ Favoris"}</button></div><div class="section"><h3>Profil vendeur</h3><div class="profile-head"><div class="avatar">${item.seller.split(" ").map(s=>s[0]).slice(0,2).join("")}</div><div><strong>${item.seller}</strong><div class="meta">★ 4.9 · Vendeur vérifié</div><a class="text-link small" href="#/seller">Voir le profil</a></div></div></div></aside></div>`);
}
function publishPage() {
  shell(`<div style="max-width:820px;margin:auto">${pageTitle("Créer une nouvelle annonce", "Choisissez le type d’annonce et complétez les informations.")}
  <div class="two-col section"><button class="panel type-choice" data-type="À vendre" style="text-align:left"><span class="eyebrow">À vendre</span><h2>Je souhaite vendre</h2><p>Je souhaite vendre un article, un bien ou un service.</p><span class="btn btn-outline">Choisir</span></button><button class="panel type-choice" data-type="Je recherche" style="text-align:left"><span class="eyebrow">Je recherche</span><h2>Je recherche</h2><p>Je recherche un article, un bien ou un service.</p><span class="btn btn-outline">Choisir</span></button></div>
  <form id="publish-form" class="panel section"><h2>Informations de l’annonce</h2><div class="field"><label for="ad-title">Titre de l’annonce</label><input id="ad-title" name="title" placeholder="Ex : iPhone 13 en très bon état" required></div>
  <div class="two-col"><div class="field"><label>Catégorie</label><select name="category" required><option value="">Sélectionner une catégorie</option>${categories.map(c=>`<option>${c}</option>`).join("")}</select></div><div class="field"><label>Prix en MAD</label><input name="price" type="number" min="0" placeholder="Prix en MAD" required></div></div>
  <div class="two-col"><div class="field"><label>Localisation</label><select name="city"><option>Tanger</option><option>Tétouan</option><option>Rabat</option><option>Casablanca</option><option>Fès</option><option>Marrakech</option></select></div><div class="field"><label>État</label><select name="condition"><option>Neuf</option><option>Très bon état</option><option>Bon état</option><option>État correct</option></select></div></div>
  <div class="field"><label>Description</label><textarea name="description" placeholder="Décrivez votre annonce..." required></textarea></div><div class="field"><label>Photo (maquette front-end)</label><input name="photo" type="file" accept="image/*"></div>
  <div class="actions"><button class="btn btn-primary">Publier l’annonce</button><a class="btn btn-outline" href="#/my-ads">Annuler</a></div><p class="small">Démo front-end : les annonces créées sont conservées uniquement dans la session en cours.</p></form></div>`);
}
function myAdsPage() {
  shell(`<div class="section-heading"><div>${pageTitle("Mes annonces", "Gérez vos annonces et consultez leur statut.")}</div><a href="#/publish" class="btn btn-primary">＋ Publier une annonce</a></div>
  <div class="panel"><div class="profile-head"><div class="avatar">MT</div><div><h2>Mariam Tahayekt</h2><p>Membre depuis 2026 · Tanger</p></div><button class="btn btn-outline" style="margin-left:auto" id="edit-profile">Modifier le profil</button></div>
  <div class="stats"><div class="stat"><strong>12</strong><span>Annonces publiées</span></div><div class="stat"><strong>${state.favorites.size}</strong><span>Favoris</span></div><div class="stat"><strong>5</strong><span>Avis</span></div><div class="stat"><strong>4</strong><span>Messages</span></div></div></div>
  <div class="tabs"><button class="tab active">Toutes</button><button class="tab">Actives</button><button class="tab">En attente</button><button class="tab">Terminées</button></div>
  ${cards([listings[0], listings[2], listings[1], listings[6]])}`, "my-ads");
}
function favoritesPage() {
  const items = listings.filter(x => state.favorites.has(x.id));
  shell(`${pageTitle("Mes favoris", "Retrouvez ici les annonces que vous avez enregistrées.")}${items.length ? cards(items) : `<div class="empty"><div class="emoji">♡</div><h2>Aucun favori pour le moment</h2><p>Ajoutez une annonce à vos favoris en cliquant sur le cœur.</p><a href="#/search" class="btn btn-primary">Explorer les annonces</a></div>`}`);
}
function messagesPage() {
  shell(`<div class="page-title"><h1>Messages</h1><p>Échangez directement avec les vendeurs et les acheteurs.</p></div>
  <div class="panel chat-layout"><aside class="chat-list"><h3>Conversations</h3><div class="chat-person active"><strong>Yasmine Benali</strong><div class="meta">Bonjour, est-ce que le téléphone...</div></div><div class="chat-person"><strong>Sarah El Idrissi</strong><div class="meta">Dernier message...</div></div><div class="chat-person"><strong>Omar El Amrani</strong><div class="meta">Dernier message...</div></div><div class="chat-person"><strong>Imane Bennis</strong><div class="meta">Dernier message...</div></div></aside>
  <section class="chat-window"><div class="chat-head">Yasmine Benali <span class="meta">· À propos de iPhone 13</span></div><div class="messages" id="messages">${state.messages.map(m=>`<div class="bubble ${m.mine?"mine":""}">${escapeHTML(m.text)}</div>`).join("")}</div>
  <form class="chat-compose" id="message-form"><input name="message" placeholder="Écrire un message..." required><button class="btn btn-primary">Envoyer</button></form></section></div>`);
}
function loginPage(register = false) {
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="#/home"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":"Se connecter"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  <form id="auth-form">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required minlength="10"></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="10"></div>`:`<div style="text-align:right"><a class="text-link small" href="#/forgot">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="./${register?"login":"register"}.html">${register?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}
function forgotPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Récupérez votre compte</h1><p>Nous vous aiderons à retrouver l’accès à votre espace.</p></aside><section class="auth-form"><h2>Mot de passe oublié ?</h2><p>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p><form id="forgot-form"><div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div><button class="btn btn-primary btn-block">Envoyer le lien de réinitialisation</button></form><p class="center"><a class="text-link" href="#/login">← Retour à la connexion</a></p></section></div>`);
}
function resetPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Un nouveau départ</h1><p>Choisissez un nouveau mot de passe sécurisé.</p></aside><section class="auth-form"><h2>Créer un nouveau mot de passe</h2><form id="reset-form"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" required minlength="10"></div><div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" required minlength="10"></div><button class="btn btn-primary btn-block">Réinitialiser le mot de passe</button></form></section></div>`);
}
function quickmatchPage() {
  shell(`<div class="two-col"><section>${pageTitle("QuickMatch ✨", "Notre fonctionnalité spéciale : nous trouvons automatiquement les annonces qui correspondent à votre recherche.")}<div class="panel"><div class="field"><label>🔎 Je recherche</label><input id="match-query" value="iPhone 14 128 Go"></div><button id="run-match" class="btn btn-primary">Trouver les correspondances</button><button id="create-alert" class="btn btn-outline">🔔 Créer une alerte</button></div><div class="section" id="match-detail"><div class="product-visual" style="min-height:200px">📱</div><h2 class="section">iPhone 14 — Excellent état</h2><div class="price">4 900 DH</div><div class="notice success">✓ Vendeur vérifié · ★ 4.9</div><p>Description : téléphone en excellent état, batterie 92%, avec boîte et accessoires.</p><button class="btn btn-primary" data-go-detail="10">💬 Contacter</button> <button class="btn btn-outline" data-fav="10">♡ Ajouter aux favoris</button></div></section>
  <aside><div class="panel"><h2>3 correspondances trouvées</h2><p>Les annonces les plus proches de votre recherche.</p>${matchRow(listings[9],98)}${matchRow(listings[10],90)}${matchRow(listings[3],82)}</div></aside></div>`);
}
function matchRow(item, score) { return `<div class="match-row"><div class="mini-visual">${item.emoji}</div><div><strong>${item.title}</strong><div class="price">${money(item.price)}</div><div class="meta">Correspond à votre recherche</div></div><div class="match-score">${score}% MATCH<br><a class="text-link small" href="#/detail/${item.id}">Voir l’annonce</a></div></div>`; }
function findForMePage() {
  shell(`${pageTitle("Trouver pour moi ✨", "Décrivez simplement ce que vous cherchez. QuickAnnonces trouve les annonces les plus pertinentes.")}<div class="two-col"><section class="panel"><form id="find-form"><div class="field"><label>💬 Que recherchez-vous ?</label><textarea name="prompt" placeholder="Ex. : Je recherche un ordinateur portable pour mes études, 16 Go RAM, budget 4 000 DH maximum." required></textarea></div><button class="btn btn-primary">✨ Trouver pour moi</button></form><p class="small">Exemple : « Je cherche un appartement 2 chambres près du centre, moins de 5 000 DH. »</p></section><section class="panel"><h2>Résultats personnalisés</h2><div id="personal-results">${matchRow({emoji:"💻",title:"Laptop Lenovo",price:3800,id:4},98)}${matchRow({emoji:"💻",title:"HP Pavilion",price:3950,id:4},91)}${matchRow({emoji:"💻",title:"Dell Latitude",price:3500,id:4},84)}</div></section></div>`);
}
function alertsPage() {
  shell(`${pageTitle("Alerte intelligente 🔔", "Ne ratez plus jamais une annonce qui correspond à votre recherche.")}<div class="two-col"><section class="panel"><span class="pill">🔔 Alerte activée</span><h2 class="section">Ordinateur portable pour études</h2><p>Budget ≤ 4 000 DH · 16 Go RAM · Tanger</p><div class="notice success">Nouvelle correspondance !</div><div class="match-row"><div class="mini-visual">💻</div><div><strong>Lenovo ThinkPad</strong><div class="price">3 900 DH</div><div class="meta">96% Match · Publiée il y a 8 min</div></div><a class="text-link" href="#/detail/4">Voir l’annonce</a></div></section><section class="panel"><h2>Créer une alerte</h2><form id="alert-form"><div class="field"><label>Recherche</label><input name="query" placeholder="Ex. : ordinateur portable" required></div><div class="field"><label>Budget maximum (DH)</label><input name="budget" type="number" placeholder="4000"></div><div class="field"><label>Ville</label><select name="city"><option>Tanger</option><option>Tétouan</option><option>Rabat</option><option>Casablanca</option></select></div><button class="btn btn-primary">Activer l’alerte</button></form></section></div>`);
}
function comparePage() {
  const items = [listings[3], { ...listings[3], id: 13, title: "HP Pavilion", price: 3950, emoji: "💻", condition: "16 Go RAM, 512 Go SSD" }, { ...listings[3], id: 14, title: "Dell Latitude", price: 3500, emoji: "💻", condition: "8 Go RAM, 256 Go SSD" }];
  shell(`${pageTitle("Comparer les annonces", "Comparez les offres importantes avant de contacter un vendeur.")}<div class="panel comparison"><table><thead><tr><th>Critère</th>${items.map(x=>`<th>${x.title}</th>`).join("")}</tr></thead><tbody><tr><td>Prix</td>${items.map(x=>`<td><strong>${money(x.price)}</strong></td>`).join("")}</tr><tr><td>RAM</td><td>16 Go</td><td>16 Go</td><td>8 Go</td></tr><tr><td>Stockage</td><td>512 Go SSD</td><td>512 Go SSD</td><td>256 Go SSD</td></tr><tr><td>Évaluation</td><td>★ 4.8</td><td>★ 4.6</td><td>★ 4.7</td></tr><tr><td>Action</td>${items.map((x,i)=>`<td><a class="btn ${i===0?"btn-primary":"btn-outline"}" href="#/detail/4">${i===0?"Meilleur choix":"Voir l’annonce"}</a></td>`).join("")}</tr></tbody></table></div>`);
}
function securityPage() {
  const features = [["✓","Identité vérifiée","Le profil a confirmé son identité."],["✓","Téléphone vérifié","Numéro confirmé par SMS."],["✓","Annonce contrôlée","Contenu vérifié automatiquement."],["★","Bon historique","Évaluations positives des utilisateurs."]];
  shell(`${pageTitle("Sécurité & confiance 🛡️", "Des indicateurs simples pour acheter et vendre plus sereinement.")}<div class="two-col"><section class="panel">${features.map(f=>`<div class="profile-head" style="padding:17px 0;border-bottom:1px solid var(--line)"><div class="avatar">${f[0]}</div><div><h3>${f[1]}</h3><p style="margin:0">${f[2]}</p></div></div>`).join("")}</section><aside class="panel"><h2>Indice de confiance</h2><p>Les profils et les annonces peuvent afficher des indicateurs utiles pour vous aider à prendre une décision.</p><div class="notice success">✓ Identité vérifiée<br>✓ Téléphone vérifié<br>✓ Réponse rapide<br>✓ Historique positif</div><p class="small">Les indicateurs sont des exemples de maquette et ne représentent pas une vérification réelle.</p></aside></div>`);
}
function dashboardPage() {
  shell(`${pageTitle("Bonjour 👋", "Voici ce qui se passe sur QuickAnnonces.")}<div class="stats"><div class="stat"><strong>12</strong><span>Annonces consultées</span></div><div class="stat"><strong>4</strong><span>Correspondances</span></div><div class="stat"><strong>2</strong><span>Alertes actives</span></div><div class="stat"><strong>3</strong><span>Messages</span></div></div><div class="panel"><h2>Pour vous</h2><div class="notice">✨ 3 nouvelles annonces correspondent à vos recherches <a class="text-link" href="#/quickmatch">Voir les matchs →</a></div><div class="actions"><a class="btn btn-primary" href="#/messages">Ouvrir les messages</a><a class="btn btn-outline" href="#/alerts">Gérer mes alertes</a><a class="btn btn-outline" href="#/my-ads">Mes annonces</a></div></div>`);
}
function adminPage() {
  const items = [listings[9], listings[9], listings[9]];
  shell(`${pageTitle("Bonjour Admin (mohammed) 👋", "Voici ce qui se passe sur QuickAnnonces.")}<div class="stats"><div class="stat"><strong>12</strong><span>En attente</span></div><div class="stat"><strong>48</strong><span>Validées</span></div><div class="stat"><strong>5</strong><span>Refusées</span></div></div><div class="panel"><div class="section-heading"><h2>Annonces à modérer</h2><span class="pill">Administration</span></div><div class="tabs">${["Toutes","En attente","Validées","Refusées"].map(x=>`<button class="tab ${state.adminFilter===x?"active":""}" data-admin-filter="${x}">${x}</button>`).join("")}</div><div id="moderation-list">${items.map((x,i)=>`<div class="match-row"><div class="mini-visual">${x.emoji}</div><div><span class="pill">À vendre</span><strong style="display:block;margin-top:6px">${x.title}</strong><div class="price">${money(x.price)}</div><div class="meta">📍 Tanger · ✓ Vérifié (ALI)</div></div><div><span class="pill">${state.adminFilter==="Toutes"?"En attente":state.adminFilter}</span><div class="actions" style="margin-top:10px"><button class="btn btn-primary" data-moderate="validé">Valider</button><button class="btn btn-danger" data-moderate="refusé">Refuser</button></div></div></div>`).join("")}</div></div>`);
}
function sellerPage() {
  shell(`${pageTitle("Profil vendeur", "Consultez les informations publiques du vendeur.")}<div class="panel"><div class="profile-head"><div class="avatar">YB</div><div><h2>Yasmine B.</h2><div class="meta">✓ Profil vérifié · Membre depuis 2026</div><p>★ 4.9 · 38 évaluations</p></div></div><div class="stats"><div class="stat"><strong>23</strong><span>Annonces</span></div><div class="stat"><strong>4.9</strong><span>Note moyenne</span></div><div class="stat"><strong>38</strong><span>Évaluations</span></div><div class="stat"><strong>Rapide</strong><span>Réponse</span></div></div><h2>Ses annonces</h2>${cards([listings[0], listings[9], listings[10]], "three")}</div>`);
}
function notFoundPage() { shell(`<div class="empty"><div class="emoji">🧭</div><h2>Page introuvable</h2><p>La page demandée n’existe pas dans cette maquette.</p><a class="btn btn-primary" href="#/home">Retour à l’accueil</a></div>`); }
function escapeHTML(value = "") { return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch])); }

function render() {
  const { page, id } = currentRoute();
  switch (page) {
    case "": case "home": homePage(); break;
    case "search": searchPage(); break;
    case "detail": detailPage(id); break;
    case "publish": publishPage(); break;
    case "my-ads": myAdsPage(); break;
    case "favorites": favoritesPage(); break;
    case "messages": messagesPage(); break;
    case "login": loginPage(false); break;
    case "register": loginPage(true); break;
    case "forgot": forgotPage(); break;
    case "reset": resetPage(); break;
    case "quickmatch": quickmatchPage(); break;
    case "find-for-me": findForMePage(); break;
    case "alerts": alertsPage(); break;
    case "compare": comparePage(); break;
    case "security": securityPage(); break;
    case "dashboard": dashboardPage(); break;
    case "admin": adminPage(); break;
    case "seller": sellerPage(); break;
    default: notFoundPage();
  }
}
function bindGlobal() {
  const navSearch = $("#nav-search");
  if (navSearch) navSearch.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(navSearch).get("q").trim(); go("search"); });
  $$("[data-fav]").forEach(btn => btn.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    const id = Number(btn.dataset.fav);
    if (state.favorites.has(id)) { state.favorites.delete(id); toast("Annonce retirée des favoris."); }
    else { state.favorites.add(id); toast("Annonce ajoutée aux favoris."); }
    render();
  }));
  $$("[data-go-detail]").forEach(btn => btn.addEventListener("click", () => go("detail", `/${btn.dataset.goDetail}`)));
  $("#hero-search")?.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(e.currentTarget).get("q").trim(); go("search"); });
  $("#results-search")?.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(e.currentTarget).get("q").trim(); render(); });
  $("#filter-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); state.category = fd.get("category"); state.type = fd.get("type"); state.sort = fd.get("sort"); render(); });
  $("#reset-filters")?.addEventListener("click", () => { state.category = "Toutes les catégories"; state.type = "Tous"; state.sort = "Plus récent"; state.query = ""; render(); });
  $$("[data-type]").forEach(btn => btn.addEventListener("click", () => { $$("[data-type]").forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); const form = $("#publish-form"); form.dataset.type = btn.dataset.type; toast(`Type choisi : ${btn.dataset.type}`); }));
  $("#publish-form")?.addEventListener("submit", e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const newItem = { id: Math.max(...listings.map(x=>x.id))+1, title: fd.get("title"), price: Number(fd.get("price")), category: fd.get("category"), city: fd.get("city"), age: "À l’instant", type: e.currentTarget.dataset.type || "À vendre", emoji: "📦", condition: fd.get("condition"), description: fd.get("description"), seller: "Mariam Tahayekt", verified: false };
    listings.unshift(newItem); toast("Annonce ajoutée à la démo front-end."); go("detail", `/${newItem.id}`);
  });
  $("#comment-form")?.addEventListener("submit", e => { e.preventDefault(); state.comments.push({ user: "Vous", text: new FormData(e.currentTarget).get("comment") }); toast("Commentaire ajouté."); render(); });
  $$("[data-reply]").forEach(btn => btn.addEventListener("click", () => { $("#comment").value = `@${btn.dataset.reply} `; $("#comment").focus(); }));
  $("#contact-seller")?.addEventListener("click", () => go("messages"));
  $("#message-form")?.addEventListener("submit", e => { e.preventDefault(); const text = new FormData(e.currentTarget).get("message").trim(); if (!text) return; state.messages.push({ user: "Vous", text, mine: true }); render(); toast("Message ajouté à la conversation de démonstration."); });
  $$(".chat-person").forEach(el => el.addEventListener("click", () => { $$(".chat-person").forEach(x=>x.classList.remove("active")); el.classList.add("active"); toast("Conversation de démonstration sélectionnée."); }));
  $("#auth-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); if (fd.has("confirm") && fd.get("password") !== fd.get("confirm")) return toast("Les mots de passe ne correspondent pas."); toast("Formulaire validé en mode démo (aucune connexion réelle)."); go("dashboard"); });
  $("#forgot-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Lien simulé : aucun e-mail n’a été envoyé."); e.currentTarget.insertAdjacentHTML("beforeend", '<div class="notice success">✓ Demande traitée en mode démonstration.</div>'); });
  $("#reset-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); if(fd.get("password")!==fd.get("confirm")) return toast("Les mots de passe ne correspondent pas."); toast("Mot de passe mis à jour en mode démo."); go("login"); });
  $("#edit-profile")?.addEventListener("click", () => toast("Modification du profil : à connecter au backend."));
  $("#run-match")?.addEventListener("click", () => { state.query = $("#match-query").value; toast("Correspondances recalculées pour la démo."); });
  $("#create-alert")?.addEventListener("click", () => go("alerts"));
  $("#find-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Résultats personnalisés simulés."); $("#personal-results").scrollIntoView({behavior:"smooth",block:"center"}); });
  $("#alert-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Alerte activée en mode démo."); e.currentTarget.insertAdjacentHTML("beforeend", '<div class="notice success">🔔 Votre alerte de démonstration est activée.</div>'); });
  $$("[data-admin-filter]").forEach(btn => btn.addEventListener("click", () => { state.adminFilter = btn.dataset.adminFilter; render(); }));
  $$("[data-moderate]").forEach(btn => btn.addEventListener("click", () => { toast(`Annonce marquée comme ${btn.dataset.moderate} (démo).`); btn.closest(".match-row").remove(); }));
}
window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);
render();

// Live API integration: keep the existing screens and styling, replacing demo
// actions with same-origin PHP requests when the API is available.
state.currentUser = null;
state.csrf = null;
state.backendReady = false;
async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (state.csrf && options.method && options.method !== "GET") headers.set("X-CSRF-Token", state.csrf);
  const queryAt = path.indexOf("?");
  const route = queryAt < 0 ? path : path.slice(0, queryAt);
  const query = new URLSearchParams(queryAt < 0 ? "" : path.slice(queryAt + 1));
  let endpoint;
  if (route.startsWith("auth/")) endpoint = `/api/auth/${route.slice(5)}`;
  else if (route === "categories") endpoint = "/api/categories";
  else if (route === "listings") endpoint = "/api/listings";
  else if (route === "me/listings") endpoint = "/api/me/listings";
  else if (route === "favorites" || route.startsWith("favorites/")) {
    const id = route.match(/^favorites\/(\d+)$/)?.[1];
    endpoint = id ? `/api/favorites/${id}` : "/api/favorites";
  } else if (route === "conversations" || route.startsWith("conversations/")) {
    const match = route.match(/^conversations\/(\d+)\/messages$/);
    endpoint = match ? `/api/conversations/${match[1]}/messages` : "/api/conversations";
  } else if (route === "alerts") endpoint = "/api/alerts";
  else if (route === "admin/listings") endpoint = "/api/admin/listings";
  else if (route.startsWith("admin/listings/")) endpoint = `/api/admin/listings/${route.split("/")[2]}`;
  else if (route.startsWith("listings/") && route.endsWith("/comments")) endpoint = `/api/listings/${route.split("/")[1]}/comments`;
  else if (route.startsWith("listings/")) endpoint = `/api/listings/${route.split("/")[1]}`;
  else throw new Error("API route not configured.");
  const queryString = query.toString();
  if (queryString) endpoint += `?${queryString}`;
  const response = await fetch(endpoint, { credentials: "same-origin", ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "La requête a échoué.");
  return data;
}
function liveListing(row) {
  const created = new Date(String(row.created_at || "").replace(" ", "T") + (String(row.created_at || "").endsWith("Z") ? "" : "Z"));
  const minutes = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000));
  return {
    id: Number(row.id), title: row.title, price: Number(row.price), category: row.category,
    city: row.city, age: Number.isFinite(minutes) ? (minutes < 60 ? `Il y a ${minutes} min` : `Il y a ${Math.floor(minutes / 60)} h`) : "Récemment",
    type: row.annonce_type === "wanted" ? "Je recherche" : "À vendre", emoji: "📦",
    condition: row.item_condition || "", description: row.description, seller: row.seller || "Membre QuickAnnonces",
    verified: false, status: row.status, images: row.images || [], user_id: Number(row.user_id)
  };
}
async function refreshListings() {
  try {
    const { listings: rows } = await apiRequest("listings");
    listings.splice(0, listings.length, ...rows.map(liveListing));
    state.backendReady = true;
    const favs = state.currentUser ? await apiRequest("favorites") : { listings: [] };
    state.favorites = new Set((favs.listings || []).map(x => Number(x.id)));
    render();
  } catch (error) {
    state.backendReady = false;
    listings.splice(0, listings.length);
    render();
    toast(`Serveur indisponible : ${error.message}`);
  }
}
async function refreshCategories() {
  const { categories: rows } = await apiRequest("categories");
  if (!Array.isArray(rows)) throw new Error("La liste des catégories est invalide.");
  categories.splice(0, categories.length, ...rows.map(row => String(row.name)));
  render();
}
function showApiError(error) { toast(error.message || "Une erreur est survenue."); }
document.addEventListener("click", async event => {
  const profileToggle = event.target.closest?.("[data-profile-toggle]");
  if (profileToggle) {
    event.preventDefault(); event.stopImmediatePropagation();
    const menu = profileToggle.closest(".profile-menu");
    const isOpen = menu.classList.toggle("open");
    profileToggle.setAttribute("aria-expanded", String(isOpen));
    menu.querySelector(".profile-dropdown").hidden = !isOpen;
    return;
  }
  const openProfile = document.querySelector(".profile-menu.open");
  if (openProfile && !openProfile.contains(event.target)) {
    openProfile.classList.remove("open");
    openProfile.querySelector("[data-profile-toggle]")?.setAttribute("aria-expanded", "false");
    openProfile.querySelector(".profile-dropdown").hidden = true;
  }
  const conversation = event.target.closest?.("[data-conversation]");
  if (conversation) {
    event.preventDefault(); event.stopImmediatePropagation();
    state.conversationId = Number(conversation.dataset.conversation);
    await loadConversation(state.conversationId); return;
  }
  const adminFilter = event.target.closest?.("[data-admin-filter]");
  if (adminFilter) {
    event.preventDefault(); event.stopImmediatePropagation();
    state.adminFilter = adminFilter.dataset.adminFilter; render(); await loadAdmin(); return;
  }
  const removeAd = event.target.closest?.("[data-delete-ad]");
  if (removeAd) {
    event.preventDefault(); event.stopImmediatePropagation();
    try { await apiRequest(`listings/${Number(removeAd.dataset.deleteAd)}`, { method: "DELETE" }); toast("Annonce supprimée."); await loadMyAds(); }
    catch (error) { showApiError(error); }
    return;
  }
  const loginLabel = event.target.closest?.(".login-label");
  if (loginLabel && state.currentUser) {
    event.preventDefault(); event.stopImmediatePropagation();
    try { await apiRequest("auth/logout", { method: "POST", body: "{}" }); state.currentUser = null; state.csrf = null; state.favorites.clear(); toast("Vous êtes déconnecté."); go("home"); await refreshListings(); }
    catch (error) { showApiError(error); }
    return;
  }
  const fav = event.target.closest?.("[data-fav]");
  if (fav) {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!state.currentUser) return go("login");
    try {
      const id = Number(fav.dataset.fav);
      if (state.favorites.has(id)) { await apiRequest(`favorites/${id}`, { method: "DELETE" }); state.favorites.delete(id); }
      else { await apiRequest(`favorites/${id}`, { method: "POST" }); state.favorites.add(id); }
      render();
    } catch (error) { showApiError(error); }
    return;
  }
  if (event.target.closest?.("#contact-seller")) {
    event.preventDefault(); event.stopImmediatePropagation();
    const item = getListing(currentRoute().id);
    if (!state.currentUser) return go("login");
    try { const result = await apiRequest("conversations", { method: "POST", body: JSON.stringify({ annonce_id: item.id }) }); state.conversationId = result.conversation_id; go("messages"); }
    catch (error) { showApiError(error); }
  }
  const moderation = event.target.closest?.("[data-moderate]");
  if (moderation) {
    event.preventDefault(); event.stopImmediatePropagation();
    const row = moderation.closest(".match-row"); const adId = Number(row?.dataset?.id);
    if (!adId) return toast("Actualisez la liste de modération.");
    try { await apiRequest(`admin/listings/${adId}`, { method: "PATCH", body: JSON.stringify({ status: moderation.dataset.moderate === "validé" ? "approved" : "rejected" }) }); await loadAdmin(); }
    catch (error) { showApiError(error); }
  }
}, true);
async function loadAdmin() {
  const status = state.adminFilter === "En attente" ? "pending" : state.adminFilter === "Validées" ? "approved" : state.adminFilter === "Refusées" ? "rejected" : "all";
  try {
    const { listings: rows } = await apiRequest(`admin/listings?status=${status}`);
    const host = $("#moderation-list"); if (!host) return;
    host.innerHTML = rows.map(row => {
      const item = liveListing(row);
      return `<div class="match-row" data-id="${item.id}"><div class="mini-visual">${item.emoji}</div><div><span class="pill">${escapeHTML(item.type)}</span><strong style="display:block;margin-top:6px">${escapeHTML(item.title)}</strong><div class="price">${money(item.price)}</div><div class="meta">📍 ${escapeHTML(item.city)} · ${escapeHTML(item.seller)}</div></div><div><span class="pill">${escapeHTML(row.status)}</span><div class="actions" style="margin-top:10px"><button class="btn btn-primary" data-moderate="validé">Valider</button><button class="btn btn-danger" data-moderate="refusé">Refuser</button></div></div></div>`;
    }).join("") || `<div class="empty">Aucune annonce à modérer.</div>`;
  } catch (error) { showApiError(error); }
}
async function loadMyAds() {
  if (!state.currentUser) return;
  try {
    const { listings: rows } = await apiRequest("me/listings");
    const items = rows.map(liveListing);
    const host = $("main.container"); if (!host) return;
    host.innerHTML = `<div class="section-heading"><div>${pageTitle("Mes annonces", "Gérez vos annonces et consultez leur statut.")}</div><a href="#/publish" class="btn btn-primary">＋ Publier une annonce</a></div><div class="panel"><h2>${escapeHTML(state.currentUser.full_name)}</h2><p>${items.length} annonce(s)</p></div><div class="tabs"><button class="tab active" data-myads="all">Toutes</button><button class="tab" data-myads="active">Actives</button><button class="tab" data-myads="pending">En attente</button><button class="tab" data-myads="done">Terminées</button></div><div id="my-ad-list">${items.map(x => `<div class="match-row"><div class="mini-visual">${x.emoji}</div><div><a href="#/detail/${x.id}"><strong>${escapeHTML(x.title)}</strong></a><div class="price">${money(x.price)}</div><div class="meta">${escapeHTML(x.city)} · ${escapeHTML(x.status)}</div></div><button class="btn btn-danger" data-delete-ad="${x.id}">Supprimer</button></div>`).join("") || `<div class="empty">Vous n’avez pas encore publié d’annonce.</div>`}</div>`;
    $$('[data-myads]').forEach(button => button.addEventListener("click", () => {
      const filter = button.dataset.myads;
      const shown = items.filter(x => filter === "all" || (filter === "active" && x.status === "approved") || (filter === "pending" && x.status === "pending") || (filter === "done" && ["sold", "archived", "rejected"].includes(x.status)));
      $("#my-ad-list").innerHTML = shown.map(x => `<div class="match-row"><div class="mini-visual">${x.emoji}</div><div><a href="#/detail/${x.id}"><strong>${escapeHTML(x.title)}</strong></a><div class="price">${money(x.price)}</div><div class="meta">${escapeHTML(x.city)} · ${escapeHTML(x.status)}</div></div><button class="btn btn-danger" data-delete-ad="${x.id}">Supprimer</button></div>`).join("") || `<div class="empty">Aucune annonce dans cette catégorie.</div>`;
    }));
  } catch (error) { showApiError(error); }
}
async function loadConversation(id) {
  try {
    const { messages } = await apiRequest(`conversations/${Number(id)}/messages`);
    const host = $("#messages"); if (!host) return;
    host.innerHTML = messages.map(message => `<div class="bubble ${Number(message.sender_id) === Number(state.currentUser?.id) ? "mine" : ""}">${escapeHTML(message.message_text)}</div>`).join("") || `<p class="meta">Aucun message pour le moment.</p>`;
    host.scrollTop = host.scrollHeight;
  } catch (error) { showApiError(error); }
}
const originalMessagesPage = messagesPage;
messagesPage = function() {
  originalMessagesPage();
  if (!state.currentUser) return;
  apiRequest("conversations").then(({ conversations }) => {
    const list = $(".chat-list"); if (!list) return;
    list.innerHTML = `<h3>Conversations</h3>${conversations.map(item => `<div class="chat-person ${Number(item.id) === Number(state.conversationId) ? "active" : ""}" data-conversation="${Number(item.id)}"><strong>${escapeHTML(Number(item.buyer_id) === Number(state.currentUser.id) ? item.seller : item.buyer)}</strong><div class="meta">${escapeHTML(item.title)}</div></div>`).join("") || `<p class="meta">Vous n’avez pas encore de conversation.</p>`}`;
    const selected = conversations.find(item => Number(item.id) === Number(state.conversationId)) || conversations[0];
    if (selected) {
      state.conversationId = Number(selected.id);
      const title = $(".chat-head"); if (title) title.textContent = selected.title;
      loadConversation(selected.id);
    }
  }).catch(showApiError);
};
document.addEventListener("submit", async event => {
  const form = event.target;
  const id = form.id;
  const liveForm = ["auth-form", "publish-form", "comment-form", "message-form", "alert-form", "forgot-form", "reset-form", "filter-form", "results-search", "hero-search", "nav-search"].includes(id);
  if (!liveForm) return;
  event.preventDefault(); event.stopImmediatePropagation();
  try {
    const fd = new FormData(form);
    if (["auth-form", "publish-form", "comment-form", "message-form", "alert-form", "forgot-form", "reset-form"].includes(id)) {
      let result;
      if (id === "auth-form") {
        if (fd.has("confirm") && fd.get("password") !== fd.get("confirm")) throw new Error("Les mots de passe ne correspondent pas.");
        const register = fd.has("name");
        result = await apiRequest(`auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify(register ? { name: fd.get("name"), email: fd.get("email"), password: fd.get("password") } : { email: fd.get("email"), password: fd.get("password") }) });
        state.currentUser = result.user; state.csrf = result.csrf; toast("Connexion réussie."); location.assign("/account.html"); return;
      }
      if (id === "publish-form") {
        const payload = new FormData(form);
        payload.set("type", form.dataset.type === "Je recherche" ? "wanted" : "sale");
        result = await apiRequest("listings", { method: "POST", body: payload });
        toast("Annonce envoyée. Elle sera visible après modération."); await refreshListings(); go("my-ads"); return;
      }
      if (id === "comment-form") { await apiRequest(`listings/${currentRoute().id}/comments`, { method: "POST", body: JSON.stringify({ comment: fd.get("comment") }) }); toast("Commentaire publié."); render(); return; }
      if (id === "message-form") {
        const conv = state.conversationId || Number(new URLSearchParams(location.search).get("conversation"));
        if (!conv) throw new Error("Choisissez une conversation pour envoyer un message.");
        await apiRequest(`conversations/${conv}/messages`, { method: "POST", body: JSON.stringify({ message: fd.get("message") }) }); toast("Message envoyé."); form.reset(); await loadConversation(conv); return;
      }
      if (id === "alert-form") { await apiRequest("alerts", { method: "POST", body: JSON.stringify({ query: fd.get("query"), city: fd.get("city"), max_price: fd.get("budget") || null }) }); toast("Alerte créée."); return; }
      if (id === "forgot-form") { await apiRequest("auth/forgot", { method: "POST", body: JSON.stringify({ email: fd.get("email") }) }); }
      if (id === "reset-form") throw new Error("La réinitialisation par e-mail n’est pas encore configurée.");
    }
    if (id === "filter-form") { state.category = fd.get("category"); state.type = fd.get("type"); state.sort = fd.get("sort"); await loadSearch(); return; }
    if (["results-search", "hero-search", "nav-search"].includes(id)) { state.query = String(fd.get("q") || "").trim(); go("search"); await loadSearch(); }
  } catch (error) { showApiError(error); }
}, true);
async function loadSearch() {
  const query = new URLSearchParams({ q: state.query || "", category: categories.find(x => x === state.category) ? state.category.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-").replace("&-", "") : "", type: state.type === "À vendre" ? "sale" : state.type === "Je recherche" ? "wanted" : "", sort: state.sort === "Prix croissant" ? "price_asc" : state.sort === "Prix décroissant" ? "price_desc" : "" });
  try { const result = await apiRequest(`listings?${query}`); listings.splice(0, listings.length, ...result.listings.map(liveListing)); render(); }
  catch (error) { showApiError(error); }
}
const originalDetailPage = detailPage;
detailPage = function(id) {
  originalDetailPage(id);
  const item = getListing(id);
  const image = item.images?.[0]?.image_url;
  const visual = $(".product-visual");
  if (visual && image) visual.innerHTML = `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.title)}" style="max-width:100%;max-height:100%;object-fit:contain">`;
  if (state.currentUser) apiRequest(`listings/${Number(id)}/comments`).then(({ comments }) => {
    if (currentRoute().page !== "detail" || currentRoute().id !== String(id)) return;
    const form = $("#comment-form");
    if (form) {
      const heading = form.parentElement.querySelector("h2");
      if (heading) heading.textContent = `Commentaires (${comments.length})`;
      form.insertAdjacentHTML("beforebegin", comments.map(comment => `<div class="comment"><strong>${escapeHTML(comment.user)}</strong><p style="margin:0">${escapeHTML(comment.comment_text)}</p></div>`).join(""));
    }
  }).catch(showApiError);
};
async function startBackend() {
  if (location.protocol === "file:") {
    toast("Mode aperçu : ouvrez l’application par FrankenPHP pour activer PHP, SQL et Cloudinary.");
    return;
  }
  try {
    try { await refreshCategories(); }
    catch (error) { console.error("Could not load SQL categories:", error); toast(`Catégories SQL indisponibles : ${error.message}`); }
    const session = await apiRequest("auth/me"); state.currentUser = session.user; state.csrf = session.csrf;
    await refreshListings();
    if (currentRoute().page === "admin" && state.currentUser?.role === "admin") await loadAdmin();
    if (currentRoute().page === "my-ads" && state.currentUser) await loadMyAds();
  } catch (error) { listings.splice(0, listings.length); render(); toast(`API QuickAnnonces : ${error.message}`); }
}
startBackend();
window.addEventListener("hashchange", () => {
  setTimeout(() => {
    if (currentRoute().page === "my-ads" && state.currentUser) loadMyAds();
    if (currentRoute().page === "admin" && state.currentUser?.role === "admin") loadAdmin();
  }, 0);
});
