const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function homePage() {
  shell(`<section class="hero">
    <div><span class="eyebrow">Bienvenue sur QuickAnnonces</span><h1>Trouvez. Publiez.<br>Connectez-vous.</h1>
    <p>Des annonces de vente et de recherche, avec des personnes réelles. Achetez, vendez ou recherchez facilement près de chez vous.</p>
    <form class="searchbar" id="hero-search"><input name="q" placeholder="🔎 Que recherchez-vous ?" aria-label="Que recherchez-vous ?"><button class="btn btn-primary">Rechercher</button></form>
    <div class="actions" style="margin-top:16px"><a class="btn btn-outline" href="search.html">Explorer les annonces</a><a class="btn btn-soft" href="publish.html">＋ Publier une annonce</a></div></div>
    <div class="hero-art"><div class="art-card"><div class="art-visual">🛍️</div><strong>Une bonne affaire près de vous</strong><small>Des annonces simples, des contacts directs.</small></div></div>
  </section>
  <section class="section"><div class="section-heading"><div><h2>Annonces récentes</h2><p>Découvrez les dernières annonces près de chez vous.</p></div><a class="text-link" href="search.html">Voir toutes les annonces →</a></div>${cards(listings.slice(9, 12).concat(listings.slice(0, 1)))}</section>
  <section class="section"><div class="section-heading"><div><h2>Annonces en vedette</h2><p>Des offres sélectionnées pour vous.</p></div></div>${cards(listings.slice(0, 4))}</section>
  <section class="section panel"><div class="two-col"><div><span class="eyebrow">QuickMatch ✨</span><h2>Votre recherche, en plus simple</h2><p>Décrivez ce que vous cherchez et découvrez les annonces les plus pertinentes.</p></div><div class="actions" style="align-items:center;justify-content:flex-end"><a class="btn btn-primary" href="find-for-me.html">Trouver pour moi ✨</a><a class="btn btn-outline" href="quickmatch.html">Découvrir QuickMatch</a></div></div></section>`, "home");
}

mountPage("index", homePage);
