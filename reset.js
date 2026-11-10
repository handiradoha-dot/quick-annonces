const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function resetPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Un nouveau départ</h1><p>Choisissez un nouveau mot de passe sécurisé.</p></aside><section class="auth-form"><h2>Créer un nouveau mot de passe</h2><form id="reset-form"><div class="field"><label>Nouveau mot de passe</label><input name="password" type="password" required minlength="6"></div><div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" required minlength="6"></div><button class="btn btn-primary btn-block">Réinitialiser le mot de passe</button></form></section></div>`);
}

mountPage("reset", resetPage);
