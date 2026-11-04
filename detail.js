const { mountPage, state, getListing, currentRoute, shell, money, escapeHTML, toast, go, apiRequest, isApiEnabled } = window.QuickAnnonces;

async function detailPage(id) {
  const item = getListing(id);
  if (!item) { shell('<div class="empty"><h2>Annonce introuvable</h2><a class="btn btn-primary" href="search.html">Retour aux annonces</a></div>'); return; }
  if (isApiEnabled) {
    try { state.comments = (await apiRequest(`comments.php?listing_id=${item.id}`)).comments || []; }
    catch { state.comments = []; }
  }
  const comments = state.comments.map(c => `<div class="comment"><strong>${escapeHTML(c.user)}</strong><p style="margin:0">${escapeHTML(c.text)}</p></div>`).join('') || '<p class="meta">Aucun commentaire pour le moment.</p>';
  shell(`<div class="breadcrumb"><a href="index.html">Accueil</a> / <a href="search.html">${escapeHTML(item.category)}</a> / ${escapeHTML(item.title)}</div>
  <div class="detail-layout"><section><div class="product-visual">${item.image ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}">` : item.emoji}</div><div class="panel section"><h2>Description</h2><p>${escapeHTML(item.description)}</p><div class="meta">État : ${escapeHTML(item.condition)} · Catégorie : ${escapeHTML(item.category)} · 📍 ${escapeHTML(item.city)}</div></div>
  <div class="panel section"><h2>Commentaires (${state.comments.length})</h2>${comments}
  <form id="comment-form" class="section"><div class="field"><label for="comment">Ajouter un commentaire</label><textarea id="comment" name="comment" placeholder="Écrivez votre commentaire..." required maxlength="3000"></textarea></div><button class="btn btn-primary">Publier le commentaire</button></form></div></section>
  <aside class="panel product-info"><span class="pill">${escapeHTML(item.type)}</span><h1 style="font-size:30px">${escapeHTML(item.title)}</h1><div class="price">${money(item.price)}</div><p>${escapeHTML(item.condition)} · ${escapeHTML(item.category)}</p><div class="notice">📍 ${escapeHTML(item.city)} · ${escapeHTML(item.age)}</div><div class="actions">${item.can_favorite === false ? '' : `<button class="btn btn-primary" id="contact-seller">💬 Contacter</button><button class="btn btn-outline" data-fav="${item.id}">${state.favorites.has(item.id) ? '♥ Favoris' : '♡ Favoris'}</button>`}</div><div class="section"><h3>Profil vendeur</h3><div class="profile-head"><div class="avatar">${escapeHTML(item.seller.split(' ').map(s => s[0]).slice(0,2).join(''))}</div><div><strong>${escapeHTML(item.seller)}</strong></div></div></div></aside></div>`);
}
mountPage('detail', () => detailPage(currentRoute().id));
