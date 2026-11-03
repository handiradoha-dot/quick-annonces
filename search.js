const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, listingCard, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function searchPage() {
  const urlQuery = new URLSearchParams(location.search).get("q");
  if (urlQuery !== null) state.query = urlQuery;
  const q = state.query || "";
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const getResults = query => {
    const needle = normalize(query);
    const results = listings.filter(x => {
      const searchable = normalize(Object.values(x).filter(value => value !== null && value !== undefined).join(" "));
      return x.status === "Approuvee"
        && (!needle || searchable.includes(needle))
        && (state.category === "Toutes les catégories" || x.category === state.category)
        && (state.type === "Tous" || x.type === state.type);
    });
    if (state.sort === "Prix croissant") results.sort((a,b) => a.price-b.price);
    if (state.sort === "Prix décroissant") results.sort((a,b) => b.price-a.price);
    return results;
  };
  const renderResults = query => {
    const results = getResults(query);
    const count = document.querySelector("#search-count");
    const container = document.querySelector("#search-results");
    const navInput = document.querySelector("#nav-search input");
    const resultsInput = document.querySelector("#results-query");
    if (navInput && document.activeElement !== navInput) navInput.value = query;
    if (resultsInput && document.activeElement !== resultsInput) resultsInput.value = query;
    if (count) count.textContent = `${results.length} annonce(s) trouvée(s)`;
    if (container) container.innerHTML = results.map(listingCard).join("") || `<div class="empty"><div class="emoji">🔎</div><h3>Aucune annonce trouvée</h3><p>Essayez de modifier vos critères de recherche.</p></div>`;
  };
  window.QuickAnnonces.liveSearch = query => {
    state.query = query;
    renderResults(query);
  };
  shell(`<div class="layout"><aside class="panel filters"><h3>Filtres</h3><form id="filter-form">
    <div class="field"><label for="category">Catégorie</label><select id="category" name="category"><option>Toutes les catégories</option>${categories.map(c=>`<option ${state.category===c?"selected":""}>${c}</option>`).join("")}</select></div>
    <div class="field"><label for="type">Type d’annonce</label><select id="type" name="type"><option>Tous</option>${["À vendre", "À louer", "Je recherche", "Je propose"].map(type => `<option ${state.type===type?"selected":""}>${type}</option>`).join("")}</select></div>
    <div class="field"><label for="sort">Trier par</label><select id="sort" name="sort"><option>Plus récent</option><option ${state.sort==="Prix croissant"?"selected":""}>Prix croissant</option><option ${state.sort==="Prix décroissant"?"selected":""}>Prix décroissant</option></select></div>
    <button class="btn btn-primary btn-block">Appliquer les filtres</button><button type="button" class="btn btn-outline btn-block" id="reset-filters" style="margin-top:8px">Réinitialiser</button></form></aside>
    <section><div class="section-heading"><div><h1>Recherche d’annonces</h1><p id="search-count">${getResults(q).length} annonce(s) trouvée(s)</p></div></div>
    <form class="searchbar" id="results-search"><input id="results-query" name="q" value="${escapeHTML(q)}" placeholder="Rechercher une annonce..." autocomplete="off"><button class="btn btn-primary">Rechercher</button></form>
    <div id="search-results" class="grid three" style="margin-top:20px">${getResults(q).map(listingCard).join("") || `<div class="empty"><div class="emoji">🔎</div><h3>Aucune annonce trouvée</h3><p>Essayez de modifier vos critères de recherche.</p></div>`}</div></section></div>`, "search");
}

mountPage("search", searchPage);
