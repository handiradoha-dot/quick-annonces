const { mountPage, listings, categories, shell, pageTitle, escapeHTML, money } = window.QuickAnnonces;
function quickmatchPage() {
  const categoryOptions = categories.map(category => `<option>${escapeHTML(category)}</option>`).join('');
  shell(`<div class="two-col"><section>${pageTitle('QuickMatch ✨', 'Trouvez les annonces publiées qui correspondent à vos mots-clés.')}
    <div class="panel"><div class="field"><label for="match-query">Je recherche</label><input id="match-query" placeholder="Ex. : téléphone, appartement..."></div>
    <div class="field"><label for="match-category">Catégorie</label><select id="match-category"><option value="">Toutes les catégories</option>${categoryOptions}</select></div>
    <button id="run-match" class="btn btn-primary">Trouver les correspondances</button> <a class="btn btn-outline" href="alerts.html">Créer une alerte</a></div>
    <div class="section" id="match-results"></div></section><aside class="panel"><h2>Annonces récentes</h2>${listings.filter(item => item.status === 'Approuvee').slice(0, 4).map(item => `<a class="match-row" href="detail.html?id=${item.id}"><div class="mini-visual">${item.image ? `<img src="${escapeHTML(item.image)}" alt="">` : item.emoji}</div><div><strong>${escapeHTML(item.title)}</strong><div class="price">${money(item.price)}</div><div class="meta">${escapeHTML(item.category)} · ${escapeHTML(item.city)}</div></div></a>`).join('') || '<p class="meta">Aucune annonce approuvée pour le moment.</p>'}</aside></div>`);
}
mountPage('quickmatch', quickmatchPage);
