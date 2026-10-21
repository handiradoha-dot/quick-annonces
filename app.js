/* QuickAnnonces — front-end uniquement
   Pages HTML dédiées, données de démonstration et interactions locales.
   Aucune API / base de données n'est connectée. */
(() => {
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = $("#app");
function readStore(key, fallback) {
  try { const saved = localStorage.getItem(`qa-${key}`); return saved === null ? fallback : JSON.parse(saved); }
  catch { return fallback; }
}
function writeStore(key, value) {
  try { localStorage.setItem(`qa-${key}`, JSON.stringify(value)); return true; }
  catch { return false; }
}
const savedFavorites = readStore("favorites", []);
const state = {
  ...readStore("filters", { category: "Toutes les catégories", type: "Tous", sort: "Plus récent", query: "" }),
  favorites: new Set(Array.isArray(savedFavorites) ? savedFavorites : []),
  messages: readStore("messages", [
    { user: "Yasmine Benali", text: "Bonjour, est-ce que le téléphone est encore disponible ?", mine: false },
    { user: "Vous", text: "Oui, il est toujours disponible.", mine: true }
  ]),
  comments: readStore("comments", [
    { user: "Yasmine", text: "Est-ce que le téléphone est encore disponible ?" },
    { user: "Omar", text: "La livraison est-elle possible à Tétouan ?" }
  ]),
  adminFilter: "Toutes",
  adminQuery: ""
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
const legacyListings = (() => { try { return JSON.parse(localStorage.getItem("quickannonces-listings") || "null"); } catch { return null; } })();
const savedListings = readStore("listings", legacyListings);
// Ignore malformed local data instead of letting one bad entry stop every page
// from rendering during app initialization.
if (Array.isArray(savedListings)) {
  const validListings = savedListings.filter(item => item && typeof item === "object" && Number.isFinite(Number(item.id)));
  if (validListings.length === savedListings.length) listings.splice(0, listings.length, ...validListings);
}
listings.forEach(item => {
  if (!item.status || item.status === "Approuvee" || item.status === "Approuvée") item.status = "Approuvee";
  else if (item.status === "Refusee" || item.status === "Refusée") item.status = "Refusee";
});
function saveListings() { writeStore("listings", listings); }
if (Array.isArray(legacyListings) && !readStore("listings", null)) saveListings();
function saveFilters() { writeStore("filters", { category: state.category, type: state.type, sort: state.sort, query: state.query }); }
const categories = ["Immobilier", "Véhicules", "Électronique", "Mode", "Maison & Jardin", "Sports", "Services"];
const money = n => new Intl.NumberFormat("fr-MA").format(n) + " MAD";
const getListing = id => listings.find(item => item.id === Number(id)) || listings[0];
const statusText = status => ({ Approuvee: "Approuvée", Refusee: "Refusée" }[status] || status);
const icon = name => ({ home: "⌂", search: "⌕", heart: "♡", user: "♙", plus: "+" }[name] || "•");

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
function go(page, params = "") {
  const id = params.match(/^\/(\d+)/)?.[1];
  const query = page === "search" && state.query ? `?q=${encodeURIComponent(state.query)}` : id ? `?id=${id}` : "";
  location.href = `${page === "home" ? "index" : page}.html${query}`;
}
function currentRoute() {
  const page = location.pathname.split("/").pop().replace(/\.html$/, "") || "index";
  return { page: page === "index" ? "home" : page, id: new URLSearchParams(location.search).get("id") || "" };
}
function header(active = "") {
  const page = active || currentRoute().page;
  const activeLink = key => page === key ? ' class="active" aria-current="page"' : "";
  return `<header class="topbar"><nav class="nav">
    <a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a>
    <button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Ouvrir le menu">☰</button>
    <div class="navlinks" id="primary-nav">
      <a${activeLink("home")} href="index.html">Accueil</a>
      <a${activeLink("search")} href="search.html">Catégories</a>
      <a${activeLink("my-ads")} href="my-ads.html">Mes annonces</a>
      <a${activeLink("quickmatch")} href="quickmatch.html">QuickMatch ✨</a>
      <a${activeLink("favorites")} href="favorites.html">♡ Favoris</a>
      <a${activeLink("demo")} href="demo.html">Guide démo</a>
    </div>
    <form class="nav-search" id="nav-search"><input name="q" value="${escapeHTML(state.query)}" placeholder="Rechercher une annonce..." aria-label="Rechercher une annonce"></form>
    <div class="nav-actions"><a class="login-label text-link" href="login.html">Se connecter</a><a class="btn btn-primary" href="publish.html">＋ Publier</a></div>
  </nav></header>`;
}
function footer() {
  return `<footer class="footer"><div class="footer-inner"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><span>Achetez, vendez et trouvez près de chez vous.</span><span>© 2026 QuickAnnonces · Front-end de démonstration</span></div></footer>`;
}
function shell(content, active = "") { app.innerHTML = header(active) + `<main class="container">${content}</main>` + footer(); bindGlobal(); }
function listingCard(item) {
  const saved = state.favorites.has(item.id);
  return `<article class="listing">
    <div class="listing-image"><span class="pill">${item.type}</span><button class="heart ${saved ? "saved" : ""}" data-fav="${item.id}" aria-pressed="${saved}" aria-label="${saved ? "Retirer des favoris" : "Ajouter aux favoris"}">${saved ? "♥" : "♡"}</button>${item.image ? `<img src="${item.image}" alt="${escapeHTML(item.title)}">` : `<span>${item.emoji}</span>`}</div>
    <a class="listing-body" href="detail.html?id=${item.id}"><h3>${escapeHTML(item.title)}</h3><div class="price">${money(item.price)}${item.id === 3 ? "/mois" : ""}</div><div class="meta">📍 ${escapeHTML(item.city)} · ${escapeHTML(item.age)} ${item.verified ? "· ✓ Vérifié" : ""}</div></a>
  </article>`;
}
function cards(items, cls = "") { return `<div class="grid ${cls}">${items.filter(x => x.status === "Approuvee").map(listingCard).join("")}</div>`; }
function pageTitle(title, subtitle = "") { return `<div class="page-title"><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div>`; }

function matchRow(item, score) { return `<div class="match-row"><div class="mini-visual">${item.emoji}</div><div><strong>${item.title}</strong><div class="price">${money(item.price)}</div><div class="meta">Correspond à votre recherche</div></div><div class="match-score">${score}% MATCH<br><a class="text-link small" href="detail.html?id=${item.id}">Voir l’annonce</a></div></div>`; }
function escapeHTML(value = "") { return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[ch])); }

let activeRender = null;
function mountPage(page, renderer) { activeRender = renderer; activeRender(); }

function bindGlobal() {
  const navSearch = $("#nav-search");
  if (navSearch) navSearch.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(navSearch).get("q").trim(); saveFilters(); go("search"); });
  $("#menu-toggle")?.addEventListener("click", e => { const button = e.currentTarget; const open = button.getAttribute("aria-expanded") !== "true"; button.setAttribute("aria-expanded", String(open)); $("#primary-nav")?.classList.toggle("open", open); });
  $$("[data-fav]").forEach(btn => btn.addEventListener("click", e => {
    e.preventDefault(); e.stopPropagation();
    const id = Number(btn.dataset.fav);
    if (state.favorites.has(id)) { state.favorites.delete(id); toast("Annonce retirée des favoris."); }
    else { state.favorites.add(id); toast("Annonce ajoutée aux favoris."); }
    writeStore("favorites", [...state.favorites]);
    activeRender();
  }));
  $$("[data-go-detail]").forEach(btn => btn.addEventListener("click", () => go("detail", `/${btn.dataset.goDetail}`)));
  $("#hero-search")?.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(e.currentTarget).get("q").trim(); saveFilters(); go("search"); });
  $("#results-search")?.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(e.currentTarget).get("q").trim(); saveFilters(); location.href = `search.html${state.query ? `?q=${encodeURIComponent(state.query)}` : ""}`; });
  $("#filter-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); state.category = fd.get("category"); state.type = fd.get("type"); state.sort = fd.get("sort"); saveFilters(); activeRender(); });
  $("#reset-filters")?.addEventListener("click", () => { state.category = "Toutes les catégories"; state.type = "Tous"; state.sort = "Plus récent"; state.query = ""; saveFilters(); location.href = "search.html"; });
  $$("[data-type]").forEach(btn => btn.addEventListener("click", () => { $$("[data-type]").forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); const form = $("#publish-form"); form.dataset.type = btn.dataset.type; toast(`Type choisi : ${btn.dataset.type}`); }));
  $("#ad-photo")?.addEventListener("change", e => {
    const file = e.currentTarget.files[0]; const preview = $("#photo-preview");
    if (!file) { preview.hidden = true; preview.innerHTML = ""; return; }
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) { e.currentTarget.value = ""; preview.hidden = true; toast("Choose an image smaller than 1 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { preview.innerHTML = `<img src="${reader.result}" alt="Image preview"><span>${escapeHTML(file.name)}</span>`; preview.hidden = false; };
    reader.readAsDataURL(file);
  });
  $("#publish-form")?.addEventListener("submit", e => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const form = e.currentTarget; const file = fd.get("photo");
    const createListing = image => {
      const newItem = { id: Math.max(...listings.map(x=>x.id))+1, title: fd.get("title").trim(), price: Number(fd.get("price")), category: fd.get("category"), city: fd.get("city"), age: "A l'instant", type: form.dataset.type || "A vendre", emoji: "📦", image, condition: fd.get("condition").trim(), description: fd.get("description").trim(), seller: "Mariam Tahayekt", verified: false, status: "En attente" };
      listings.unshift(newItem); saveListings(); location.href = `my-ads.html?submitted=${newItem.id}`;
    };
    if (file instanceof File && file.size) { const reader = new FileReader(); reader.onload = () => createListing(reader.result); reader.onerror = () => toast("Could not read the selected image."); reader.readAsDataURL(file); }
    else createListing("");
  });
  $("#comment-form")?.addEventListener("submit", e => { e.preventDefault(); state.comments.push({ user: "Vous", text: new FormData(e.currentTarget).get("comment") }); writeStore("comments", state.comments); toast("Commentaire ajouté."); activeRender(); });
  $$("[data-reply]").forEach(btn => btn.addEventListener("click", () => { $("#comment").value = `@${btn.dataset.reply} `; $("#comment").focus(); }));
  $("#contact-seller")?.addEventListener("click", () => go("messages"));
  $("#message-form")?.addEventListener("submit", e => { e.preventDefault(); const text = new FormData(e.currentTarget).get("message").trim(); if (!text) return; state.messages.push({ user: "Vous", text, mine: true }); writeStore("messages", state.messages); activeRender(); toast("Message ajouté à la conversation de démonstration."); });
  $$(".chat-person").forEach(el => el.addEventListener("click", () => { $$(".chat-person").forEach(x=>x.classList.remove("active")); el.classList.add("active"); toast("Conversation de démonstration sélectionnée."); }));
  $("#auth-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); if (fd.has("confirm") && fd.get("password") !== fd.get("confirm")) return toast("Les mots de passe ne correspondent pas."); toast("Connexion de démonstration réussie."); go(e.currentTarget.dataset.role === "admin" ? "admin" : "dashboard"); });
  $("#forgot-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Lien simulé : aucun e-mail n’a été envoyé."); e.currentTarget.insertAdjacentHTML("beforeend", '<div class="notice success">✓ Demande traitée en mode démonstration.</div>'); });
  $("#reset-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); if(fd.get("password")!==fd.get("confirm")) return toast("Les mots de passe ne correspondent pas."); toast("Mot de passe mis à jour en mode démo."); go("login"); });
  $("#edit-profile")?.addEventListener("click", () => toast("Modification du profil : à connecter au backend."));
  $("#run-match")?.addEventListener("click", () => { state.query = $("#match-query").value; toast("Correspondances recalculées pour la démo."); });
  $("#create-alert")?.addEventListener("click", () => go("alerts"));
  $("#find-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Résultats personnalisés simulés."); $("#personal-results").scrollIntoView({behavior:"smooth",block:"center"}); });
  $("#alert-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Alerte activée en mode démo."); e.currentTarget.insertAdjacentHTML("beforeend", '<div class="notice success">🔔 Votre alerte de démonstration est activée.</div>'); });
  $$("[data-admin-filter]").forEach(btn => btn.addEventListener("click", () => { state.adminFilter = btn.dataset.adminFilter; activeRender(); }));
  $$("[data-moderate]").forEach(btn => btn.addEventListener("click", () => { const item = listings.find(x => x.id === Number(btn.dataset.id)); if (!item) return; item.status = btn.dataset.moderate; saveListings(); toast(`Annonce ${item.status.toLowerCase()}.`); activeRender(); }));
  $$("[data-delete]").forEach(btn => btn.addEventListener("click", () => { const item = listings.find(x => x.id === Number(btn.dataset.delete)); if (!item || !window.confirm("Supprimer cette annonce ?")) return; listings.splice(listings.indexOf(item), 1); saveListings(); toast("Annonce supprimee."); activeRender(); }));
  $("#admin-search")?.addEventListener("submit", e => { e.preventDefault(); state.adminQuery = new FormData(e.currentTarget).get("q").trim(); activeRender(); });
}

window.QuickAnnonces = { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, listingCard, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go };
})();

/* Page renderers consolidated from the former page-specific scripts. */

// Former admin.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'admin') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function adminPage() {
  const needle = state.adminQuery.trim().toLocaleLowerCase();
  const items = listings.filter(x => (state.adminFilter === "Toutes" || (x.status || "Approuvee") === state.adminFilter) && (!needle || `${x.title} ${x.category} ${x.city} ${x.seller}`.toLocaleLowerCase().includes(needle)));
  const count = status => listings.filter(x => (x.status || "Approuvee") === status).length;
  shell(`${pageTitle("Bonjour Admin", "Consultez, recherchez et gerez toutes les annonces.")}<div class="stats"><div class="stat"><strong>${count("En attente")}</strong><span>En attente</span></div><div class="stat"><strong>${count("Approuvee")}</strong><span>Approuvees</span></div><div class="stat"><strong>${count("Refusee")}</strong><span>Refusees</span></div><div class="stat"><strong>${listings.length}</strong><span>Total</span></div></div><div class="panel"><div class="section-heading"><h2>Toutes les annonces</h2><span class="pill">Administration</span></div><div class="tabs">${["Toutes","En attente","Approuvee","Refusee"].map(x=>`<button class="tab ${state.adminFilter===x?"active":""}" data-admin-filter="${x}">${statusText(x)}</button>`).join("")}</div><form id="admin-search" class="admin-search"><input name="q" value="${escapeHTML(state.adminQuery)}" placeholder="Rechercher par titre, categorie, ville ou vendeur"><button class="btn btn-outline">Rechercher</button></form><div id="moderation-list">${items.length ? items.map(x=>`<div class="match-row moderation-row"><div class="mini-visual">${x.image ? `<img class="admin-thumb" src="${x.image}" alt="">` : x.emoji}</div><div><span class="pill">${escapeHTML(x.type || "A vendre")}</span><strong class="moderation-title">${escapeHTML(x.title)}</strong><div class="price">${money(x.price)}</div><div class="meta">${escapeHTML(x.city)} | ${escapeHTML(x.category)} | ${escapeHTML(x.seller)}</div></div><div class="moderation-actions"><span class="status-badge status-${x.status === "Approuvee" ? "approved" : x.status === "Refusee" ? "rejected" : "pending"}">${statusText(x.status || "Approuvee")}</span><div class="actions"><button class="btn btn-primary" data-moderate="Approuvee" data-id="${x.id}">Garder / Approuver</button><button class="btn btn-outline" data-moderate="Refusee" data-id="${x.id}">Refuser</button><a class="btn btn-soft" href="detail.html?id=${x.id}">Preview</a><button class="btn btn-danger" data-delete="${x.id}">Supprimer</button></div></div></div>`).join("") : `<div class="empty"><div class="emoji">No results</div><h3>Aucune annonce trouvee</h3></div>`}</div></div>`);
}

mountPage("admin", adminPage);

})();

// Former admin-login.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'admin-login') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function loginPage(register = false) {
  const adminLogin = location.pathname.endsWith("admin-login.html");
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":adminLogin?"Espace d’administration":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":adminLogin?"Connectez-vous pour examiner et gérer toutes les annonces.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":adminLogin?"Connexion administrateur":"Connexion client"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  ${!register&&!adminLogin?`<div class="login-choice"><a class="btn btn-primary" href="login.html">Connexion client</a><a class="btn btn-outline" href="admin-login.html">Connexion administrateur</a></div>`:""}
  <form id="auth-form" data-role="${adminLogin?"admin":"customer"}">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required minlength="6"></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="6"></div>`:`<div style="text-align:right"><a class="text-link small" href="forgot.html">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":adminLogin?"Vous êtes un client ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="${register||adminLogin?"login":"register"}.html">${register||adminLogin?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}

mountPage("admin-login", () => loginPage(false));

})();

// Former alerts.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'alerts') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function alertsPage() {
  shell(`${pageTitle("Alerte intelligente 🔔", "Ne ratez plus jamais une annonce qui correspond à votre recherche.")}<div class="two-col"><section class="panel"><span class="pill">🔔 Alerte activée</span><h2 class="section">Ordinateur portable pour études</h2><p>Budget ≤ 4 000 DH · 16 Go RAM · Tanger</p><div class="notice success">Nouvelle correspondance !</div><div class="match-row"><div class="mini-visual">💻</div><div><strong>Lenovo ThinkPad</strong><div class="price">3 900 DH</div><div class="meta">96% Match · Publiée il y a 8 min</div></div><a class="text-link" href="detail.html?id=4">Voir l’annonce</a></div></section><section class="panel"><h2>Créer une alerte</h2><form id="alert-form"><div class="field"><label>Recherche</label><input name="query" placeholder="Ex. : ordinateur portable" required></div><div class="field"><label>Budget maximum (DH)</label><input name="budget" type="number" placeholder="4000"></div><div class="field"><label>Ville</label><select name="city"><option>Tanger</option><option>Tétouan</option><option>Rabat</option><option>Casablanca</option></select></div><button class="btn btn-primary">Activer l’alerte</button></form></section></div>`);
}

mountPage("alerts", alertsPage);

})();

// Former compare.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'compare') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function comparePage() {
  const items = [listings[3], { ...listings[3], id: 13, title: "HP Pavilion", price: 3950, emoji: "💻", condition: "16 Go RAM, 512 Go SSD" }, { ...listings[3], id: 14, title: "Dell Latitude", price: 3500, emoji: "💻", condition: "8 Go RAM, 256 Go SSD" }];
  shell(`${pageTitle("Comparer les annonces", "Comparez les offres importantes avant de contacter un vendeur.")}<div class="panel comparison"><table><thead><tr><th>Critère</th>${items.map(x=>`<th>${x.title}</th>`).join("")}</tr></thead><tbody><tr><td>Prix</td>${items.map(x=>`<td><strong>${money(x.price)}</strong></td>`).join("")}</tr><tr><td>RAM</td><td>16 Go</td><td>16 Go</td><td>8 Go</td></tr><tr><td>Stockage</td><td>512 Go SSD</td><td>512 Go SSD</td><td>256 Go SSD</td></tr><tr><td>Évaluation</td><td>★ 4.8</td><td>★ 4.6</td><td>★ 4.7</td></tr><tr><td>Action</td>${items.map((x,i)=>`<td><a class="btn ${i===0?"btn-primary":"btn-outline"}" href="detail.html?id=4">${i===0?"Meilleur choix":"Voir l’annonce"}</a></td>`).join("")}</tr></tbody></table></div>`);
}

mountPage("compare", comparePage);

})();

// Former dashboard.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'dashboard') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function dashboardPage() {
  shell(`${pageTitle("Bonjour 👋", "Voici ce qui se passe sur QuickAnnonces.")}<div class="stats"><div class="stat"><strong>12</strong><span>Annonces consultées</span></div><div class="stat"><strong>4</strong><span>Correspondances</span></div><div class="stat"><strong>2</strong><span>Alertes actives</span></div><div class="stat"><strong>3</strong><span>Messages</span></div></div><div class="panel"><h2>Pour vous</h2><div class="notice">✨ 3 nouvelles annonces correspondent à vos recherches <a class="text-link" href="quickmatch.html">Voir les matchs →</a></div><div class="actions"><a class="btn btn-primary" href="messages.html">Ouvrir les messages</a><a class="btn btn-outline" href="alerts.html">Gérer mes alertes</a><a class="btn btn-outline" href="my-ads.html">Mes annonces</a></div></div>`);
}

mountPage("dashboard", dashboardPage);

})();

// Former demo.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'demo') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function demoPage() {
  const pending = listings.filter(x => x.status === "En attente").length;
  const approved = listings.filter(x => x.status === "Approuvee").length;
  shell(`${pageTitle("Visite guidée QuickAnnonces", "Essayez un parcours complet : publier une annonce, puis la traiter comme administrateur.")}
    <section class="demo-hero"><div><span class="eyebrow">DÉMO INTERACTIVE</span><h2>Tout fonctionne dans ce navigateur</h2><p>Les annonces, favoris, filtres et messages de démonstration restent enregistrés localement sur cet appareil.</p><a class="btn btn-primary" href="publish.html">Commencer par publier</a></div><div class="demo-orbit">Q<span>Démo</span></div></section>
    <div class="stats"><div class="stat"><strong>${pending}</strong><span>Annonces en attente</span></div><div class="stat"><strong>${approved}</strong><span>Annonces approuvées</span></div><div class="stat"><strong>${state.favorites.size}</strong><span>Favoris enregistrés</span></div><div class="stat"><strong>${state.messages.length}</strong><span>Messages de démo</span></div></div>
    <div class="demo-steps"><article class="demo-step"><span class="step-number">01</span><div><h3>Publier une annonce</h3><p>Choisissez un type, renseignez les détails et ajoutez une photo pour voir son aperçu.</p><a class="text-link" href="publish.html">Ouvrir le formulaire →</a></div></article><article class="demo-step"><span class="step-number">02</span><div><h3>Vérifier le statut</h3><p>Après l’envoi, l’annonce apparaît dans Mes annonces avec le statut En attente.</p><a class="text-link" href="my-ads.html">Voir mes annonces →</a></div></article><article class="demo-step"><span class="step-number">03</span><div><h3>Examiner côté admin</h3><p>Filtrez ou recherchez les annonces, prévisualisez-les, approuvez-les, refusez-les ou supprimez-les.</p><a class="text-link" href="admin-login.html">Ouvrir la connexion admin →</a></div></article><article class="demo-step"><span class="step-number">04</span><div><h3>Explorer comme client</h3><p>Enregistrez des favoris, filtrez les annonces et testez l’interface de messagerie.</p><a class="text-link" href="search.html">Parcourir les annonces →</a></div></article></div>
    <div class="notice demo-note"><strong>À savoir :</strong> l’authentification et les données sont simulées. Le stockage local est propre à ce navigateur et ne synchronise rien entre appareils.</div>`, "demo");
}

mountPage("demo", demoPage);

})();

// Former detail.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'detail') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function detailPage(id) {
  const item = getListing(id);
  shell(`<div class="breadcrumb"><a href="index.html">Accueil</a> / <a href="search.html">${item.category}</a> / ${item.title}</div>
  <div class="detail-layout"><section><div class="product-visual">${item.image ? `<img src="${item.image}" alt="${escapeHTML(item.title)}">` : item.emoji}</div><div class="panel section"><h2>Description</h2><p>${escapeHTML(item.description)}</p><div class="meta">État : ${escapeHTML(item.condition)} · Catégorie : ${escapeHTML(item.category)} · 📍 ${escapeHTML(item.city)}</div></div>
  <div class="panel section"><h2>Commentaires (${state.comments.length + 6})</h2>${state.comments.map(c=>`<div class="comment"><strong>${c.user}</strong><p style="margin:0">${escapeHTML(c.text)}</p><button class="btn btn-soft" data-reply="${escapeHTML(c.user)}">Répondre</button></div>`).join("")}
  <form id="comment-form" class="section"><div class="field"><label for="comment">Ajouter un commentaire</label><textarea id="comment" name="comment" placeholder="Écrivez votre commentaire..." required></textarea></div><button class="btn btn-primary">Publier le commentaire</button></form></div></section>
  <aside class="panel product-info"><span class="pill">${item.type}</span><h1 style="font-size:30px">${item.title}</h1><div class="price">${money(item.price)}${item.id===3?"/mois":""}</div><p>${item.condition} · ${item.category}</p><div class="notice">✓ Vendeur vérifié <br>📍 ${item.city} · ${item.age}</div><div class="actions"><button class="btn btn-primary" id="contact-seller">💬 Contacter</button><button class="btn btn-outline" data-fav="${item.id}">${state.favorites.has(item.id)?"♥ Favoris":"♡ Favoris"}</button></div><div class="section"><h3>Profil vendeur</h3><div class="profile-head"><div class="avatar">${item.seller.split(" ").map(s=>s[0]).slice(0,2).join("")}</div><div><strong>${item.seller}</strong><div class="meta">★ 4.9 · Vendeur vérifié</div><a class="text-link small" href="seller.html">Voir le profil</a></div></div></div></aside></div>`);
}

mountPage("detail", () => detailPage(currentRoute().id));

})();

// Former favorites.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'favorites') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function favoritesPage() {
  const items = listings.filter(x => state.favorites.has(x.id));
  shell(`${pageTitle("Mes favoris", "Retrouvez ici les annonces que vous avez enregistrées.")}${items.length ? cards(items) : `<div class="empty"><div class="emoji">♡</div><h2>Aucun favori pour le moment</h2><p>Ajoutez une annonce à vos favoris en cliquant sur le cœur.</p><a href="search.html" class="btn btn-primary">Explorer les annonces</a></div>`}`);
}

mountPage("favorites", favoritesPage);

})();

// Former find-for-me.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'find-for-me') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function findForMePage() {
  shell(`${pageTitle("Trouver pour moi ✨", "Décrivez simplement ce que vous cherchez. QuickAnnonces trouve les annonces les plus pertinentes.")}<div class="two-col"><section class="panel"><form id="find-form"><div class="field"><label>💬 Que recherchez-vous ?</label><textarea name="prompt" placeholder="Ex. : Je recherche un ordinateur portable pour mes études, 16 Go RAM, budget 4 000 DH maximum." required></textarea></div><button class="btn btn-primary">✨ Trouver pour moi</button></form><p class="small">Exemple : « Je cherche un appartement 2 chambres près du centre, moins de 5 000 DH. »</p></section><section class="panel"><h2>Résultats personnalisés</h2><div id="personal-results">${matchRow({emoji:"💻",title:"Laptop Lenovo",price:3800,id:4},98)}${matchRow({emoji:"💻",title:"HP Pavilion",price:3950,id:4},91)}${matchRow({emoji:"💻",title:"Dell Latitude",price:3500,id:4},84)}</div></section></div>`);
}

mountPage("find-for-me", findForMePage);

})();

// Former forgot.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'forgot') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function forgotPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Récupérez votre compte</h1><p>Nous vous aiderons à retrouver l’accès à votre espace.</p></aside><section class="auth-form"><h2>Mot de passe oublié ?</h2><p>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p><form id="forgot-form"><div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div><button class="btn btn-primary btn-block">Envoyer le lien de réinitialisation</button></form><p class="center"><a class="text-link" href="login.html">← Retour à la connexion</a></p></section></div>`);
}

mountPage("forgot", forgotPage);

})();

// Former index.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'index') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function homePage() {
  shell(`<section class="hero">
    <div><span class="eyebrow">Bienvenue sur QuickAnnonces</span><h1>Trouvez. Publiez.<br>Connectez-vous.</h1>
    <p>Des annonces de vente et de recherche, avec des personnes réelles. Achetez, vendez ou recherchez facilement près de chez vous.</p>
    <form class="searchbar" id="hero-search"><input name="q" placeholder="🔎 Que recherchez-vous ?" aria-label="Que recherchez-vous ?"><button class="btn btn-primary">Rechercher</button></form>
    <div class="actions" style="margin-top:16px"><a class="btn btn-outline" href="search.html">Explorer les annonces</a><a class="btn btn-soft" href="publish.html">＋ Publier une annonce</a></div></div>
    <div class="hero-art"><div class="art-card"><div class="art-visual">🛍️</div><strong>Une bonne affaire près de vous</strong><small>Des annonces simples, des contacts directs.</small></div></div>
  </section>
  <section class="section"><div class="section-heading"><div><h2>Annonces récentes</h2><p>Découvrez les dernières annonces près de chez vous.</p></div><a class="text-link" href="search.html">Voir toutes les annonces →</a></div>${cards(listings.slice(9, 12).concat(listings.slice(0, 1)))}</section>
  <section class="section"><div class="section-heading"><div><h2>Annonces en vedette</h2><p>Des offres sélectionnées pour vous.</p></div></div>${cards(listings.slice(0, 4))}</section>
  <section class="section panel"><div class="two-col"><div><span class="eyebrow">QuickMatch ✨</span><h2>Votre recherche, en plus simple</h2><p>Décrivez ce que vous cherchez et découvrez les annonces les plus pertinentes.</p></div><div class="actions" style="align-items:center;justify-content:flex-end"><a class="btn btn-primary" href="find-for-me.html">Trouver pour moi ✨</a><a class="btn btn-outline" href="quickmatch.html">Découvrir QuickMatch</a></div></div></section>`, "home");
}

mountPage("index", homePage);

})();

// Former login.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'login') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function loginPage(register = false) {
  const adminLogin = location.pathname.endsWith("admin-login.html");
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":adminLogin?"Espace d’administration":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":adminLogin?"Connectez-vous pour examiner et gérer toutes les annonces.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":adminLogin?"Connexion administrateur":"Connexion client"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  ${!register&&!adminLogin?`<div class="login-choice"><a class="btn btn-primary" href="login.html">Connexion client</a><a class="btn btn-outline" href="admin-login.html">Connexion administrateur</a></div>`:""}
  <form id="auth-form" data-role="${adminLogin?"admin":"customer"}">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required minlength="6"></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="6"></div>`:`<div style="text-align:right"><a class="text-link small" href="forgot.html">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":adminLogin?"Vous êtes un client ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="${register||adminLogin?"login":"register"}.html">${register||adminLogin?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}

mountPage("login", () => loginPage(false));

})();

// Former messages.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'messages') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function messagesPage() {
  shell(`<div class="page-title"><h1>Messages</h1><p>Échangez directement avec les vendeurs et les acheteurs.</p></div>
  <div class="panel chat-layout"><aside class="chat-list"><h3>Conversations</h3><div class="chat-person active"><strong>Yasmine Benali</strong><div class="meta">Bonjour, est-ce que le téléphone...</div></div><div class="chat-person"><strong>Sarah El Idrissi</strong><div class="meta">Dernier message...</div></div><div class="chat-person"><strong>Omar El Amrani</strong><div class="meta">Dernier message...</div></div><div class="chat-person"><strong>Imane Bennis</strong><div class="meta">Dernier message...</div></div></aside>
  <section class="chat-window"><div class="chat-head">Yasmine Benali <span class="meta">· À propos de iPhone 13</span></div><div class="messages" id="messages">${state.messages.map(m=>`<div class="bubble ${m.mine?"mine":""}">${escapeHTML(m.text)}</div>`).join("")}</div>
  <form class="chat-compose" id="message-form"><input name="message" placeholder="Écrire un message..." required><button class="btn btn-primary">Envoyer</button></form></section></div>`);
}

mountPage("messages", messagesPage);

})();

// Former my-ads.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'my-ads') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function myAdsPage() {
  const myItems = listings.filter(x => x.seller === "Mariam Tahayekt");
  const submitted = new URLSearchParams(location.search).get("submitted");
  shell(`<div class="section-heading"><div>${pageTitle("Mes annonces", "Gérez vos publications et suivez leur statut de modération.")}</div><a href="publish.html" class="btn btn-primary">＋ Publier une annonce</a></div>
  ${submitted ? `<div class="notice success submit-confirmation"><strong>✓ Annonce envoyée pour approbation</strong><br>Elle apparaît dans la file d’attente admin et sera visible publiquement après validation. <a class="text-link" href="detail.html?id=${encodeURIComponent(submitted)}">Voir le récapitulatif →</a></div>` : ""}
  <div class="stats"><div class="stat"><strong>${myItems.length}</strong><span>Mes annonces</span></div><div class="stat"><strong>${myItems.filter(x=>x.status==="En attente").length}</strong><span>En attente</span></div><div class="stat"><strong>${myItems.filter(x=>x.status === "Approuvee").length}</strong><span>Approuvées</span></div><div class="stat"><strong>${myItems.filter(x=>x.status === "Refusee").length}</strong><span>Refusées</span></div></div>
  ${myItems.length ? `<div class="my-listings">${myItems.map(x=>`<article class="my-listing"><div class="mini-visual">${x.image ? `<img class="admin-thumb" src="${x.image}" alt="">` : x.emoji}</div><div class="my-listing-info"><strong>${escapeHTML(x.title)}</strong><div class="price">${money(x.price)}</div><span class="status-badge status-${x.status === "Approuvee" ? "approved" : x.status === "Refusee" ? "rejected" : "pending"}">${escapeHTML(statusText(x.status))}</span></div><a class="btn btn-outline" href="detail.html?id=${x.id}">Voir</a></article>`).join("")}</div>` : `<div class="empty"><div class="emoji">📦</div><h2>Vous n’avez pas encore publié d’annonce</h2><p>Votre première publication s’affichera ici avec son statut de validation.</p><a class="btn btn-primary" href="publish.html">Créer une annonce</a></div>`}`, "my-ads");
}

mountPage("my-ads", myAdsPage);

})();

// Former publish.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'publish') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function publishPage() {
  shell(`<div style="max-width:820px;margin:auto">${pageTitle("Créer une nouvelle annonce", "Choisissez le type d’annonce et complétez les informations.")}
  <div class="two-col section"><button class="panel type-choice" data-type="À vendre" style="text-align:left"><span class="eyebrow">À vendre</span><h2>Je souhaite vendre</h2><p>Je souhaite vendre un article, un bien ou un service.</p><span class="btn btn-outline">Choisir</span></button><button class="panel type-choice" data-type="Je recherche" style="text-align:left"><span class="eyebrow">Je recherche</span><h2>Je recherche</h2><p>Je recherche un article, un bien ou un service.</p><span class="btn btn-outline">Choisir</span></button></div>
  <form id="publish-form" class="panel section"><h2>Informations de l’annonce</h2><div class="field"><label for="ad-title">Titre de l’annonce</label><input id="ad-title" name="title" placeholder="Ex : iPhone 13 en très bon état" minlength="3" maxlength="80" required></div>
  <div class="two-col"><div class="field"><label>Catégorie</label><select name="category" required><option value="">Sélectionner une catégorie</option>${categories.map(c=>`<option>${c}</option>`).join("")}</select></div><div class="field"><label>Prix en MAD</label><input name="price" type="number" min="1" placeholder="Prix en MAD" required></div></div>
  <div class="two-col"><div class="field"><label>Localisation</label><select name="city"><option>Tanger</option><option>Tétouan</option><option>Rabat</option><option>Casablanca</option><option>Fès</option><option>Marrakech</option></select></div><div class="field"><label>État</label><select name="condition"><option>Neuf</option><option>Très bon état</option><option>Bon état</option><option>État correct</option></select></div></div>
  <div class="field"><label>Description</label><textarea name="description" placeholder="Décrivez votre annonce..." required></textarea></div><div class="field"><label for="ad-photo">Photo de l'annonce</label><input id="ad-photo" name="photo" type="file" accept="image/*"><span class="small muted">Choisissez une image pour la preview (max. 1 Mo).</span><div id="photo-preview" class="photo-preview" hidden></div></div>
  <div class="actions"><button class="btn btn-primary">Publier l’annonce</button><a class="btn btn-outline" href="my-ads.html">Annuler</a></div><p class="small">Votre annonce sera visible publiquement après approbation par l’administrateur.</p></form></div>`);
}

mountPage("publish", publishPage);

})();

// Former quickmatch.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'quickmatch') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function quickmatchPage() {
  shell(`<div class="two-col"><section>${pageTitle("QuickMatch ✨", "Notre fonctionnalité spéciale : nous trouvons automatiquement les annonces qui correspondent à votre recherche.")}<div class="panel"><div class="field"><label>🔎 Je recherche</label><input id="match-query" value="iPhone 14 128 Go"></div><button id="run-match" class="btn btn-primary">Trouver les correspondances</button><button id="create-alert" class="btn btn-outline">🔔 Créer une alerte</button></div><div class="section" id="match-detail"><div class="product-visual" style="min-height:200px">📱</div><h2 class="section">iPhone 14 — Excellent état</h2><div class="price">4 900 DH</div><div class="notice success">✓ Vendeur vérifié · ★ 4.9</div><p>Description : téléphone en excellent état, batterie 92%, avec boîte et accessoires.</p><button class="btn btn-primary" data-go-detail="10">💬 Contacter</button> <button class="btn btn-outline" data-fav="10">♡ Ajouter aux favoris</button></div></section>
  <aside><div class="panel"><h2>3 correspondances trouvées</h2><p>Les annonces les plus proches de votre recherche.</p>${matchRow(listings[9],98)}${matchRow(listings[10],90)}${matchRow(listings[3],82)}</div></aside></div>`);
}

mountPage("quickmatch", quickmatchPage);

})();

// Former register.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'register') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function loginPage(register = false) {
  const adminLogin = location.pathname.endsWith("admin-login.html");
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":adminLogin?"Espace d’administration":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":adminLogin?"Connectez-vous pour examiner et gérer toutes les annonces.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":adminLogin?"Connexion administrateur":"Connexion client"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  ${!register&&!adminLogin?`<div class="login-choice"><a class="btn btn-primary" href="login.html">Connexion client</a><a class="btn btn-outline" href="admin-login.html">Connexion administrateur</a></div>`:""}
  <form id="auth-form" data-role="${adminLogin?"admin":"customer"}">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required minlength="6"></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="6"></div>`:`<div style="text-align:right"><a class="text-link small" href="forgot.html">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":adminLogin?"Vous êtes un client ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="${register||adminLogin?"login":"register"}.html">${register||adminLogin?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}

mountPage("register", () => loginPage(true));

})();

// Former reset.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'reset') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function resetPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Un nouveau départ</h1><p>Choisissez un nouveau mot de passe sécurisé.</p></aside><section class="auth-form"><h2>Créer un nouveau mot de passe</h2><form id="reset-form"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" required minlength="6"></div><div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" required minlength="6"></div><button class="btn btn-primary btn-block">Réinitialiser le mot de passe</button></form></section></div>`);
}

mountPage("reset", resetPage);

})();

// Former search.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'search') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, listingCard, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function searchPage() {
  const q = new URLSearchParams(location.search).get("q") || state.query;
  let results = listings.filter(x => x.status === "Approuvee" && (!q || x.title.toLowerCase().includes(q.toLowerCase()) || x.category.toLowerCase().includes(q.toLowerCase())) && (state.category === "Toutes les catégories" || x.category === state.category) && (state.type === "Tous" || x.type === state.type));
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

mountPage("search", searchPage);


})();

// Former security.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'security') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function securityPage() {
  const features = [["✓","Identité vérifiée","Le profil a confirmé son identité."],["✓","Téléphone vérifié","Numéro confirmé par SMS."],["✓","Annonce contrôlée","Contenu vérifié automatiquement."],["★","Bon historique","Évaluations positives des utilisateurs."]];
  shell(`${pageTitle("Sécurité & confiance 🛡️", "Des indicateurs simples pour acheter et vendre plus sereinement.")}<div class="two-col"><section class="panel">${features.map(f=>`<div class="profile-head" style="padding:17px 0;border-bottom:1px solid var(--line)"><div class="avatar">${f[0]}</div><div><h3>${f[1]}</h3><p style="margin:0">${f[2]}</p></div></div>`).join("")}</section><aside class="panel"><h2>Indice de confiance</h2><p>Les profils et les annonces peuvent afficher des indicateurs utiles pour vous aider à prendre une décision.</p><div class="notice success">✓ Identité vérifiée<br>✓ Téléphone vérifié<br>✓ Réponse rapide<br>✓ Historique positif</div><p class="small">Les indicateurs sont des exemples de maquette et ne représentent pas une vérification réelle.</p></aside></div>`);
}

mountPage("security", securityPage);

})();

// Former seller.js
(() => { if (location.pathname.split('/').pop().replace(/\.html$/, '') !== 'seller') return;
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function sellerPage() {
  shell(`${pageTitle("Profil vendeur", "Consultez les informations publiques du vendeur.")}<div class="panel"><div class="profile-head"><div class="avatar">YB</div><div><h2>Yasmine B.</h2><div class="meta">✓ Profil vérifié · Membre depuis 2026</div><p>★ 4.9 · 38 évaluations</p></div></div><div class="stats"><div class="stat"><strong>23</strong><span>Annonces</span></div><div class="stat"><strong>4.9</strong><span>Note moyenne</span></div><div class="stat"><strong>38</strong><span>Évaluations</span></div><div class="stat"><strong>Rapide</strong><span>Réponse</span></div></div><h2>Ses annonces</h2>${cards([listings[0], listings[9], listings[10]], "three")}</div>`);
}

mountPage("seller", sellerPage);

})();


