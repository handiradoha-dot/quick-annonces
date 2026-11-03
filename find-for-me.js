const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function findForMePage() {
  shell(`${pageTitle("Trouver pour moi ✨", "Décrivez simplement ce que vous cherchez. QuickAnnonces trouve les annonces les plus pertinentes.")}<div class="two-col"><section class="panel"><form id="find-form"><div class="field"><label>💬 Que recherchez-vous ?</label><textarea name="prompt" placeholder="Ex. : Je recherche un ordinateur portable pour mes études, 16 Go RAM, budget 4 000 DH maximum." required></textarea></div><button class="btn btn-primary">✨ Trouver pour moi</button></form><p class="small">Exemple : « Je cherche un appartement 2 chambres près du centre, moins de 5 000 DH. »</p></section><section class="panel"><h2>Résultats personnalisés</h2><div id="personal-results">${matchRow({emoji:"💻",title:"Laptop Lenovo",price:3800,id:4},98)}${matchRow({emoji:"💻",title:"HP Pavilion",price:3950,id:4},91)}${matchRow({emoji:"💻",title:"Dell Latitude",price:3500,id:4},84)}</div></section></div>`);
}

mountPage("find-for-me", findForMePage);
