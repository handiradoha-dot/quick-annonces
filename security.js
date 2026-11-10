const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function securityPage() {
  const features = [["✓","Identité vérifiée","Le profil a confirmé son identité."],["✓","Téléphone vérifié","Numéro confirmé par SMS."],["✓","Annonce contrôlée","Contenu vérifié automatiquement."],["★","Bon historique","Évaluations positives des utilisateurs."]];
  shell(`${pageTitle("Sécurité & confiance 🛡️", "Des indicateurs simples pour acheter et vendre plus sereinement.")}<div class="two-col"><section class="panel">${features.map(f=>`<div class="profile-head" style="padding:17px 0;border-bottom:1px solid var(--line)"><div class="avatar">${f[0]}</div><div><h3>${f[1]}</h3><p style="margin:0">${f[2]}</p></div></div>`).join("")}</section><aside class="panel"><h2>Indice de confiance</h2><p>Les profils et les annonces peuvent afficher des indicateurs utiles pour vous aider à prendre une décision.</p><div class="notice success">✓ Identité vérifiée<br>✓ Téléphone vérifié<br>✓ Réponse rapide<br>✓ Historique positif</div><p class="small">Les indicateurs sont des exemples de maquette et ne représentent pas une vérification réelle.</p></aside></div>`);
}

mountPage("security", securityPage);
