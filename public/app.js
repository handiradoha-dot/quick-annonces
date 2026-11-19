/* QuickAnnonces — front-end
   Navigation par hash ; les données viennent de l'API PHP (/api/...). */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $("#app");
const state = {
  query: "",
  category: "Toutes les catégories",
  type: "Tous",
  sort: "Plus récent",
  favorites: new Set(),
  messages: [],
  comments: [],
  conversations: [],
  alerts: [],
  adminFilter: "pending",
  searchResults: null,
  apiStatus: "loading",
  categoryStatus: "loading",
  apiError: ""
};

const listings = [];
const categories = [];
const categorySlugs = new Map();
const money = n => new Intl.NumberFormat("fr-MA").format(n) + " MAD";
const getListing = id => listings.find(item => item.id === Number(id)) || null;
const loginPrompt = text => `<div class="empty">${escapeHTML(text)}<p><a href="./login.html" class="btn btn-primary">Se connecter</a></p></div>`;
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
  return `<footer class="footer"><div class="footer-inner"><a class="logo" href="#/home"><span class="logo-mark">Q</span>QuickAnnonces</a><span>Achetez, vendez et trouvez près de chez vous.</span><span>© 2026 QuickAnnonces</span></div></footer>`;
}
function shell(content, active = "") { app.innerHTML = header(active) + `<main class="container">${content}</main>` + footer(); bindGlobal(); }
function listingCard(item) {
  const saved = state.favorites.has(item.id);
  const cover = item.images?.[0]?.image_url;
  return `<article class="listing">
    <div class="listing-image"><span class="pill">${escapeHTML(item.type)}</span><button class="heart ${saved ? "saved" : ""}" data-fav="${item.id}" aria-label="Ajouter aux favoris">${saved ? "♥" : "♡"}</button>${cover ? `<img src="${escapeHTML(cover)}" alt="${escapeHTML(item.title)}">` : `<span>${escapeHTML(item.emoji)}</span>`}</div>
    <a class="listing-body" href="#/detail/${item.id}"><h3>${escapeHTML(item.title)}</h3><div class="price">${money(item.price)}</div><div class="meta">📍 ${escapeHTML(item.city)} · ${escapeHTML(item.age)}</div></a>
  </article>`;
}
function cards(items, cls = "") {
  if (!items.length) {
    const message = state.apiStatus === "loading"
      ? "Chargement des annonces depuis la base de données…"
      : state.apiStatus === "error"
        ? "Les annonces sont indisponibles. Vérifiez la connexion au serveur."
        : "Aucune annonce enregistrée pour le moment.";
    return `<div class="empty">${escapeHTML(message)}</div>`;
  }
  return `<div class="grid ${cls}">${items.map(listingCard).join("")}</div>`;
}
function pageTitle(title, subtitle = "") { return `<div class="page-title"><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div>`; }

function homePage() {
  shell(`<section class="hero">
    <div><span class="eyebrow">Bienvenue sur QuickAnnonces</span><h1>Trouvez. Publiez.<br>Connectez-vous.</h1>
    <p>Des annonces de vente et de recherche, avec des personnes réelles. Achetez, vendez ou recherchez facilement près de chez vous.</p>
    <form class="searchbar" id="hero-search"><input name="q" placeholder="🔎 Que recherchez-vous ?" aria-label="Que recherchez-vous ?"><button class="btn btn-primary">Rechercher</button></form>
    <div class="actions" style="margin-top:16px"><a class="btn btn-outline" href="#/search">Explorer les annonces</a><a class="btn btn-soft" href="#/publish">＋ Publier une annonce</a></div></div>
    <div class="hero-art"><div class="art-card"><div class="art-visual">🛍️</div><strong>Une bonne affaire près de vous</strong><small>Des annonces simples, des contacts directs.</small></div></div>
  </section>
  <section class="section"><div class="section-heading"><div><h2>Annonces récentes</h2><p>Découvrez les dernières annonces près de chez vous.</p></div><a class="text-link" href="#/search">Voir toutes les annonces →</a></div>${cards(listings.slice(0, 4))}</section>
  <section class="section"><div class="section-heading"><div><h2>Autres annonces</h2><p>Les annonces disponibles dans la base de données.</p></div></div>${cards(listings.slice(4, 8))}</section>
  <section class="section panel"><div class="two-col"><div><span class="eyebrow">QuickMatch ✨</span><h2>Votre recherche, en plus simple</h2><p>Décrivez ce que vous cherchez et découvrez les annonces les plus pertinentes.</p></div><div class="actions" style="align-items:center;justify-content:flex-end"><a class="btn btn-primary" href="#/find-for-me">Trouver pour moi ✨</a><a class="btn btn-outline" href="#/quickmatch">Découvrir QuickMatch</a></div></div></section>`, "home");
}
function searchPage() {
  const q = new URLSearchParams(location.search).get("q") || state.query;
  // The server already applies the search, filters and sort; until a search
  // has run, show every approved listing.
  const results = state.searchResults || listings;
  shell(`<div class="layout"><aside class="panel filters"><h3>Filtres</h3><form id="filter-form">
    <div class="field"><label for="category">Catégorie</label><select id="category" name="category"><option>Toutes les catégories</option>${categories.map(c=>`<option ${state.category===c?"selected":""}>${escapeHTML(c)}</option>`).join("")}</select>${state.categoryStatus === "error" ? `<small class="meta">Impossible de charger les catégories depuis le serveur.</small>` : ""}</div>
    <div class="field"><label for="type">Type d’annonce</label><select id="type" name="type"><option>Tous</option><option ${state.type==="À vendre"?"selected":""}>À vendre</option><option ${state.type==="Je recherche"?"selected":""}>Je recherche</option></select></div>
    <div class="field"><label for="sort">Trier par</label><select id="sort" name="sort"><option>Plus récent</option><option ${state.sort==="Prix croissant"?"selected":""}>Prix croissant</option><option ${state.sort==="Prix décroissant"?"selected":""}>Prix décroissant</option></select></div>
    <button class="btn btn-primary btn-block">Appliquer les filtres</button><button type="button" class="btn btn-outline btn-block" id="reset-filters" style="margin-top:8px">Réinitialiser</button></form></aside>
    <section><div class="section-heading"><div><h1>Recherche d’annonces</h1><p>${results.length} annonce(s) trouvée(s)</p></div></div>
    <form class="searchbar" id="results-search"><input name="q" value="${escapeHTML(q)}" placeholder="Rechercher une annonce..."><button class="btn btn-primary">Rechercher</button></form>
    <div class="grid three" style="margin-top:20px">${results.map(listingCard).join("") || `<div class="empty"><div class="emoji">🔎</div><h3>Aucune annonce trouvée</h3><p>Essayez de modifier vos critères de recherche.</p></div>`}</div></section></div>`, "search");
}
function detailPage(id) {
  shell(`<div id="listing-detail" class="empty">Chargement de l’annonce depuis la base de données…</div>`);
  if (state.apiStatus === "ready") loadListingDetail(id);
}

async function loadListingDetail(id) {
  try {
    const { listing: row } = await apiRequest(`listings/${Number(id)}`);
    const item = liveListing(row);
    const { comments } = await apiRequest(`listings/${Number(id)}/comments`);
    if (currentRoute().page !== "detail" || currentRoute().id !== String(id)) return;

    const host = $("#listing-detail");
    if (!host) return;
    host.outerHTML = `<div id="listing-detail" class="breadcrumb"><a href="#/home">Accueil</a> / <a href="#/search">${escapeHTML(item.category)}</a> / ${escapeHTML(item.title)}</div>
      <div class="detail-layout"><section><div class="product-visual">${item.images?.[0]?.image_url ? `<img src="${escapeHTML(item.images[0].image_url)}" alt="${escapeHTML(item.title)}">` : "📦"}</div>
      <div class="panel section"><h2>Description</h2><p>${escapeHTML(item.description)}</p><div class="meta">État : ${escapeHTML(item.condition)} · Catégorie : ${escapeHTML(item.category)} · 📍 ${escapeHTML(item.city)}</div></div>
      <div class="panel section"><h2>Commentaires (${comments.length})</h2>${comments.map(comment => `<div class="comment"><strong>${escapeHTML(comment.user)}</strong><p>${escapeHTML(comment.comment_text)}</p></div>`).join("") || `<p class="empty">Aucun commentaire pour le moment.</p>`}
      ${state.currentUser ? `<form id="comment-form" class="section"><div class="field"><label for="comment">Ajouter un commentaire</label><textarea id="comment" name="comment" required></textarea></div><button class="btn btn-primary">Publier le commentaire</button></form>` : `<p><a class="text-link" href="./login.html">Connectez-vous pour commenter.</a></p>`}</div></section>
      <aside class="panel product-info"><span class="pill">${escapeHTML(item.type)}</span><h1>${escapeHTML(item.title)}</h1><div class="price">${money(item.price)}</div><p>${escapeHTML(item.condition)} · ${escapeHTML(item.category)}</p><div class="notice">📍 ${escapeHTML(item.city)} · ${escapeHTML(item.age)}</div><div class="actions"><button class="btn btn-primary" id="contact-seller">💬 Contacter</button><button class="btn btn-outline" data-fav="${item.id}">${state.favorites.has(item.id) ? "♥ Favoris" : "♡ Favoris"}</button></div><div class="section"><h3>Vendeur</h3><div class="profile-head"><div class="avatar">${escapeHTML(profileInitials(item.seller))}</div><strong>${escapeHTML(item.seller)}</strong></div></div></aside></div>`;
  } catch (error) {
    const host = $("#listing-detail");
    if (host) host.innerHTML = `<div class="empty">${escapeHTML(error.message)}</div>`;
  }
}
function publishPage() {
  if (!state.currentUser && state.apiStatus !== "loading") return shell(`${pageTitle("Créer une nouvelle annonce")}${loginPrompt("Connectez-vous pour publier une annonce.")}`);
  shell(`<div style="max-width:820px;margin:auto">${pageTitle("Créer une nouvelle annonce", "Choisissez le type d’annonce et complétez les informations.")}
  <div class="two-col section"><button class="panel type-choice" data-type="À vendre" style="text-align:left"><span class="eyebrow">À vendre</span><h2>Je souhaite vendre</h2><p>Je souhaite vendre un article, un bien ou un service.</p><span class="btn btn-outline">Choisir</span></button><button class="panel type-choice" data-type="Je recherche" style="text-align:left"><span class="eyebrow">Je recherche</span><h2>Je recherche</h2><p>Je recherche un article, un bien ou un service.</p><span class="btn btn-outline">Choisir</span></button></div>
  <form id="publish-form" class="panel section"><h2>Informations de l’annonce</h2><div class="field"><label for="ad-title">Titre de l’annonce</label><input id="ad-title" name="title" placeholder="Ex : iPhone 13 en très bon état" required></div>
  <div class="two-col"><div class="field"><label>Catégorie</label><select name="category" required ${state.categoryStatus !== "ready" ? "disabled" : ""}><option value="">${state.categoryStatus === "loading" ? "Chargement des catégories..." : state.categoryStatus === "error" ? "Catégories indisponibles" : "Sélectionner une catégorie"}</option>${categories.map(c=>`<option>${escapeHTML(c)}</option>`).join("")}</select>${state.categoryStatus === "error" ? `<small class="meta">Vérifiez la connexion à Aiven et rechargez la page.</small>` : ""}</div><div class="field"><label>Prix en MAD</label><input name="price" type="number" min="0" placeholder="Prix en MAD" required></div></div>
  <div class="two-col"><div class="field"><label>Localisation</label><select name="city"><option>Tanger</option><option>Tétouan</option><option>Rabat</option><option>Casablanca</option><option>Fès</option><option>Marrakech</option></select></div><div class="field"><label>État</label><select name="condition"><option>Neuf</option><option>Très bon état</option><option>Bon état</option><option>État correct</option></select></div></div>
  <div class="field"><label>Description</label><textarea name="description" placeholder="Décrivez votre annonce..." required></textarea></div><div class="field"><label>Photos (JPG, PNG ou WebP, 8 Mo max, 5 photos max)</label><input name="images[]" type="file" accept="image/jpeg,image/png,image/webp" multiple></div>
  <div class="actions"><button class="btn btn-primary">Publier l’annonce</button><a class="btn btn-outline" href="#/my-ads">Annuler</a></div><p class="small">Votre annonce sera visible après validation par un administrateur.</p></form></div>`);
}
function myAdsPage() {
  if (!state.currentUser && state.apiStatus !== "loading") return shell(`${pageTitle("Mes annonces")}${loginPrompt("Connectez-vous pour gérer vos annonces.")}`, "my-ads");
  shell(`<div id="my-listings">${pageTitle("Mes annonces", "Vos annonces enregistrées dans la base de données.")}<div class="empty">Chargement…</div></div>`, "my-ads");
}
function favoritesPage() {
  const items = listings.filter(x => state.favorites.has(x.id));
  const content = state.apiStatus !== "ready"
    ? `<div class="empty">${state.apiStatus === "loading" ? "Chargement…" : "Les favoris sont indisponibles."}</div>`
    : !state.currentUser
      ? `<div class="empty">Connectez-vous pour consulter vos favoris.<p><a href="./login.html" class="btn btn-primary">Se connecter</a></p></div>`
      : items.length
        ? cards(items)
        : `<div class="empty">Aucun favori enregistré pour le moment.</div>`;
  shell(`${pageTitle("Mes favoris", "Retrouvez ici les annonces que vous avez enregistrées.")}${content}`);
}
function messagesPage() {
  if (!state.currentUser && state.apiStatus !== "loading") return shell(`${pageTitle("Messages")}${loginPrompt("Connectez-vous pour consulter vos messages.")}`);
  shell(`<div class="page-title"><h1>Messages</h1><p>Échangez directement avec les vendeurs et les acheteurs.</p></div>
  <div class="panel chat-layout"><aside class="chat-list" id="conversation-list"><p>Chargement…</p></aside>
  <section class="chat-window"><div class="chat-head" id="conversation-title">Choisissez une conversation</div><div class="messages" id="messages"><p class="empty">Vos messages apparaîtront ici.</p></div>
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
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Un nouveau départ</h1><p>Choisissez un nouveau mot de passe sécurisé.</p></aside><section class="auth-form"><h2>Créer un nouveau mot de passe</h2><form id="reset-form"><input type="hidden" name="token" value="${escapeHTML(currentRoute().id)}"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" required minlength="10"></div><div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" required minlength="10"></div><button class="btn btn-primary btn-block">Réinitialiser le mot de passe</button></form></section></div>`);
}
function quickmatchPage() {
  shell(`${pageTitle("QuickMatch ✨", "Les recommandations personnalisées ne sont pas encore connectées aux données de votre compte.")}<div class="panel"><p>Utilisez la recherche d’annonces pour consulter les résultats enregistrés dans la base de données.</p><a class="btn btn-primary" href="#/search">Rechercher des annonces</a></div>`);
}
function findForMePage() {
  shell(`${pageTitle("Trouver pour moi ✨", "Cette fonction de recommandation n’est pas encore connectée à la base de données.")}<div class="panel"><p>Vous pouvez rechercher les annonces actuellement enregistrées.</p><a class="btn btn-primary" href="#/search">Voir les annonces</a></div>`);
}
function alertsPage() {
  if (!state.currentUser && state.apiStatus !== "loading") return shell(`${pageTitle("Mes alertes")}${loginPrompt("Connectez-vous pour gérer vos alertes.")}`);
  shell(`${pageTitle("Mes alertes", "Les alertes ci-dessous sont chargées depuis votre compte.")}<div class="two-col"><section class="panel"><h2>Alertes enregistrées</h2><div id="saved-alerts" class="empty">Chargement…</div></section><section class="panel"><h2>Créer une alerte</h2><form id="alert-form"><div class="field"><label for="alert-query">Recherche</label><input id="alert-query" name="query" required></div><div class="field"><label for="alert-budget">Budget maximum (DH)</label><input id="alert-budget" name="budget" type="number" min="0"></div><div class="field"><label for="alert-city">Ville</label><input id="alert-city" name="city"></div><button class="btn btn-primary">Enregistrer l’alerte</button></form></section></div>`);
}
function comparePage() {
  shell(`${pageTitle("Comparer les annonces", "La comparaison automatique n’est pas encore connectée aux données enregistrées.")}<div class="panel"><a class="btn btn-primary" href="#/search">Choisir une annonce</a></div>`);
}
function securityPage() {
  shell(`${pageTitle("Sécurité & confiance 🛡️", "Les vérifications de profil et les avis ne sont pas encore connectés à la base de données.")}<div class="panel"><p>QuickAnnonces ne confirme actuellement ni l’identité ni le téléphone des membres.</p></div>`);
}
function dashboardPage() {
  if (!state.currentUser && state.apiStatus !== "loading") return shell(`${pageTitle("Mon compte")}${loginPrompt("Connectez-vous pour accéder à votre compte.")}`);
  const greeting = state.currentUser ? `Bonjour ${escapeHTML(state.currentUser.full_name)} 👋` : "Mon compte";
  shell(`${pageTitle(greeting, "Consultez les données enregistrées sur votre compte.")}<div class="panel"><p>Les statistiques du tableau de bord ne sont pas encore calculées à partir de la base de données.</p><div class="actions"><a class="btn btn-primary" href="#/my-ads">Mes annonces</a><a class="btn btn-outline" href="#/favorites">Mes favoris</a><a class="btn btn-outline" href="#/messages">Messages</a><a class="btn btn-outline" href="#/alerts">Alertes</a></div></div>`);
}
function adminPage() {
  const content = !state.currentUser
    ? `<div class="empty">Connectez-vous avec un compte administrateur.</div>`
    : state.currentUser.role !== "admin"
      ? `<div class="empty">Accès réservé aux administrateurs.</div>`
      : `<div class="panel"><div class="section-heading"><h2>Annonces à modérer</h2><span class="pill">Données du serveur</span></div><div class="tabs">${[["pending", "En attente"], ["approved", "Validées"], ["rejected", "Refusées"], ["all", "Toutes"]].map(([value, label]) => `<button class="tab ${state.adminFilter === value ? "active" : ""}" data-admin-filter="${value}">${label}</button>`).join("")}</div><div id="moderation-list" class="empty">Chargement…</div></div>`;
  shell(`${pageTitle("Administration", "Les annonces ci-dessous sont chargées depuis le serveur.")}${content}`);
}
function sellerPage() {
  shell(`${pageTitle("Profil vendeur", "Les profils publics et évaluations ne sont pas encore connectés à la base de données.")}<div class="panel"><a class="btn btn-primary" href="#/search">Voir les annonces</a></div>`);
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
  $$('[data-type]').forEach(button => {
    button.addEventListener("click", () => {
      const form = $("#publish-form");
      if (!form) return;
      form.dataset.type = button.dataset.type;
      $$('[data-type]').forEach(option => {
        option.classList.toggle("selected", option === button);
      });
    });
  });

  $$('[data-reply]').forEach(button => {
    button.addEventListener("click", () => {
      const commentField = $("#comment");
      if (!commentField) return;
      commentField.value = "@" + button.dataset.reply + " ";
      commentField.focus();
    });
  });
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
  if (location.protocol === "file:") {
    throw new Error("Cette action nécessite le serveur PHP. Ouvrez QuickAnnonces via FrankenPHP pour vous connecter.");
  }
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
// Background data loads redraw the page, but not on sign-in forms, where a
// redraw would wipe what the user is typing.
function rerender() { if (!["login", "register", "forgot", "reset"].includes(currentRoute().page)) render(); }
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
    state.apiStatus = "ready";
    const favs = state.currentUser ? await apiRequest("favorites") : { listings: [] };
    state.favorites = new Set((favs.listings || []).map(x => Number(x.id)));
    rerender();
  } catch (error) {
    state.backendReady = false;
    state.apiStatus = "error";
    listings.splice(0, listings.length);
    rerender();
    console.error("Could not load listings from the API:", error);
    toast(`Annonces indisponibles : ${error.message}`);
  }
}
async function refreshCategories() {
  const { categories: rows } = await apiRequest("categories");
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row.name !== "string" || typeof row.slug !== "string")) {
    throw new Error("La liste des catégories est invalide.");
  }
  categories.splice(0, categories.length, ...rows.map(row => String(row.name)));
  categorySlugs.clear();
  rows.forEach(row => categorySlugs.set(String(row.name), String(row.slug)));
  state.categoryStatus = "ready";
  rerender();
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
  if (event.target.closest?.("#reset-filters")) {
    event.preventDefault(); event.stopImmediatePropagation();
    Object.assign(state, { query: "", category: "Toutes les catégories", type: "Tous", sort: "Plus récent", searchResults: null });
    render(); return;
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
    if (!state.currentUser) return go("login");
    try { const result = await apiRequest("conversations", { method: "POST", body: JSON.stringify({ annonce_id: Number(currentRoute().id) }) }); state.conversationId = result.conversation_id; go("messages"); }
    catch (error) { showApiError(error); }
  }
  const moderation = event.target.closest?.("[data-moderate]");
  if (moderation) {
    event.preventDefault(); event.stopImmediatePropagation();
    const row = moderation.closest(".match-row"); const adId = Number(row?.dataset?.id);
    if (!adId) return toast("Actualisez la liste de modération.");
    try { await apiRequest(`admin/listings/${adId}`, { method: "PATCH", body: JSON.stringify({ status: moderation.dataset.moderate === "validé" ? "approved" : "rejected" }) }); toast(moderation.dataset.moderate === "validé" ? "Annonce validée." : "Annonce refusée."); await refreshListings(); await loadAdmin(); }
    catch (error) { showApiError(error); }
  }
}, true);
async function loadAdmin() {
  const status = ["pending", "approved", "rejected", "all"].includes(state.adminFilter) ? state.adminFilter : "pending";
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
        state.currentUser = result.user; state.csrf = result.csrf; toast(register ? "Compte créé." : "Connexion réussie."); location.assign("./account.html"); return;
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
      if (id === "alert-form") { await apiRequest("alerts", { method: "POST", body: JSON.stringify({ query: fd.get("query"), city: fd.get("city"), max_price: fd.get("budget") || null }) }); toast("Alerte créée."); form.reset(); await loadAlerts(); return; }
      if (id === "forgot-form") {
        await apiRequest("auth/forgot", { method: "POST", body: JSON.stringify({ email: fd.get("email") }) });
        form.innerHTML = `<div class="notice">Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient d’être envoyé. Le lien est valable 1 heure.</div>`;
        return;
      }
      if (id === "reset-form") {
        if (fd.get("password") !== fd.get("confirm")) throw new Error("Les mots de passe ne correspondent pas.");
        if (!fd.get("token")) throw new Error("Ce lien de réinitialisation est invalide. Demandez un nouveau lien.");
        await apiRequest("auth/reset", { method: "POST", body: JSON.stringify({ token: fd.get("token"), password: fd.get("password") }) });
        toast("Mot de passe modifié. Vous pouvez vous connecter."); go("login"); return;
      }
    }
    if (id === "filter-form") { state.category = fd.get("category"); state.type = fd.get("type"); state.sort = fd.get("sort"); await loadSearch(); return; }
    if (["results-search", "hero-search", "nav-search"].includes(id)) { state.query = String(fd.get("q") || "").trim(); go("search"); await loadSearch(); }
  } catch (error) { showApiError(error); }
}, true);
async function loadSearch() {
  const query = new URLSearchParams({ q: state.query || "", category: categorySlugs.get(state.category) || "", type: state.type === "À vendre" ? "sale" : state.type === "Je recherche" ? "wanted" : "", sort: state.sort === "Prix croissant" ? "price_asc" : state.sort === "Prix décroissant" ? "price_desc" : "" });
  try { const result = await apiRequest(`listings?${query}`); state.searchResults = result.listings.map(liveListing); render(); }
  catch (error) { showApiError(error); }
}
async function loadAlerts() {
  const host = $("#saved-alerts"); if (!host || !state.currentUser) return;
  try {
    const { alerts } = await apiRequest("alerts");
    host.className = "";
    host.innerHTML = alerts.map(alert => `<div class="match-row"><div><strong>${escapeHTML(alert.search_query)}</strong><div class="meta">${alert.city ? "📍 " + escapeHTML(alert.city) : "Toutes les villes"}${alert.max_price ? " · max " + money(Number(alert.max_price)) : ""}</div></div></div>`).join("") || `<div class="empty">Aucune alerte enregistrée.</div>`;
  } catch (error) { showApiError(error); }
}
async function startBackend() {
  if (location.protocol === "file:") {
    state.apiStatus = "error";
    state.categoryStatus = "error";
    render();
    toast("Ouvrez QuickAnnonces via FrankenPHP pour charger les données d’Aiven.");
    return;
  }
  try { await refreshCategories(); }
  catch (error) {
    categories.splice(0, categories.length);
    categorySlugs.clear();
    state.categoryStatus = "error";
    render();
    console.error("Could not load categories from Aiven:", error);
    toast(`Catégories Aiven indisponibles : ${error.message}`);
  }
  try {
    const session = await apiRequest("auth/me"); state.currentUser = session.user || null; state.csrf = session.csrf || null;
  } catch (error) {
    state.currentUser = null; state.csrf = null;
    console.error("Could not load the current session:", error);
  }
  await refreshListings();
  if (currentRoute().page === "admin" && state.currentUser?.role === "admin") await loadAdmin();
  if (currentRoute().page === "my-ads" && state.currentUser) await loadMyAds();
  if (currentRoute().page === "alerts" && state.currentUser) await loadAlerts();
}
startBackend();
window.addEventListener("hashchange", () => {
  setTimeout(() => {
    if (currentRoute().page === "my-ads" && state.currentUser) loadMyAds();
    if (currentRoute().page === "admin" && state.currentUser?.role === "admin") loadAdmin();
    if (currentRoute().page === "alerts" && state.currentUser) loadAlerts();
  }, 0);
});
