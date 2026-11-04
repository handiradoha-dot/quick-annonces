const { mountPage, currentRoute, shell, escapeHTML, toast, apiRequest, isApiEnabled, getCurrentUser } = window.QuickAnnonces;
let conversations = [];
let selectedConversation = Number(new URLSearchParams(location.search).get('conversation')) || 0;
let messages = [];

async function loadMessages() {
  if (!isApiEnabled || !getCurrentUser()) {
    shell('<div class="empty"><h2>Connectez-vous pour consulter vos messages</h2><a class="btn btn-primary" href="login.html">Se connecter</a></div>', 'messages');
    return;
  }
  try {
    const data = await apiRequest('messages.php'); conversations = data.conversations || [];
    if (!selectedConversation && conversations.length) selectedConversation = Number(conversations[0].id);
    if (selectedConversation) {
      const detail = await apiRequest(`messages.php?conversation=${selectedConversation}`); messages = detail.messages || [];
    }
  } catch (error) { toast(error.message); }
  const current = conversations.find(item => Number(item.id) === selectedConversation);
  const me = Number(getCurrentUser()?.id);
  const chatPeople = conversations.map(item => `<a class="chat-person ${Number(item.id) === selectedConversation ? 'active' : ''}" href="messages.html?conversation=${item.id}"><strong>${escapeHTML(item.other_name || 'Utilisateur')}</strong><div class="meta">${escapeHTML(item.last_message || item.listing_title || 'Nouvelle conversation')}</div></a>`).join('');
  const chatMessages = messages.map(item => `<div class="bubble ${Number(item.sender_id) === me ? 'mine' : ''}">${escapeHTML(item.body)}</div>`).join('');
  shell(`<div class="page-title"><h1>Messages</h1><p>Échangez directement avec les vendeurs et les acheteurs.</p></div>
    <div class="panel chat-layout"><aside class="chat-list"><h3>Conversations</h3>${chatPeople || '<p class="meta">Aucune conversation pour le moment.</p>'}</aside>
    <section class="chat-window"><div class="chat-head">${escapeHTML(current?.other_name || 'Conversation')} <span class="meta">${current ? '· À propos de ' + escapeHTML(current.listing_title) : ''}</span></div>
    <div class="messages" id="messages">${chatMessages || '<p class="meta">Envoyez le premier message.</p>'}</div>
    ${current ? '<form class="chat-compose" id="message-form"><input name="message" placeholder="Écrire un message..." required maxlength="5000"><button class="btn btn-primary">Envoyer</button></form>' : ''}</section></div>`, 'messages');
}
window.QuickAnnonces.reloadMessages = loadMessages;
mountPage('messages', loadMessages);
