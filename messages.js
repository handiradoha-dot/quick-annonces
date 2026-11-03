const { mountPage, state, listings, categories, money, getListing, currentRoute, shell, cards, pageTitle, matchRow, escapeHTML, statusText, saveListings, toast, go } = window.QuickAnnonces;

function messagesPage() {
  shell(`<div class="page-title"><h1>Messages</h1><p>Échangez directement avec les vendeurs et les acheteurs.</p></div>
  <div class="panel chat-layout"><aside class="chat-list"><h3>Conversations</h3><div class="chat-person active"><strong>Yasmine Benali</strong><div class="meta">Bonjour, est-ce que le téléphone...</div></div><div class="chat-person"><strong>Sarah El Idrissi</strong><div class="meta">Dernier message...</div></div><div class="chat-person"><strong>Omar El Amrani</strong><div class="meta">Dernier message...</div></div><div class="chat-person"><strong>Imane Bennis</strong><div class="meta">Dernier message...</div></div></aside>
  <section class="chat-window"><div class="chat-head">Yasmine Benali <span class="meta">· À propos de iPhone 13</span></div><div class="messages" id="messages">${state.messages.map(m=>`<div class="bubble ${m.mine?"mine":""}">${escapeHTML(m.text)}</div>`).join("")}</div>
  <form class="chat-compose" id="message-form"><input name="message" placeholder="Écrire un message..." required><button class="btn btn-primary">Envoyer</button></form></section></div>`);
}

mountPage("messages", messagesPage);
