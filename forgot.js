const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function forgotPage() {
  shell(`<div class="auth-wrap"><aside class="auth-side"><span class="logo"><span class="logo-mark">Q</span>QuickAnnonces</span><h1>Récupérez votre compte</h1><p>Nous vous aiderons à retrouver l’accès à votre espace.</p></aside><section class="auth-form"><h2>Mot de passe oublié ?</h2><p>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.</p><form id="forgot-form"><div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div><button class="btn btn-primary btn-block">Envoyer le lien de réinitialisation</button></form><p class="center"><a class="text-link" href="login.html">← Retour à la connexion</a></p></section></div>`);
}

mountPage("forgot", forgotPage);
