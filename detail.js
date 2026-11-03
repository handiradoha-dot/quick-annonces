const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function detailPage(id) {
  const item = getListing(id);
  shell(`<div class="breadcrumb"><a href="index.html">Accueil</a> / <a href="search.html">${item.category}</a> / ${item.title}</div>
  <div class="detail-layout"><section><div class="product-visual">${item.image ? `<img src="${item.image}" alt="${escapeHTML(item.title)}">` : item.emoji}</div><div class="panel section"><h2>Description</h2><p>${escapeHTML(item.description)}</p><div class="meta">État : ${escapeHTML(item.condition)} · Catégorie : ${escapeHTML(item.category)} · 📍 ${escapeHTML(item.city)}</div></div>
  <div class="panel section"><h2>Commentaires (${state.comments.length + 6})</h2>${state.comments.map(c=>`<div class="comment"><strong>${c.user}</strong><p style="margin:0">${escapeHTML(c.text)}</p><button class="btn btn-soft" data-reply="${escapeHTML(c.user)}">Répondre</button></div>`).join("")}
  <form id="comment-form" class="section"><div class="field"><label for="comment">Ajouter un commentaire</label><textarea id="comment" name="comment" placeholder="Écrivez votre commentaire..." required></textarea></div><button class="btn btn-primary">Publier le commentaire</button></form></div></section>
  <aside class="panel product-info"><span class="pill">${item.type}</span><h1 style="font-size:30px">${item.title}</h1><div class="price">${money(item.price)}${item.id===3?"/mois":""}</div><p>${item.condition} · ${item.category}</p><div class="notice">✓ Vendeur vérifié <br>📍 ${item.city} · ${item.age}</div><div class="actions"><button class="btn btn-primary" id="contact-seller">💬 Contacter</button><button class="btn btn-outline" data-fav="${item.id}">${state.favorites.has(item.id)?"♥ Favoris":"♡ Favoris"}</button></div><div class="section"><h3>Profil vendeur</h3><div class="profile-head"><div class="avatar">${item.seller.split(" ").map(s=>s[0]).slice(0,2).join("")}</div><div><strong>${item.seller}</strong><div class="meta">★ 4.9 · Vendeur vérifié</div><a class="text-link small" href="seller.html">Voir le profil</a></div></div></div></aside></div>`);
}

mountPage("detail", () => detailPage(currentRoute().id));
