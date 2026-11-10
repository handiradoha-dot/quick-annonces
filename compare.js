const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function comparePage() {
  const items = [listings[3], { ...listings[3], id: 13, title: "HP Pavilion", price: 3950, emoji: "💻", condition: "16 Go RAM, 512 Go SSD" }, { ...listings[3], id: 14, title: "Dell Latitude", price: 3500, emoji: "💻", condition: "8 Go RAM, 256 Go SSD" }];
  shell(`${pageTitle("Comparer les annonces", "Comparez les offres importantes avant de contacter un vendeur.")}<div class="panel comparison"><table><thead><tr><th>Critère</th>${items.map(x=>`<th>${x.title}</th>`).join("")}</tr></thead><tbody><tr><td>Prix</td>${items.map(x=>`<td><strong>${money(x.price)}</strong></td>`).join("")}</tr><tr><td>RAM</td><td>16 Go</td><td>16 Go</td><td>8 Go</td></tr><tr><td>Stockage</td><td>512 Go SSD</td><td>512 Go SSD</td><td>256 Go SSD</td></tr><tr><td>Évaluation</td><td>★ 4.8</td><td>★ 4.6</td><td>★ 4.7</td></tr><tr><td>Action</td>${items.map((x,i)=>`<td><a class="btn ${i===0?"btn-primary":"btn-outline"}" href="detail.html?id=4">${i===0?"Meilleur choix":"Voir l’annonce"}</a></td>`).join("")}</tr></tbody></table></div>`);
}

mountPage("compare", comparePage);
