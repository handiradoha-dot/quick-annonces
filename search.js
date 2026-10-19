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

