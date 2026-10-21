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
