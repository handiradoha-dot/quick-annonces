const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function favoritesPage() {
  const items = listings.filter(x => state.favorites.has(x.id));
  shell(`${pageTitle("Mes favoris", "Retrouvez ici les annonces que vous avez enregistrées.")}${items.length ? cards(items) : `<div class="empty"><div class="emoji">♡</div><h2>Aucun favori pour le moment</h2><p>Ajoutez une annonce à vos favoris en cliquant sur le cœur.</p><a href="search.html" class="btn btn-primary">Explorer les annonces</a></div>`}`);
}

mountPage("favorites", favoritesPage);
