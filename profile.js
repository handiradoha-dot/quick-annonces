const { mountPage, shell, readStore, escapeHTML } = window.QuickAnnonces;

function profilePage() {
  const user = readStore("currentUser", null);
  if (!user) {
    location.href = "login.html";
    return;
  }
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";
  shell(`<div class="page-title"><h1>Mon profil</h1><p>Gérez vos informations personnelles.</p></div>
    <section class="panel profile-head"><div class="avatar">${escapeHTML(initials)}</div><div><h2>${escapeHTML(`${firstName} ${lastName}`.trim())}</h2><div class="meta">${escapeHTML(user.email || "")}</div></div></section>
    <form id="profile-form" class="panel section" style="max-width:680px"><h2>Informations personnelles</h2>
      <div class="two-col"><div class="field"><label for="profile-first-name">Prénom</label><input id="profile-first-name" name="firstName" value="${escapeHTML(firstName)}" required></div>
      <div class="field"><label for="profile-last-name">Nom</label><input id="profile-last-name" name="lastName" value="${escapeHTML(lastName)}" required></div></div>
      <div class="field"><label for="profile-email">Adresse e-mail</label><input id="profile-email" value="${escapeHTML(user.email || "")}" type="email" disabled></div>
      <button class="btn btn-primary" type="submit">Enregistrer les modifications</button>
    </form>`);
}

mountPage("profile", profilePage);
