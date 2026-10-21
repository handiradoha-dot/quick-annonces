const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function dashboardPage() {
  shell(`${pageTitle("Bonjour 👋", "Voici ce qui se passe sur QuickAnnonces.")}<div class="stats"><div class="stat"><strong>12</strong><span>Annonces consultées</span></div><div class="stat"><strong>4</strong><span>Correspondances</span></div><div class="stat"><strong>2</strong><span>Alertes actives</span></div><div class="stat"><strong>3</strong><span>Messages</span></div></div><div class="panel"><h2>Pour vous</h2><div class="notice">✨ 3 nouvelles annonces correspondent à vos recherches <a class="text-link" href="quickmatch.html">Voir les matchs →</a></div><div class="actions"><a class="btn btn-primary" href="messages.html">Ouvrir les messages</a><a class="btn btn-outline" href="alerts.html">Gérer mes alertes</a><a class="btn btn-outline" href="my-ads.html">Mes annonces</a></div></div>`);
}

mountPage("dashboard", dashboardPage);
