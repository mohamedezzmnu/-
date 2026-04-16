const INTERVAL = 30000;

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'UPDATE_MEDS') {
    self._meds = e.data.meds || [];
    self._lastNotif = self._lastNotif || {};
  }
});

function alarm() {
  const meds = self._meds || [];
  const now  = new Date();
  const cur  = now.toTimeString().slice(0, 5);

  meds.forEach(m => {
    if (m.time === cur && !m.taken) {
      const key = m.id + '-' + cur;
      if (!self._lastNotif[key]) {
        self._lastNotif[key] = true;

        self.registration.showNotification('تذكير الدواء 💊', {
          body: 'حان وقت أخذ ' + m.name + ' · ' + m.dose,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="52" font-size="52">💊</text></svg>',
          tag: key,
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200]
        });

        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(c => c.postMessage({ type: 'RING', id: m.id, name: m.name }));
        });
      }
    }
  });

  Object.keys(self._lastNotif || {}).forEach(k => {
    if (!k.endsWith('-' + cur)) delete self._lastNotif[k];
  });

  setTimeout(alarm, INTERVAL);
}

setTimeout(alarm, INTERVAL);