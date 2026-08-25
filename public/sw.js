// Service Worker para PayGateway - PWA & Notificações de Venda em Segundo Plano
const APP_VERSION = 'games-routing-v14';
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

// Listener para evento 'push' enviado do servidor backend (Web Push APNs / FCM)
self.addEventListener('push', (event) => {
  let data = { title: 'Você vendeu! 💰', body: 'Sua comissão foi creditada!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'PayGateway', body: event.data.text() };
    }
  }

  const title = data.title || 'Você vendeu! 💰';
  const body = data.body || 'Sua comissão foi creditada no seu saldo!';

  const options = {
    body: body,
    icon: '/appiamgem.png',
    badge: '/appiamgem.png',
    vibrate: [200, 100, 200, 100, 200, 100, 300],
    tag: 'sale-notification-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Ver Saldo 💰' },
      { action: 'close', title: 'Fechar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Listener para mensagens da aplicação para exibir notificações instantâneas ou agendadas
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SHOW_SALE_NOTIFICATION') {
    const title = data.title || 'Você vendeu!';
    const commissionVal = data.amount !== undefined ? data.amount : '47,90';
    const body = data.body || `Sua comissão é R$ ${commissionVal}`;

    const options = {
      body: body,
      icon: '/appiamgem.png',
      badge: '/appiamgem.png',
      vibrate: [200, 100, 200, 100, 200, 100, 300],
      tag: 'sale-notification-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: { url: '/' },
      actions: [
        { action: 'open', title: 'Ver Venda 💰' },
        { action: 'close', title: 'Fechar' }
      ]
    };

    if (data.delay && data.delay > 0) {
      setTimeout(() => {
        self.registration.showNotification(title, options);
      }, data.delay);
    } else {
      self.registration.showNotification(title, options);
    }
  }

  if (data.type === 'SHOW_AFFILIATE_NOTIFICATION') {
    event.waitUntil(self.registration.showNotification(data.title || 'Alliance Hub', {
      body: data.body || 'Você possui uma nova atividade na sua rede.',
      icon: '/appiamgem.png',
      badge: '/allifavicon.png',
      vibrate: [120, 80, 160],
      tag: 'affiliate-' + Date.now(),
      renotify: true,
      data: { url: data.url || '/?tab=affiliates' },
      actions: [{ action: 'open', title: 'Ver atividade' }, { action: 'close', title: 'Fechar' }]
    }));
  }
});

// Ao clicar na notificação, abre/foca o aplicativo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
