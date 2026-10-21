const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function sellerPage() {
  shell(`${pageTitle("Profil vendeur", "Consultez les informations publiques du vendeur.")}<div class="panel"><div class="profile-head"><div class="avatar">YB</div><div><h2>Yasmine B.</h2><div class="meta">✓ Profil vérifié · Membre depuis 2026</div><p>★ 4.9 · 38 évaluations</p></div></div><div class="stats"><div class="stat"><strong>23</strong><span>Annonces</span></div><div class="stat"><strong>4.9</strong><span>Note moyenne</span></div><div class="stat"><strong>38</strong><span>Évaluations</span></div><div class="stat"><strong>Rapide</strong><span>Réponse</span></div></div><h2>Ses annonces</h2>${cards([listings[0], listings[9], listings[10]], "three")}</div>`);
}

mountPage("seller", sellerPage);
