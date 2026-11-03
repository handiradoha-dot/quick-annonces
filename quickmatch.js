const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function quickmatchPage() {
  shell(`<div class="two-col"><section>${pageTitle("QuickMatch ✨", "Notre fonctionnalité spéciale : nous trouvons automatiquement les annonces qui correspondent à votre recherche.")}<div class="panel"><div class="field"><label>🔎 Je recherche</label><input id="match-query" value="iPhone 14 128 Go"></div><button id="run-match" class="btn btn-primary">Trouver les correspondances</button><button id="create-alert" class="btn btn-outline">🔔 Créer une alerte</button></div><div class="section" id="match-detail"><div class="product-visual" style="min-height:200px">📱</div><h2 class="section">iPhone 14 — Excellent état</h2><div class="price">4 900 DH</div><div class="notice success">✓ Vendeur vérifié · ★ 4.9</div><p>Description : téléphone en excellent état, batterie 92%, avec boîte et accessoires.</p><button class="btn btn-primary" data-go-detail="10">💬 Contacter</button> <button class="btn btn-outline" data-fav="10">♡ Ajouter aux favoris</button></div></section>
  <aside><div class="panel"><h2>3 correspondances trouvées</h2><p>Les annonces les plus proches de votre recherche.</p>${matchRow(listings[9],98)}${matchRow(listings[10],90)}${matchRow(listings[3],82)}</div></aside></div>`);
}

mountPage("quickmatch", quickmatchPage);
