/* QuickAnnonces — interface statique et appels vers l'API PHP. */
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
  adminQuery: "",
  user: null
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
const categories = [...new Set(listings.map(item => item.category).filter(Boolean))];
const money = n => new Intl.NumberFormat("fr-MA").format(n) + " MAD";
const getListing = id => listings.find(item => item.id === Number(id)) || listings[0] || null;
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
  navigate(`index.html?page=${encodeURIComponent(page === "home" ? "home" : page)}${query ? `&${query.slice(1)}` : ""}`);
}
function navigate(url) { const target = new URL(url, location.href); const match = target.pathname.match(/([^/]+)\.html$/); if (match && match[1] !== "index") target.searchParams.set("page", match[1]); location.href = target.href; }
function currentRoute() {
  const page = new URLSearchParams(location.search).get("page") || "home";
  return { page: page === "index" ? "home" : page, id: new URLSearchParams(location.search).get("id") || "" };
}
function header(active = "") {
  const page = active || currentRoute().page;
  const activeLink = key => page === key ? ' class="active" aria-current="page"' : "";
  const accountLinks = state.user
    ? `<span class="small">${escapeHTML(state.user.name)}</span><a class="text-link" href="logout.html">Se déconnecter</a>`
    : `<a class="login-label text-link" href="login.html">Se connecter</a>`;
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
    <div class="nav-actions">${accountLinks}<a class="btn btn-primary" href="publish.html">＋ Publier</a></div>
  </nav></header>`;
}
function footer() {
  return `<footer class="footer"><div class="footer-inner"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><span>Achetez, vendez et trouvez près de chez vous.</span><span>© 2026 QuickAnnonces</span></div></footer>`;
}
function normalizeLinks() { $$("a[href]").forEach(link => { const target = new URL(link.getAttribute("href"), location.href); const match = target.pathname.match(/([^/]+)\.html$/); if (!match || match[1] === "index") return; target.pathname = location.pathname; target.searchParams.set("page", match[1]); link.href = `${target.pathname}${target.search}`; }); }
function shell(content, active = "") { app.innerHTML = header(active) + `<main class="container">${content}</main>` + footer(); normalizeLinks(); bindGlobal(); }
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
const api = {
  async request(path, options = {}) {
    if (location.protocol === "file:") {
      throw new Error("Open the site through WAMP: http://localhost/quick-annonces/index.html");
    }
    const apiRoot = new URL("api/", document.baseURI);
    const apiPath = path.replace(/^\/api\//, "");
    const response = await fetch(new URL(apiPath, apiRoot), { credentials: "same-origin", ...options });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) throw new Error(result.error || `Request failed (${response.status}).`);
    return result;
  },
  async get(path) { return this.request(path); },
  async send(path, method, data) {
    return this.request(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  }
};
const dataReady = Promise.all([
  api.get("/api/listings.php"),
  api.get("/api/categories.php"),
  api.get("/api/auth.php?action=me")
]).then(([listingResult, categoryResult, authResult]) => {
  if (!Array.isArray(listingResult.data) || !Array.isArray(categoryResult.data)) {
    throw new Error("The API returned an invalid response. Check the WAMP/PHP setup.");
  }
  listings.splice(0, listings.length, ...listingResult.data.map(item => ({ ...item, id: Number(item.id) })));
  categories.splice(0, categories.length, ...categoryResult.data.map(item => item.name));
  state.user = authResult.user;
  if (state.user) {
    return api.get("/api/favorites.php").then(result => {
      state.favorites = new Set(result.data.map(Number));
    }).catch(error => console.error("Could not load favorites:", error));
  }
}).catch(error => {
  console.error("QuickAnnonces API could not be loaded:", error);
  setTimeout(() => toast(`Backend unavailable: ${error.message}`), 0);
});
function mountPage(page, renderer) { const route = page === "index" ? "home" : page; if (route !== currentRoute().page) return; activeRender = renderer; dataReady.then(() => activeRender?.()); }

function bindGlobal() {
  const navSearch = $("#nav-search");
  if (navSearch) navSearch.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(navSearch).get("q").trim(); saveFilters(); go("search"); });
  $("#menu-toggle")?.addEventListener("click", e => { const button = e.currentTarget; const open = button.getAttribute("aria-expanded") !== "true"; button.setAttribute("aria-expanded", String(open)); $("#primary-nav")?.classList.toggle("open", open); });
  $$("[data-fav]").forEach(btn => btn.addEventListener("click", async e => {
    e.preventDefault(); e.stopPropagation();
    const id = Number(btn.dataset.fav);
    if (!state.user) { toast("Sign in to save favorites."); return; }
    const removing = state.favorites.has(id);
    try {
      await api.send("/api/favorites.php", removing ? "DELETE" : "POST", { listing_id: id });
      if (removing) { state.favorites.delete(id); toast("Annonce retirée des favoris."); }
      else { state.favorites.add(id); toast("Annonce ajoutée aux favoris."); }
      activeRender();
    } catch (error) { toast(error.message); }
  }));
  $$("[data-go-detail]").forEach(btn => btn.addEventListener("click", () => go("detail", `/${btn.dataset.goDetail}`)));
  $("#hero-search")?.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(e.currentTarget).get("q").trim(); saveFilters(); go("search"); });
  $("#results-search")?.addEventListener("submit", e => { e.preventDefault(); state.query = new FormData(e.currentTarget).get("q").trim(); saveFilters(); navigate(`index.html?page=search${state.query ? `&q=${encodeURIComponent(state.query)}` : ""}`); });
  $("#filter-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); state.category = fd.get("category"); state.type = fd.get("type"); state.sort = fd.get("sort"); saveFilters(); activeRender(); });
  $("#reset-filters")?.addEventListener("click", () => { state.category = "Toutes les catégories"; state.type = "Tous"; state.sort = "Plus récent"; state.query = ""; saveFilters(); go("search"); });
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
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("photo");
    if (file instanceof File && file.size) return toast("Text and listing details are connected. Photo uploads need image hosting setup first.");
    api.send("/api/listings.php", "POST", {
      title: fd.get("title"), description: fd.get("description"), price: fd.get("price"),
      category: fd.get("category"), city: fd.get("city"), condition: fd.get("condition"),
      type: e.currentTarget.dataset.type || "À vendre"
    }).then(result => {
      navigate(`index.html?page=my-ads&submitted=${result.id}`);
    }).catch(error => toast(error.message));
  });
  $("#comment-form")?.addEventListener("submit", e => { e.preventDefault(); state.comments.push({ user: "Vous", text: new FormData(e.currentTarget).get("comment") }); writeStore("comments", state.comments); toast("Commentaire ajouté."); activeRender(); });
  $$("[data-reply]").forEach(btn => btn.addEventListener("click", () => { $("#comment").value = `@${btn.dataset.reply} `; $("#comment").focus(); }));
  $("#contact-seller")?.addEventListener("click", async () => {
    if (!state.user) { go("login"); return; }
    const listingId = currentRoute().id;
    try {
      const result = await api.send("/api/conversations.php", "POST", { listing_id: Number(listingId) });
      navigate(`index.html?page=messages&conversation=${result.id}`);
    } catch (error) { toast(error.message); }
  });
  $("#message-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const text = new FormData(e.currentTarget).get("message").trim();
    const conversationId = Number(new URLSearchParams(location.search).get("conversation"));
    if (!text || !conversationId) return;
    try {
      await api.send("/api/messages.php", "POST", { conversation_id: conversationId, body: text });
      location.reload();
    } catch (error) { toast(error.message); }
  });
  $$(".chat-person").forEach(el => el.addEventListener("click", () => { $$(".chat-person").forEach(x=>x.classList.remove("active")); el.classList.add("active"); toast("Conversation de démonstration sélectionnée."); }));
  $("#auth-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.has("confirm") && fd.get("password") !== fd.get("confirm")) return toast("Les mots de passe ne correspondent pas.");
    const register = fd.has("name");
    try {
      const result = await api.send("/api/auth.php", "POST", {
        action: register ? "register" : "login",
        role: form.dataset.role === "admin" ? "admin" : "user",
        name: fd.get("name"), email: fd.get("email"), password: fd.get("password")
      });
      state.user = result.user;
      toast(register ? "Account created." : "Signed in.");
      go(result.user.role === "admin" ? "admin" : "dashboard");
    } catch (error) { toast(error.message); }
  });
  $("#forgot-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Lien simulé : aucun e-mail n’a été envoyé."); e.currentTarget.insertAdjacentHTML("beforeend", '<div class="notice success">✓ Demande traitée en mode démonstration.</div>'); });
  $("#reset-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); if(fd.get("password")!==fd.get("confirm")) return toast("Les mots de passe ne correspondent pas."); toast("Mot de passe mis à jour en mode démo."); go("login"); });
  $("#edit-profile")?.addEventListener("click", () => toast("Modification du profil : à connecter au backend."));
  $("#run-match")?.addEventListener("click", () => { state.query = $("#match-query").value; toast("Correspondances recalculées pour la démo."); });
  $("#create-alert")?.addEventListener("click", () => go("alerts"));
  $("#find-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Résultats personnalisés simulés."); $("#personal-results").scrollIntoView({behavior:"smooth",block:"center"}); });
  $("#alert-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      await api.send("/api/alerts.php", "POST", { query: fd.get("query"), budget: fd.get("budget"), city: fd.get("city") });
      activeRender?.();
    } catch (error) { toast(error.message); }
  });
  $$('[data-alert-delete]').forEach(button => button.addEventListener('click', async () => {
    try {
      await api.send(`/api/alerts.php?id=${button.dataset.alertDelete}`, 'DELETE', { id: Number(button.dataset.alertDelete) });
      activeRender?.();
    } catch (error) { toast(error.message); }
  }));
  $$("[data-admin-filter]").forEach(btn => btn.addEventListener("click", () => { state.adminFilter = btn.dataset.adminFilter; activeRender(); }));
  $$("[data-moderate]").forEach(btn => btn.addEventListener("click", async () => {
    const item = listings.find(x => x.id === Number(btn.dataset.id));
    if (!item) return;
    try {
      await api.send("/api/moderation.php", "PATCH", { id: item.id, status: btn.dataset.moderate });
      item.status = btn.dataset.moderate;
      toast(`Annonce ${item.status.toLowerCase()}.`);
      activeRender();
    } catch (error) { toast(error.message); }
  }));
  $$("[data-delete]").forEach(btn => btn.addEventListener("click", async () => {
    const item = listings.find(x => x.id === Number(btn.dataset.delete));
    if (!item || !window.confirm("Supprimer cette annonce ?")) return;
    try {
      await api.send("/api/moderation.php", "DELETE", { id: item.id });
      listings.splice(listings.indexOf(item), 1);
      toast("Annonce supprimee.");
      activeRender();
    } catch (error) { toast(error.message); }
  }));
  $("#admin-search")?.addEventListener("submit", e => { e.preventDefault(); state.adminQuery = new FormData(e.currentTarget).get("q").trim(); activeRender(); });
}

window.QuickAnnonces = { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, listingCard, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go, navigate, api };
})();


// --- admin-login.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function loginPage(register = false) {
  const adminLogin = currentRoute().page === "admin-login";
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":adminLogin?"Espace d’administration":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":adminLogin?"Connectez-vous pour examiner et gérer toutes les annonces.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":adminLogin?"Connexion administrateur":"Connexion client"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  ${!register&&!adminLogin?`<div class="login-choice"><a class="btn btn-primary" href="login.html">Connexion client</a><a class="btn btn-outline" href="admin-login.html">Connexion administrateur</a></div>`:""}
  <form id="auth-form" data-role="${adminLogin?"admin":"customer"}">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" value="${adminLogin?"handiradoha@gmail.com":""}" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required ${register?'minlength="8"':""}></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="8"></div>`:`<div style="text-align:right"><a class="text-link small" href="forgot.html">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":adminLogin?"Vous êtes un client ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="${register||adminLogin?"login":"register"}.html">${register||adminLogin?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}

mountPage("admin-login", () => loginPage(false));

})();


// --- admin.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function adminPage() {
  const needle = state.adminQuery.trim().toLocaleLowerCase();
  const items = listings.filter(x => (state.adminFilter === "Toutes" || (x.status || "Approuvee") === state.adminFilter) && (!needle || `${x.title} ${x.category} ${x.city} ${x.seller}`.toLocaleLowerCase().includes(needle)));
  const count = status => listings.filter(x => (x.status || "Approuvee") === status).length;
  shell(`${pageTitle("Bonjour Admin", "Consultez, recherchez et gerez toutes les annonces.")}<div class="stats"><div class="stat"><strong>${count("En attente")}</strong><span>En attente</span></div><div class="stat"><strong>${count("Approuvee")}</strong><span>Approuvees</span></div><div class="stat"><strong>${count("Refusee")}</strong><span>Refusees</span></div><div class="stat"><strong>${listings.length}</strong><span>Total</span></div></div><div class="panel"><div class="section-heading"><h2>Toutes les annonces</h2><span class="pill">Administration</span></div><div class="tabs">${["Toutes","En attente","Approuvee","Refusee"].map(x=>`<button class="tab ${state.adminFilter===x?"active":""}" data-admin-filter="${x}">${statusText(x)}</button>`).join("")}</div><form id="admin-search" class="admin-search"><input name="q" value="${escapeHTML(state.adminQuery)}" placeholder="Rechercher par titre, categorie, ville ou vendeur"><button class="btn btn-outline">Rechercher</button></form><div id="moderation-list">${items.length ? items.map(x=>`<div class="match-row moderation-row"><div class="mini-visual">${x.image ? `<img class="admin-thumb" src="${x.image}" alt="">` : x.emoji}</div><div><span class="pill">${escapeHTML(x.type || "A vendre")}</span><strong class="moderation-title">${escapeHTML(x.title)}</strong><div class="price">${money(x.price)}</div><div class="meta">${escapeHTML(x.city)} | ${escapeHTML(x.category)} | ${escapeHTML(x.seller)}</div></div><div class="moderation-actions"><span class="status-badge status-${x.status === "Approuvee" ? "approved" : x.status === "Refusee" ? "rejected" : "pending"}">${statusText(x.status || "Approuvee")}</span><div class="actions"><button class="btn btn-primary" data-moderate="Approuvee" data-id="${x.id}">Garder / Approuver</button><button class="btn btn-outline" data-moderate="Refusee" data-id="${x.id}">Refuser</button><a class="btn btn-soft" href="detail.html?id=${x.id}">Preview</a><button class="btn btn-danger" data-delete="${x.id}">Supprimer</button></div></div></div>`).join("") : `<div class="empty"><div class="emoji">No results</div><h3>Aucune annonce trouvee</h3></div>`}</div></div>`);
}

mountPage("admin", async () => {
  if (state.user?.role !== "admin") {
    toast("Administrator sign-in required.");
    window.QuickAnnonces.navigate("admin-login.html");
    return;
  }
  try {
    const result = await window.QuickAnnonces.api.get("/api/listings.php?all=1");
    listings.splice(0, listings.length, ...result.data);
  } catch (error) {
    toast(error.message);
  }
  adminPage();
});

})();


// --- alerts.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

async function alertsPage() {
  if (!state.user) { window.QuickAnnonces.navigate("login.html"); return; }
  try {
    const result = await window.QuickAnnonces.api.get("/api/alerts.php");
    shell(`${pageTitle("Alerte intelligente 🔔", "Ne ratez plus jamais une annonce qui correspond à votre recherche.")}<div class="two-col"><section class="panel"><h2>Mes alertes</h2>${result.data.map(a=>`<div class="match-row"><div><strong>${escapeHTML(a.search_text)}</strong><div class="meta">${escapeHTML(a.city || "Toutes les villes")}${a.max_price ? ` · Jusqu’à ${money(a.max_price)} ` : ""}</div></div><button class="btn btn-outline" data-alert-delete="${a.id}">Supprimer</button></div>`).join("") || `<p class="small muted">Aucune alerte enregistrée.</p>`}</section><section class="panel"><h2>Créer une alerte</h2><form id="alert-form"><div class="field"><label>Recherche</label><input name="query" placeholder="Ex. : ordinateur portable" required></div><div class="field"><label>Budget maximum (MAD)</label><input name="budget" type="number" min="0" placeholder="4000"></div><div class="field"><label>Ville</label><select name="city"><option value="">Toutes les villes</option><option>Tanger</option><option>Tétouan</option><option>Rabat</option><option>Casablanca</option></select></div><button class="btn btn-primary">Activer l’alerte</button></form></section></div>`);
  } catch (error) { toast(error.message); }
}

mountPage("alerts", alertsPage);

})();


// --- compare.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function comparePage() {
  const items = [listings[3], { ...listings[3], id: 13, title: "HP Pavilion", price: 3950, emoji: "💻", condition: "16 Go RAM, 512 Go SSD" }, { ...listings[3], id: 14, title: "Dell Latitude", price: 3500, emoji: "💻", condition: "8 Go RAM, 256 Go SSD" }];
  shell(`${pageTitle("Comparer les annonces", "Comparez les offres importantes avant de contacter un vendeur.")}<div class="panel comparison"><table><thead><tr><th>Critère</th>${items.map(x=>`<th>${x.title}</th>`).join("")}</tr></thead><tbody><tr><td>Prix</td>${items.map(x=>`<td><strong>${money(x.price)}</strong></td>`).join("")}</tr><tr><td>RAM</td><td>16 Go</td><td>16 Go</td><td>8 Go</td></tr><tr><td>Stockage</td><td>512 Go SSD</td><td>512 Go SSD</td><td>256 Go SSD</td></tr><tr><td>Évaluation</td><td>★ 4.8</td><td>★ 4.6</td><td>★ 4.7</td></tr><tr><td>Action</td>${items.map((x,i)=>`<td><a class="btn ${i===0?"btn-primary":"btn-outline"}" href="detail.html?id=4">${i===0?"Meilleur choix":"Voir l’annonce"}</a></td>`).join("")}</tr></tbody></table></div>`);
}

mountPage("compare", comparePage);

})();


// --- dashboard.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function dashboardPage() {
  shell(`${pageTitle("Bonjour 👋", "Voici ce qui se passe sur QuickAnnonces.")}<div class="stats"><div class="stat"><strong>12</strong><span>Annonces consultées</span></div><div class="stat"><strong>4</strong><span>Correspondances</span></div><div class="stat"><strong>2</strong><span>Alertes actives</span></div><div class="stat"><strong>3</strong><span>Messages</span></div></div><div class="panel"><h2>Pour vous</h2><div class="notice">✨ 3 nouvelles annonces correspondent à vos recherches <a class="text-link" href="quickmatch.html">Voir les matchs →</a></div><div class="actions"><a class="btn btn-primary" href="messages.html">Ouvrir les messages</a><a class="btn btn-outline" href="alerts.html">Gérer mes alertes</a><a class="btn btn-outline" href="my-ads.html">Mes annonces</a></div></div>`);
}

mountPage("dashboard", dashboardPage);

})();


// --- demo.js ---
(() => {
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


// --- detail.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function detailPage(id) {
  const item = getListing(id);
  if (!item) {
    shell(`<div class="empty"><div class="emoji">🔎</div><h1>Annonce introuvable</h1><p>Cette annonce n’existe pas ou n’est plus disponible.</p><a class="btn btn-primary" href="search.html">Explorer les annonces</a></div>`);
    return;
  }
  shell(`<div class="breadcrumb"><a href="index.html">Accueil</a> / <a href="search.html">${item.category}</a> / ${item.title}</div>
  <div class="detail-layout"><section><div class="product-visual">${item.image ? `<img src="${item.image}" alt="${escapeHTML(item.title)}">` : item.emoji}</div><div class="panel section"><h2>Description</h2><p>${escapeHTML(item.description)}</p><div class="meta">État : ${escapeHTML(item.condition)} · Catégorie : ${escapeHTML(item.category)} · 📍 ${escapeHTML(item.city)}</div></div>
  <div class="panel section"><h2>Commentaires (${state.comments.length + 6})</h2>${state.comments.map(c=>`<div class="comment"><strong>${c.user}</strong><p style="margin:0">${escapeHTML(c.text)}</p><button class="btn btn-soft" data-reply="${escapeHTML(c.user)}">Répondre</button></div>`).join("")}
  <form id="comment-form" class="section"><div class="field"><label for="comment">Ajouter un commentaire</label><textarea id="comment" name="comment" placeholder="Écrivez votre commentaire..." required></textarea></div><button class="btn btn-primary">Publier le commentaire</button></form></div></section>
  <aside class="panel product-info"><span class="pill">${item.type}</span><h1 style="font-size:30px">${item.title}</h1><div class="price">${money(item.price)}${item.id===3?"/mois":""}</div><p>${item.condition} · ${item.category}</p><div class="notice">✓ Vendeur vérifié <br>📍 ${item.city} · ${item.age}</div><div class="actions"><button class="btn btn-primary" id="contact-seller">💬 Contacter</button><button class="btn btn-outline" data-fav="${item.id}">${state.favorites.has(item.id)?"♥ Favoris":"♡ Favoris"}</button></div><div class="section"><h3>Profil vendeur</h3><div class="profile-head"><div class="avatar">${item.seller.split(" ").map(s=>s[0]).slice(0,2).join("")}</div><div><strong>${item.seller}</strong><div class="meta">★ 4.9 · Vendeur vérifié</div><a class="text-link small" href="seller.html">Voir le profil</a></div></div></div></aside></div>`);
}

mountPage("detail", () => detailPage(currentRoute().id));

})();


// --- favorites.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function favoritesPage() {
  const items = listings.filter(x => state.favorites.has(x.id));
  shell(`${pageTitle("Mes favoris", "Retrouvez ici les annonces que vous avez enregistrées.")}${items.length ? cards(items) : `<div class="empty"><div class="emoji">♡</div><h2>Aucun favori pour le moment</h2><p>Ajoutez une annonce à vos favoris en cliquant sur le cœur.</p><a href="search.html" class="btn btn-primary">Explorer les annonces</a></div>`}`);
}

mountPage("favorites", favoritesPage);

})();


// --- find-for-me.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function findForMePage() {
  shell(`${pageTitle("Trouver pour moi ✨", "Décrivez simplement ce que vous cherchez. QuickAnnonces trouve les annonces les plus pertinentes.")}<div class="two-col"><section class="panel"><form id="find-form"><div class="field"><label>💬 Que recherchez-vous ?</label><textarea name="prompt" placeholder="Ex. : Je recherche un ordinateur portable pour mes études, 16 Go RAM, budget 4 000 DH maximum." required></textarea></div><button class="btn btn-primary">✨ Trouver pour moi</button></form><p class="small">Exemple : « Je cherche un appartement 2 chambres près du centre, moins de 5 000 DH. »</p></section><section class="panel"><h2>Résultats personnalisés</h2><div id="personal-results">${matchRow({emoji:"💻",title:"Laptop Lenovo",price:3800,id:4},98)}${matchRow({emoji:"💻",title:"HP Pavilion",price:3950,id:4},91)}${matchRow({emoji:"💻",title:"Dell Latitude",price:3500,id:4},84)}</div></section></div>`);
}

mountPage("find-for-me", findForMePage);

})();


// --- forgot.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function forgotPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Récupérez votre compte</h1><p>Nous vous aiderons à retrouver l’accès à votre espace.</p></aside><section class="auth-form"><h2>Mot de passe oublié ?</h2><p>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p><form id="forgot-form"><div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div><button class="btn btn-primary btn-block">Envoyer le lien de réinitialisation</button></form><p class="center"><a class="text-link" href="login.html">← Retour à la connexion</a></p></section></div>`);
}

mountPage("forgot", forgotPage);

})();


// --- index.js ---
(() => {
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


// --- login.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function loginPage(register = false) {
  const adminLogin = currentRoute().page === "admin-login";
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":adminLogin?"Espace d’administration":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":adminLogin?"Connectez-vous pour examiner et gérer toutes les annonces.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":adminLogin?"Connexion administrateur":"Connexion client"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  ${!register&&!adminLogin?`<div class="login-choice"><a class="btn btn-primary" href="login.html">Connexion client</a><a class="btn btn-outline" href="admin-login.html">Connexion administrateur</a></div>`:""}
  <form id="auth-form" data-role="${adminLogin?"admin":"customer"}">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required ${register?'minlength="8"':""}></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="8"></div>`:`<div style="text-align:right"><a class="text-link small" href="forgot.html">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":adminLogin?"Vous êtes un client ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="${register||adminLogin?"login":"register"}.html">${register||adminLogin?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}

mountPage("login", () => loginPage(false));

})();


// --- logout.js ---
(() => {
(() => {
  const { mountPage, shell, api, state } = window.QuickAnnonces;
  let status = "pending";
  let errorMessage = "";

  function render() {
    const content = status === "success"
      ? `<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>À bientôt !</h1><p>Votre session est terminée. Merci d’avoir utilisé QuickAnnonces.</p></aside><section class="auth-form"><h2>Vous êtes déconnecté(e)</h2><p>Vous pouvez revenir parcourir les annonces ou vous connecter à nouveau à tout moment.</p><div class="actions"><a class="btn btn-primary" href="login.html">Se connecter</a><a class="btn btn-outline" href="index.html">Retour à l’accueil</a></div></section></div>`
      : status === "error"
        ? `<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>Déconnexion</h1><p>Nous n’avons pas pu terminer la déconnexion.</p></aside><section class="auth-form"><h2>Une erreur est survenue</h2><p role="alert">${window.QuickAnnonces.escapeHTML(errorMessage)}</p><div class="actions"><button class="btn btn-primary" id="retry-logout" type="button">Réessayer</button><a class="btn btn-outline" href="index.html">Retour à l’accueil</a></div></section></div>`
        : `<div class="auth-wrap"><section class="auth-form"><h2>Déconnexion en cours…</h2><p role="status" aria-live="polite">Nous fermons votre session de manière sécurisée.</p></section></div>`;
    shell(content);
    document.querySelector("#retry-logout")?.addEventListener("click", logout);
  }

  async function logout() {
    status = "pending";
    render();
    try {
      await api.send("/api/auth.php?action=logout", "POST", {});
      state.user = null;
      state.favorites.clear();
      status = "success";
    } catch (error) {
      errorMessage = error.message || "Veuillez réessayer.";
      status = "error";
    }
    render();
  }

  mountPage("logout", logout);
})();

})();


// --- messages.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

async function messagesPage() {
  if (!state.user) { window.QuickAnnonces.navigate("login.html"); return; }
  try {
    const result = await window.QuickAnnonces.api.get("/api/conversations.php");
    const conversations = result.data;
    const params = new URLSearchParams(location.search);
    const selectedId = Number(params.get("conversation")) || Number(conversations[0]?.id) || 0;
    const selected = conversations.find(item => Number(item.id) === selectedId);
    const messages = selected ? (await window.QuickAnnonces.api.get(`/api/messages.php?conversation_id=${selectedId}`)).data : [];
    shell(`<div class="page-title"><h1>Messages</h1><p>Échangez directement avec les vendeurs et les acheteurs.</p></div>
    <div class="panel chat-layout"><aside class="chat-list"><h3>Conversations</h3>${conversations.map(item=>`<a class="chat-person ${Number(item.id)===selectedId?"active":""}" href="messages.html?conversation=${item.id}"><strong>${escapeHTML(item.other_name)}</strong><div class="meta">${escapeHTML(item.listing_title)} · ${escapeHTML(item.last_message || "Nouvelle conversation")}</div></a>`).join("") || `<p class="small muted">Aucune conversation. Contactez un vendeur depuis une annonce.</p>`}</aside>
    <section class="chat-window">${selected ? `<div class="chat-head">${escapeHTML(selected.other_name)} <span class="meta">· À propos de ${escapeHTML(selected.listing_title)}</span></div><div class="messages" id="messages">${messages.map(m=>`<div class="bubble ${Number(m.sender_id)===Number(state.user.id)?"mine":""}">${escapeHTML(m.body)}</div>`).join("")}</div><form class="chat-compose" id="message-form"><input name="message" placeholder="Écrire un message..." required><button class="btn btn-primary">Envoyer</button></form>` : `<div class="empty"><h2>Vos conversations apparaîtront ici</h2><p>Ouvrez une annonce et choisissez Contacter pour démarrer une discussion.</p></div>`}</section></div>`);
  } catch (error) { toast(error.message); }
}

mountPage("messages", messagesPage);

})();


// --- my-ads.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function myAdsPage() {
  const myItems = listings;
  const submitted = new URLSearchParams(location.search).get("submitted");
  shell(`<div class="section-heading"><div>${pageTitle("Mes annonces", "Gérez vos publications et suivez leur statut de modération.")}</div><a href="publish.html" class="btn btn-primary">＋ Publier une annonce</a></div>
  ${submitted ? `<div class="notice success submit-confirmation"><strong>✓ Annonce envoyée pour approbation</strong><br>Elle apparaît dans la file d’attente admin et sera visible publiquement après validation. <a class="text-link" href="detail.html?id=${encodeURIComponent(submitted)}">Voir le récapitulatif →</a></div>` : ""}
  <div class="stats"><div class="stat"><strong>${myItems.length}</strong><span>Mes annonces</span></div><div class="stat"><strong>${myItems.filter(x=>x.status==="En attente").length}</strong><span>En attente</span></div><div class="stat"><strong>${myItems.filter(x=>x.status === "Approuvee").length}</strong><span>Approuvées</span></div><div class="stat"><strong>${myItems.filter(x=>x.status === "Refusee").length}</strong><span>Refusées</span></div></div>
  ${myItems.length ? `<div class="my-listings">${myItems.map(x=>`<article class="my-listing"><div class="mini-visual">${x.image ? `<img class="admin-thumb" src="${x.image}" alt="">` : x.emoji}</div><div class="my-listing-info"><strong>${escapeHTML(x.title)}</strong><div class="price">${money(x.price)}</div><span class="status-badge status-${x.status === "Approuvee" ? "approved" : x.status === "Refusee" ? "rejected" : "pending"}">${escapeHTML(statusText(x.status))}</span></div><a class="btn btn-outline" href="detail.html?id=${x.id}">Voir</a></article>`).join("")}</div>` : `<div class="empty"><div class="emoji">📦</div><h2>Vous n’avez pas encore publié d’annonce</h2><p>Votre première publication s’affichera ici avec son statut de validation.</p><a class="btn btn-primary" href="publish.html">Créer une annonce</a></div>`}`, "my-ads");
}

mountPage("my-ads", async () => {
  try {
    const result = await window.QuickAnnonces.api.get("/api/my-listings.php");
    listings.splice(0, listings.length, ...result.data);
    myAdsPage();
  } catch (error) {
    toast(error.message);
    myAdsPage();
  }
});

})();


// --- publish.js ---
(() => {
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


// --- quickmatch.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function quickmatchPage() {
  shell(`<div class="two-col"><section>${pageTitle("QuickMatch ✨", "Notre fonctionnalité spéciale : nous trouvons automatiquement les annonces qui correspondent à votre recherche.")}<div class="panel"><div class="field"><label>🔎 Je recherche</label><input id="match-query" value="iPhone 14 128 Go"></div><button id="run-match" class="btn btn-primary">Trouver les correspondances</button><button id="create-alert" class="btn btn-outline">🔔 Créer une alerte</button></div><div class="section" id="match-detail"><div class="product-visual" style="min-height:200px">📱</div><h2 class="section">iPhone 14 — Excellent état</h2><div class="price">4 900 DH</div><div class="notice success">✓ Vendeur vérifié · ★ 4.9</div><p>Description : téléphone en excellent état, batterie 92%, avec boîte et accessoires.</p><button class="btn btn-primary" data-go-detail="10">💬 Contacter</button> <button class="btn btn-outline" data-fav="10">♡ Ajouter aux favoris</button></div></section>
  <aside><div class="panel"><h2>3 correspondances trouvées</h2><p>Les annonces les plus proches de votre recherche.</p>${matchRow(listings[9],98)}${matchRow(listings[10],90)}${matchRow(listings[3],82)}</div></aside></div>`);
}

mountPage("quickmatch", quickmatchPage);

})();


// --- register.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function loginPage(register = false) {
  const adminLogin = currentRoute().page === "admin-login";
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":adminLogin?"Espace d’administration":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":adminLogin?"Connectez-vous pour examiner et gérer toutes les annonces.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":adminLogin?"Connexion administrateur":"Connexion client"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  ${!register&&!adminLogin?`<div class="login-choice"><a class="btn btn-primary" href="login.html">Connexion client</a><a class="btn btn-outline" href="admin-login.html">Connexion administrateur</a></div>`:""}
  <form id="auth-form" data-role="${adminLogin?"admin":"customer"}">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required ${register?'minlength="8"':""}></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="8"></div>`:`<div style="text-align:right"><a class="text-link small" href="forgot.html">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":adminLogin?"Vous êtes un client ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="${register||adminLogin?"login":"register"}.html">${register||adminLogin?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}

mountPage("register", () => loginPage(true));

})();


// --- reset.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function resetPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Un nouveau départ</h1><p>Choisissez un nouveau mot de passe sécurisé.</p></aside><section class="auth-form"><h2>Créer un nouveau mot de passe</h2><form id="reset-form"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" required minlength="6"></div><div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" required minlength="6"></div><button class="btn btn-primary btn-block">Réinitialiser le mot de passe</button></form></section></div>`);
}

mountPage("reset", resetPage);

})();


// --- search.js ---
(() => {
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


// --- security.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function securityPage() {
  const features = [["✓","Identité vérifiée","Le profil a confirmé son identité."],["✓","Téléphone vérifié","Numéro confirmé par SMS."],["✓","Annonce contrôlée","Contenu vérifié automatiquement."],["★","Bon historique","Évaluations positives des utilisateurs."]];
  shell(`${pageTitle("Sécurité & confiance 🛡️", "Des indicateurs simples pour acheter et vendre plus sereinement.")}<div class="two-col"><section class="panel">${features.map(f=>`<div class="profile-head" style="padding:17px 0;border-bottom:1px solid var(--line)"><div class="avatar">${f[0]}</div><div><h3>${f[1]}</h3><p style="margin:0">${f[2]}</p></div></div>`).join("")}</section><aside class="panel"><h2>Indice de confiance</h2><p>Les profils et les annonces peuvent afficher des indicateurs utiles pour vous aider à prendre une décision.</p><div class="notice success">✓ Identité vérifiée<br>✓ Téléphone vérifié<br>✓ Réponse rapide<br>✓ Historique positif</div><p class="small">Les indicateurs sont des exemples de maquette et ne représentent pas une vérification réelle.</p></aside></div>`);
}

mountPage("security", securityPage);

})();


// --- seller.js ---
(() => {
const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function sellerPage() {
  shell(`${pageTitle("Profil vendeur", "Consultez les informations publiques du vendeur.")}<div class="panel"><div class="profile-head"><div class="avatar">YB</div><div><h2>Yasmine B.</h2><div class="meta">✓ Profil vérifié · Membre depuis 2026</div><p>★ 4.9 · 38 évaluations</p></div></div><div class="stats"><div class="stat"><strong>23</strong><span>Annonces</span></div><div class="stat"><strong>4.9</strong><span>Note moyenne</span></div><div class="stat"><strong>38</strong><span>Évaluations</span></div><div class="stat"><strong>Rapide</strong><span>Réponse</span></div></div><h2>Ses annonces</h2>${cards([listings[0], listings[9], listings[10]], "three")}</div>`);
}

mountPage("seller", sellerPage);

})();
