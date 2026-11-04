const { mountPage, shell, pageTitle, escapeHTML, apiRequest, isApiEnabled, getCurrentUser, toast } = window.QuickAnnonces;
let alerts = [];
async function alertsPage() {
  if (isApiEnabled && getCurrentUser()) {
    try { alerts = (await apiRequest('alerts.php')).alerts || []; }
    catch (error) { toast(error.message); }
  }
  const alertRows = alerts.length ? alerts.map(alert => `<div class="notice"><strong>${escapeHTML(alert.query)}</strong><br>${[alert.category, alert.city, alert.max_price ? `≤ ${alert.max_price} DH` : ''].filter(Boolean).map(escapeHTML).join(' · ')}</div>`).join('') : '<p class="meta">Aucune alerte enregistrée.</p>';
  shell(`${pageTitle('Alertes', 'Enregistrez vos critères et retrouvez-les ici.')}
    <div class="two-col"><section class="panel"><h2>Mes alertes</h2>${alertRows}</section>
    <section class="panel"><h2>Créer une alerte</h2><form id="alert-form"><div class="field"><label>Recherche</label><input name="query" placeholder="Ex. : ordinateur portable" required maxlength="150"></div><div class="field"><label>Budget maximum (DH)</label><input name="budget" type="number" min="0" placeholder="4000"></div><div class="field"><label>Ville</label><input name="city" placeholder="Ex. : Tanger" maxlength="100"></div><button class="btn btn-primary">Activer l’alerte</button></form></section></div>`, 'alerts');
}
mountPage('alerts', alertsPage);
