const { mountPage, shell, pageTitle, apiRequest, isApiEnabled, getCurrentUser, toast } = window.QuickAnnonces;
async function dashboardPage() {
  if (!getCurrentUser()) { location.href = 'login.html'; return; }
  let counts = { listings: 0, favorites: 0, alerts: 0, conversations: 0 };
  if (isApiEnabled) {
    try {
      const [listings, favorites, alerts, messages] = await Promise.all([
        apiRequest('listings.php?mine=1'), apiRequest('favorites.php'), apiRequest('alerts.php'), apiRequest('messages.php')
      ]);
      counts = { listings: (listings.listings || []).length, favorites: (favorites.ids || []).length, alerts: (alerts.alerts || []).length, conversations: (messages.conversations || []).length };
    } catch (error) { toast(error.message); }
  }
  shell(`${pageTitle('Mon espace', 'Voici un aperçu de votre activité sur QuickAnnonces.')}
    <div class="stats"><div class="stat"><strong>${counts.listings}</strong><span>Mes annonces</span></div><div class="stat"><strong>${counts.favorites}</strong><span>Favoris</span></div><div class="stat"><strong>${counts.alerts}</strong><span>Alertes actives</span></div><div class="stat"><strong>${counts.conversations}</strong><span>Conversations</span></div></div>
    <div class="panel"><h2>Accès rapide</h2><div class="actions"><a class="btn btn-primary" href="publish.html">Publier une annonce</a><a class="btn btn-outline" href="messages.html">Messages</a><a class="btn btn-outline" href="alerts.html">Alertes</a><a class="btn btn-outline" href="my-ads.html">Mes annonces</a></div></div>`);
}
mountPage('dashboard', dashboardPage);
