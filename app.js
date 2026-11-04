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
const apiEnabled = location.protocol === "http:" || location.protocol === "https:";
async function apiRequest(path, options = {}) {
  const response = await fetch(`api/${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Une erreur serveur est survenue.");
  return payload;
}
const savedFavorites = readStore("favorites", []);
let currentUser = readStore("currentUser", null);
const savedUsers = readStore("users", []);
const users = Array.isArray(savedUsers) ? savedUsers : [];
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
  { id: 12, title: "Montre connectée", price: 700, category: "Électronique", city: "Tanger", age: "Hier", type: "À vendre", emoji: "⌚", condition: "Très bon état", description: "Montre connectée avec chargeur.", seller: "Sarah El Idrissi", verified: true },
  { id: 13, title: "Studio lumineux centre-ville", price: 4200, category: "Immobilier", city: "Tanger", age: "Il y a 4 h", type: "À louer", emoji: "🏢", condition: "1 pièce", description: "Studio meublé proche des commerces et des transports.", seller: "Nadia Amrani", verified: true },
  { id: 14, title: "Villa avec jardin", price: 1850000, category: "Immobilier", city: "Tétouan", age: "Hier", type: "À vendre", emoji: "🏡", condition: "4 chambres", description: "Villa familiale avec jardin et garage dans un quartier calme.", seller: "Karim Alaoui", verified: true },
  { id: 15, title: "Bureau à louer", price: 3500, category: "Immobilier", city: "Rabat", age: "Il y a 1 j", type: "À louer", emoji: "🏬", condition: "Bon état", description: "Bureau équipé, idéal pour une petite équipe ou une activité indépendante.", seller: "Salma Idrissi", verified: false },
  { id: 16, title: "Terrain constructible", price: 450000, category: "Immobilier", city: "Marrakech", age: "Il y a 2 j", type: "À vendre", emoji: "🌳", condition: "600 m²", description: "Terrain titré dans une zone en développement.", seller: "Hicham B.", verified: true },
  { id: 17, title: "Dacia Sandero", price: 78000, category: "Véhicules", city: "Rabat", age: "Il y a 5 h", type: "À vendre", emoji: "🚘", condition: "Très bon état", description: "Dacia Sandero économique, entretien suivi et faible kilométrage.", seller: "Mehdi R.", verified: true },
  { id: 18, title: "Scooter 125cc", price: 14500, category: "Véhicules", city: "Tétouan", age: "Hier", type: "À vendre", emoji: "🛵", condition: "Bon état", description: "Scooter pratique pour les trajets quotidiens en ville.", seller: "Ayoub N.", verified: false },
  { id: 19, title: "Toyota Corolla hybride", price: 165000, category: "Véhicules", city: "Casablanca", age: "Il y a 2 j", type: "À vendre", emoji: "🚗", condition: "Excellent état", description: "Toyota Corolla hybride avec carnet d'entretien à jour.", seller: "Samir El Fassi", verified: true },
  { id: 20, title: "Robe traditionnelle", price: 1200, category: "Mode", city: "Fès", age: "Il y a 6 h", type: "À vendre", emoji: "👗", condition: "Neuf", description: "Robe traditionnelle élégante, disponible en plusieurs tailles.", seller: "Hajar Bennis", verified: true },
  { id: 21, title: "Veste en cuir", price: 950, category: "Mode", city: "Casablanca", age: "Hier", type: "À vendre", emoji: "🧥", condition: "Très bon état", description: "Veste en cuir véritable, taille M.", seller: "Othmane K.", verified: false },
  { id: 22, title: "Sac à main en cuir", price: 680, category: "Mode", city: "Rabat", age: "Il y a 1 j", type: "À vendre", emoji: "👜", condition: "Neuf", description: "Sac à main pratique et élégant avec plusieurs compartiments.", seller: "Meryem T.", verified: true },
  { id: 23, title: "Lunettes de soleil", price: 450, category: "Mode", city: "Marrakech", age: "Il y a 2 j", type: "À vendre", emoji: "🕶️", condition: "Neuf", description: "Lunettes de soleil avec protection UV.", seller: "Youssef A.", verified: false },
  { id: 24, title: "Table à manger en bois", price: 3200, category: "Maison & Jardin", city: "Tanger", age: "Il y a 7 h", type: "À vendre", emoji: "🪑", condition: "Très bon état", description: "Grande table en bois massif pour six personnes.", seller: "Nawal S.", verified: true },
  { id: 25, title: "Plantes d'intérieur", price: 180, category: "Maison & Jardin", city: "Rabat", age: "Hier", type: "À vendre", emoji: "🪴", condition: "Bon état", description: "Lot de plantes d'intérieur faciles à entretenir.", seller: "Imane Bennis", verified: false },
  { id: 26, title: "Barbecue compact", price: 950, category: "Maison & Jardin", city: "Casablanca", age: "Il y a 2 j", type: "À vendre", emoji: "🔥", condition: "Neuf", description: "Barbecue compact idéal pour balcon ou terrasse.", seller: "Rachid M.", verified: true },
  { id: 27, title: "Raquette de tennis", price: 900, category: "Sports", city: "Tanger", age: "Il y a 3 h", type: "À vendre", emoji: "🎾", condition: "Très bon état", description: "Raquette légère adaptée aux débutants et joueurs réguliers.", seller: "Omar El Amrani", verified: true },
  { id: 28, title: "Tapis de yoga", price: 260, category: "Sports", city: "Rabat", age: "Hier", type: "À vendre", emoji: "🧘", condition: "Neuf", description: "Tapis de yoga antidérapant, facile à transporter.", seller: "Sara L.", verified: false },
  { id: 29, title: "Haltères réglables", price: 750, category: "Sports", city: "Casablanca", age: "Il y a 1 j", type: "À vendre", emoji: "🏋️", condition: "Bon état", description: "Paire d'haltères réglables pour entraînement à domicile.", seller: "Bilal E.", verified: true },
  { id: 30, title: "Ballon de football", price: 220, category: "Sports", city: "Fès", age: "Il y a 2 j", type: "À vendre", emoji: "⚽", condition: "Neuf", description: "Ballon de football taille 5, idéal pour entraînement et loisirs.", seller: "Anas J.", verified: false },
  { id: 31, title: "Cours particuliers d'anglais", price: 150, category: "Services", city: "Tanger", age: "Il y a 4 h", type: "Je propose", emoji: "📚", condition: "En ligne ou sur place", description: "Cours d'anglais adaptés aux étudiants et aux professionnels.", seller: "Lina B.", verified: true },
  { id: 32, title: "Réparation d'ordinateurs", price: 200, category: "Services", city: "Tétouan", age: "Hier", type: "Je propose", emoji: "🔧", condition: "Intervention rapide", description: "Diagnostic et réparation de PC à domicile ou en atelier.", seller: "Hamza O.", verified: true },
  { id: 33, title: "Photographe pour événements", price: 1200, category: "Services", city: "Rabat", age: "Il y a 1 j", type: "Je propose", emoji: "📷", condition: "Professionnel", description: "Photographe disponible pour mariages, fêtes et événements privés.", seller: "Kawtar M.", verified: true },
  { id: 34, title: "Livraison et courses", price: 50, category: "Services", city: "Casablanca", age: "Il y a 2 j", type: "Je propose", emoji: "🛵", condition: "Disponible 7j/7", description: "Service de livraison rapide pour courses et petits colis.", seller: "Yassine B.", verified: false },
  { id: 35, title: "Création de logos", price: 500, category: "Services", city: "Marrakech", age: "Il y a 3 j", type: "Je propose", emoji: "🎨", condition: "Sur mesure", description: "Création de logos et identités visuelles pour entreprises et projets.", seller: "Salim R.", verified: true }
];
const legacyListings = (() => { try { return JSON.parse(localStorage.getItem("quickannonces-listings") || "null"); } catch { return null; } })();
const savedListings = readStore("listings", legacyListings);
// Ignore malformed local data instead of letting one bad entry stop every page
// from rendering during app initialization.
if (Array.isArray(savedListings)) {
  const validListings = savedListings.filter(item => item && typeof item === "object" && Number.isFinite(Number(item.id)));
  if (validListings.length === savedListings.length) {
    const savedIds = new Set(validListings.map(item => Number(item.id)));
    listings.splice(0, listings.length, ...validListings, ...listings.filter(item => item.id >= 13 && !savedIds.has(item.id)));
  }
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
  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : "";
  const accountActions = currentUser
    ? `<a class="btn btn-outline user-name" href="profile.html">${escapeHTML(userName || "Mon profil")}</a><button class="btn btn-primary" id="logout" type="button">Se déconnecter</button><a class="btn btn-primary" href="publish.html">＋ Publier</a>`
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
    <form class="nav-search" id="nav-search"><input name="q" value="${escapeHTML(state.query)}" placeholder="Rechercher une annonce..." aria-label="Rechercher une annonce" autocomplete="off"></form>
    <div class="nav-actions">${accountActions}</div>
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
let databaseReady = Promise.resolve();
function mountPage(page, renderer) { activeRender = renderer; databaseReady.then(() => activeRender?.()); }

function bindGlobal() {
  $("#logout")?.addEventListener("click", () => {
    const finish = () => {
      localStorage.removeItem("qa-currentUser");
      toast("Vous êtes déconnecté.");
      setTimeout(() => { location.href = "index.html"; }, 250);
    };
    if (!apiEnabled) return finish();
    apiRequest("auth.php?action=logout", { method: "POST" }).then(finish).catch(error => toast(error.message));
  });
  const navSearch = $("#nav-search");
  const navInput = navSearch?.querySelector("input");
  let searchTimer;
  const runNavSearch = value => {
    state.query = value.trim();
    saveFilters();
    const query = state.query ? `?q=${encodeURIComponent(state.query)}` : "";
    if (currentRoute().page === "search") {
      history.replaceState(null, "", `search.html${query}`);
      window.QuickAnnonces.liveSearch?.(state.query);
      return;
    }
    location.href = `search.html${query}`;
  };
  navInput?.addEventListener("input", e => {
    const value = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => runNavSearch(value), 350);
  });
  if (navSearch) navSearch.addEventListener("submit", e => { e.preventDefault(); clearTimeout(searchTimer); runNavSearch(new FormData(navSearch).get("q")); });
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
  $("#results-search")?.addEventListener("submit", e => {
    e.preventDefault();
    state.query = new FormData(e.currentTarget).get("q").trim();
    saveFilters();
    history.replaceState(null, "", `search.html${state.query ? `?q=${encodeURIComponent(state.query)}` : ""}`);
    activeRender();
  });
  $("#results-query")?.addEventListener("input", e => {
    const value = e.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = value;
      saveFilters();
      history.replaceState(null, "", `search.html${state.query ? `?q=${encodeURIComponent(state.query)}` : ""}`);
      window.QuickAnnonces.liveSearch?.(state.query);
    }, 150);
  });
  const applyFilters = form => {
    const fd = new FormData(form);
    state.category = fd.get("category");
    state.type = fd.get("type");
    state.sort = fd.get("sort");
    saveFilters();
    activeRender();
  };
  $("#filter-form")?.addEventListener("submit", e => { e.preventDefault(); applyFilters(e.currentTarget); });
  $("#filter-form")?.addEventListener("change", e => {
    if (e.target.matches("select")) applyFilters(e.currentTarget);
  });
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
    const createListing = async image => {
      const newItem = { id: Math.max(...listings.map(x=>x.id))+1, title: fd.get("title").trim(), price: Number(fd.get("price")), category: fd.get("category"), city: fd.get("city"), age: "A l'instant", type: form.dataset.type || "A vendre", emoji: "📦", image, condition: fd.get("condition").trim(), description: fd.get("description").trim(), seller: "Mariam Tahayekt", verified: false, status: "En attente" };
      if (apiEnabled) {
        try {
          const result = await apiRequest("listings.php", { method: "POST", body: JSON.stringify({ title: newItem.title, price: newItem.price, category: newItem.category, city: newItem.city, type: newItem.type, condition: newItem.condition, description: newItem.description, image: "" }) });
          location.href = `my-ads.html?submitted=${result.id}`;
        } catch (error) { toast(error.message); }
        return;
      }
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
  $("#auth-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const isRegister = fd.has("confirm");
    const role = form.dataset.role;
    if (isRegister && fd.get("password") !== fd.get("confirm")) return toast("Les mots de passe ne correspondent pas.");
    const email = String(fd.get("email")).trim().toLowerCase();
    const registeredUser = users.find(user => user.email === email);
    const user = role === "admin"
      ? { firstName: "Admin", lastName: "", email, role: "admin" }
      : {
        firstName: String(fd.get("firstName") || registeredUser?.firstName || email.split("@")[0]).trim(),
        lastName: String(fd.get("lastName") || registeredUser?.lastName || "").trim(),
        email,
        role: "customer"
      };
    if (apiEnabled) {
      try {
        const payload = await apiRequest(`auth.php?action=${isRegister ? "register" : "login"}`, {
          method: "POST",
          body: JSON.stringify({
            firstName: fd.get("firstName"),
            lastName: fd.get("lastName"),
            email,
            password: fd.get("password")
          })
        });
        const serverUser = payload.user;
        const names = String(serverUser.full_name || "").split(/\s+/);
        writeStore("currentUser", {
          id: serverUser.id,
          firstName: names.shift() || "",
          lastName: names.join(" "),
          email: serverUser.email,
          role: serverUser.role
        });
        toast("Connexion réussie.");
        return go(serverUser.role === "admin" ? "admin" : "dashboard");
      } catch (error) {
        return toast(error.message);
      }
    }
    if (isRegister && role !== "admin") {
      users.push({ ...user, password: String(fd.get("password")) });
      writeStore("users", users);
    }
    writeStore("currentUser", user);
    toast("Connexion réussie.");
    go(role === "admin" ? "admin" : "dashboard");
  });
  $("#profile-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updatedUser = {
      ...readStore("currentUser", {}),
      firstName: String(fd.get("firstName")).trim(),
      lastName: String(fd.get("lastName")).trim()
    };
    if (apiEnabled) {
      try {
        await apiRequest("profile.php", { method: "PUT", body: JSON.stringify(updatedUser) });
      } catch (error) {
        return toast(error.message);
      }
    }
    writeStore("currentUser", updatedUser);
    const savedUsers = readStore("users", []);
    const userIndex = savedUsers.findIndex(user => user.email === updatedUser.email);
    if (userIndex >= 0) {
      savedUsers[userIndex] = { ...savedUsers[userIndex], ...updatedUser };
      writeStore("users", savedUsers);
    }
    toast("Profil mis à jour.");
    setTimeout(() => { location.href = "profile.html"; }, 250);
  });
  $("#forgot-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Lien simulé : aucun e-mail n’a été envoyé."); e.currentTarget.insertAdjacentHTML("beforeend", '<div class="notice success">✓ Demande traitée en mode démonstration.</div>'); });
  $("#reset-form")?.addEventListener("submit", e => { e.preventDefault(); const fd = new FormData(e.currentTarget); if(fd.get("password")!==fd.get("confirm")) return toast("Les mots de passe ne correspondent pas."); toast("Mot de passe mis à jour en mode démo."); go("login"); });
  $("#edit-profile")?.addEventListener("click", () => toast("Modification du profil : à connecter au backend."));
  $("#run-match")?.addEventListener("click", () => { state.query = $("#match-query").value; toast("Correspondances recalculées pour la démo."); });
  $("#create-alert")?.addEventListener("click", () => go("alerts"));
  $("#find-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Résultats personnalisés simulés."); $("#personal-results").scrollIntoView({behavior:"smooth",block:"center"}); });
  $("#alert-form")?.addEventListener("submit", e => { e.preventDefault(); toast("Alerte activée en mode démo."); e.currentTarget.insertAdjacentHTML("beforeend", '<div class="notice success">🔔 Votre alerte de démonstration est activée.</div>'); });
  $$("[data-admin-filter]").forEach(btn => btn.addEventListener("click", () => { state.adminFilter = btn.dataset.adminFilter; activeRender(); }));
  $$("[data-moderate]").forEach(btn => btn.addEventListener("click", async () => { const item = listings.find(x => x.id === Number(btn.dataset.id)); if (!item) return; if (apiEnabled) { try { await apiRequest("listings.php", { method: "PATCH", body: JSON.stringify({ id: item.id, status: btn.dataset.moderate }) }); await window.QuickAnnonces.refreshListings("?admin=1"); } catch (error) { return toast(error.message); } } else { item.status = btn.dataset.moderate; saveListings(); } toast(`Annonce ${btn.dataset.moderate.toLowerCase()}.`); activeRender(); }));
  $$("[data-delete]").forEach(btn => btn.addEventListener("click", async () => { const item = listings.find(x => x.id === Number(btn.dataset.delete)); if (!item || !window.confirm("Supprimer cette annonce ?")) return; if (apiEnabled) { try { await apiRequest("listings.php", { method: "DELETE", body: JSON.stringify({ id: item.id }) }); } catch (error) { return toast(error.message); } } listings.splice(listings.indexOf(item), 1); saveListings(); toast("Annonce supprimée."); activeRender(); }));
  $("#admin-search")?.addEventListener("submit", e => { e.preventDefault(); state.adminQuery = new FormData(e.currentTarget).get("q").trim(); activeRender(); });
}

if (apiEnabled) {
  databaseReady = (async () => {
    try {
      const [session, data, categoryData] = await Promise.all([
        apiRequest("auth.php?action=session").catch(() => ({ user: null })),
        apiRequest("listings.php").then(result => ({ result })).catch(error => ({ error })),
        apiRequest("categories.php").catch(() => ({ categories: null }))
      ]);
      const serverUser = session.user;
      if (serverUser) {
        const names = String(serverUser.full_name || "").split(/\s+/);
        currentUser = { id: serverUser.id, firstName: names.shift() || "", lastName: names.join(" "), email: serverUser.email, role: serverUser.role };
        writeStore("currentUser", currentUser);
      } else { currentUser = null; localStorage.removeItem("qa-currentUser"); }
      listings.splice(0, listings.length, ...(Array.isArray(data.result?.listings) ? data.result.listings : []));
      if (data.error) setTimeout(() => toast(`Les annonces n'ont pas pu être chargées : ${data.error.message}`), 0);
      if (Array.isArray(categoryData.categories)) {
        categories.splice(0, categories.length, ...categoryData.categories.map(category => category.name));
        if (state.category !== "Toutes les catégories" && !categories.includes(state.category)) {
          state.category = "Toutes les catégories";
          saveFilters();
        }
      }
    } catch (error) {
      listings.splice(0, listings.length);
      setTimeout(() => toast(`Données indisponibles : ${error.message}`), 0);
    }
  })();
}

window.QuickAnnonces = { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, listingCard, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go, readStore, apiRequest, isApiEnabled: apiEnabled, getCurrentUser: () => currentUser, refreshListings: async (query = "") => { const data = await apiRequest(`listings.php${query}`); listings.splice(0, listings.length, ...(data.listings || [])); return listings; } };
})();
