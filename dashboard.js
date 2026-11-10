const { mountPage, shell, pageTitle, apiRequest, isApiEnabled, getCurrentUser, toast, listings, state, readStore } = window.QuickAnnonces;
async function dashboardPage() {
  if (!getCurrentUser()) { location.href = 'login.html'; return; }
  let counts = { listings: 0, favorites: 0, alerts: 0, conversations: 0 };
  if (isApiEnabled) {
    // allSettled : chaque compteur est indépendant. Si une API échoue (ex: table manquante),
    // les autres compteurs (dont "Mes annonces") s'affichent quand même.
    const [listings, favorites, alerts, messages] = await Promise.allSettled([
      apiRequest('listings.php?mine=1'), apiRequest('favorites.php'), apiRequest('alerts.php'), apiRequest('messages.php')
    ]);
    const value = result => result.status === 'fulfilled' ? result.value : {};
    counts = {
      listings: (value(listings).listings || []).length,
      favorites: (value(favorites).ids || []).length,
      alerts: (value(alerts).alerts || []).length,
      conversations: (value(messages).conversations || []).length
    };
    const failed = [listings, favorites, alerts, messages].find(result => result.status === 'rejected');
    if (failed) toast(failed.reason?.message || 'Certaines données du tableau de bord sont indisponibles.');
  } else {
    // Mode local : compteurs calculés depuis les données du navigateur.
    const me = getCurrentUser();
    const fullName = `${me.firstName || ''} ${me.lastName || ''}`.trim();
    counts = {
      listings: listings.filter(x => x.seller === fullName || x.seller === me.firstName).length,
      favorites: state.favorites.size,
      alerts: 0,
      conversations: readStore('conversations', []).length
    };
  }
  shell(`${pageTitle('Mon espace', 'Voici un aperçu de votre activité sur QuickAnnonces.')}
    <div class="stats"><div class="stat"><strong>${counts.listings}</strong><span>Mes annonces</span></div><div class="stat"><strong>${counts.favorites}</strong><span>Favoris</span></div><div class="stat"><strong>${counts.alerts}</strong><span>Alertes actives</span></div><div class="stat"><strong>${counts.conversations}</strong><span>Conversations</span></div></div>
    <div class="panel"><h2>Accès rapide</h2><div class="actions"><a class="btn btn-primary" href="publish.html">Publier une annonce</a><a class="btn btn-outline" href="messages.html">Messages</a><a class="btn btn-outline" href="alerts.html">Alertes</a><a class="btn btn-outline" href="my-ads.html">Mes annonces</a></div></div>`);
}
mountPage('dashboard', dashboardPage);