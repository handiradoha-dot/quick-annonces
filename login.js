const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function loginPage(register = false) {
  const adminLogin = location.pathname.endsWith("admin-login.html");
  shell(`<div class="auth-wrap"><aside class="auth-side"><a class="logo" href="index.html"><span class="logo-mark">Q</span>QuickAnnonces</a><h1>${register?"Rejoignez QuickAnnonces gratuitement.":adminLogin?"Espace d’administration":"Ravi de vous revoir !"}</h1><p>${register?"Créez un compte pour publier, enregistrer vos favoris et contacter les vendeurs.":adminLogin?"Connectez-vous pour examiner et gérer toutes les annonces.":"Connectez-vous pour publier et gérer vos annonces."}</p><div class="notice">✓ Des annonces près de chez vous<br>✓ Des échanges simples et directs<br>✓ Un espace pour gérer vos annonces</div></aside>
  <section class="auth-form"><h2>${register?"Créer un compte":adminLogin?"Connexion administrateur":"Connexion client"}</h2><p>${register?"Remplissez les informations ci-dessous.":"Accédez à votre espace QuickAnnonces."}</p>
  ${!register&&!adminLogin?`<div class="login-choice"><a class="btn btn-primary" href="login.html">Connexion client</a><a class="btn btn-outline" href="admin-login.html">Connexion administrateur</a></div>`:""}
  <form id="auth-form" data-role="${adminLogin?"admin":"customer"}">${register?`<div class="field"><label>Nom complet</label><input name="name" placeholder="Votre nom" required></div>`:""}
  <div class="field"><label>Adresse e-mail</label><input name="email" type="email" placeholder="exemple@email.com" required></div>
  <div class="field"><label>Mot de passe</label><input name="password" type="password" placeholder="••••••••" required minlength="6"></div>
  ${register?`<div class="field"><label>Confirmer le mot de passe</label><input name="confirm" type="password" placeholder="••••••••" required minlength="6"></div>`:`<div style="text-align:right"><a class="text-link small" href="forgot.html">Mot de passe oublié ?</a></div>`}
  <button class="btn btn-primary btn-block" style="margin-top:20px">${register?"Créer mon compte":"Se connecter"}</button></form>
  <p class="center small">${register?"Déjà inscrit ?":adminLogin?"Vous êtes un client ?":"Vous n’avez pas de compte ?"} <a class="text-link" href="${register||adminLogin?"login":"register"}.html">${register||adminLogin?"Se connecter":"Créer un compte"}</a></p></section></div>`);
}

mountPage("login", () => loginPage(false));
