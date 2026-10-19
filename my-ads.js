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
