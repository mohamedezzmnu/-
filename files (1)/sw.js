/* ═══════════════════════════════════════════════════════════
   دوائي — Service Worker v5
   ✅ إشعارات في الخلفية بعد إغلاق التطبيق
   ✅ Background Sync + Periodic Sync
   ✅ Keep-alive ذاتي كل 20 ثانية
   ✅ IndexedDB لحفظ الجدول بين الجلسات
   ✅ تصفير takenToday عند منتصف الليل
   ✅ Push handler جاهز للمستقبل
═══════════════════════════════════════════════════════════ */

const CACHE       = 'dawai-v5';
const FILES       = ['/', '/index.html', '/manifest.json', '/sw.js',
                     '/icon-72.png', '/icon-192.png', '/icon-512.png'];
const DB_NAME     = 'dawai-notif-db';
const DB_VER      = 2;
const STORE_NOTIF = 'scheduled';
const STORE_STATE = 'appstate';

const ICON_192 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAEaklEQVR42u3T525VVxCA0fMCwdi8TnoP6fVnQnrvvYcUXnsyGAVZSWRfe2z22WfWSN/VxrINGmYtEbGspSs3Xgn1aC03d2cP/K+XQ9qlTQDwH6m1g3D4ag3B4as1BIev1hDqx/9n/kOkgQ0BYPHaAoQzHv9LIa2xCwdgydoSAsev1gh2P/4/8hdLE3VuACxTW0Xg+NUageNXawQnAHgxpC10agBXfs8flDbUzgAO8pulLQaAADgOgCWpEwIABMDt47+e3yA1CAABcBTAwfUXQuoUAALgNoDf8otSowAQAI5fnQNAAFiEegP49fmQOgaAALAIASABIDUDcPBLPqSmASAApMYAngupawCoOYCf8yE1DQABIAEgtQTwUz5UbsTYe70E8Gyo3hgA9l4NAAAAEAAACICWAH7Mh8oNAWDv5Zb9/FC9EWPv9QAAAAAB0BjAM6F6YwDYe7Vl/4d8qNwQAPZeDgAAABAAAAgAAARANwDf50PlhgCw93IJ4OlQvTEA7L0aAAAAIAD6AvguHyo3BIC9lwMAAAAEAAACoCeAp0L1xgCw92rL/rf5ULkhAOy9HAAAACAAABAAAAiAbgC+yYfKDQFg7+UAAKA7gCdD9cYAsPdqAAAAgADoC+DrfKjcEAD2Xg4AAAAQAAAIgJ4ArsZMmfXPTPe0XP7qasyUWf/MdE8AGAAAMAAAYFoC+DIfE2UmADDRPQFgAADANAbwRMyUmQHAPPcEgGkO4It8TJSZAMBE9wSAAQAAAwAABgAATDcAnz8eM2UmADDRPQFgAADAAACAAQAA0w3AZ/mYKDMBgInuCQADAACmMYDHYqbMDADmuafl8qf5mCgzAYCJ7gkAAwAABgAADAAAmG4APsmHyg05NHsvlwAeDdUbA8DeqwEAAAACoC2AvfxQvRFj7/WWvY/zoXJDANh7OQAAAEAAACAAegJ4JFRvDAB7r7bsfZQPlRsCwN7LAQAAAAIAAAHQEsCH+VC5IQDsvRwAAHQH8HCo3hgA9l4NAAAAEAB9AXyQD5UbAsDeywEAAAACAAAB0BPAQ6F6YwDYe7Vl7/18qNwQAPZeDgAAABAAAAgAAARANwDv5UPlhgCw93IAANAdwIOhemMA2Hs1AAAAQAD0BfBuPlRuCAB7LwcAAAAIgLYALuWH6o0Ye6+3XHrngZC6BoAAkACQAJC6AXg7H1LTABAAUmMA94fUtSUCAnUH8Fb+QWoYAALAIgSABIDUEcCb94XUMQAEAATq2M27B0AAHAJ4I78oNQoAAfAPAAjU7fgBEABHAdxCcG9IW+7ovf8XwOv5TdKGOxYABOpy/AAIgP8DAIE6HP+xACDQ1o//ZADX8oelDXQmALcQ3BPSzB133ycCgEBbPf6dAdzsrvxl0kztctc7A4BAWzv+UwM4RPBa/gXSijvNPZ8aAATayvGfGQAE2sLxlwCAoJkP/9wAHCJ49e6QRlS93XMBAIJmO/wLAQCCZjn8CwUAgtZ++HcEABBa28H/u78BhclNdjHb0BwAAAAASUVORK5CYII=';
const ICON_72  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABICAYAAABV7bNHAAACFElEQVR42u3c104jQRCF4X4BMx7zOsQls6RdwiU5LzntLjm/dlHCCMnyDOWiL87AnJF+qcZYVvV3TwcRCd7an+fkq+Y9q43xNCvfvU8DlQHHQsqGeZyRsmYCtT/oF0teLhBxmpEage6nhdVrAqrph6yxd6DanX7AMnsD+i0suzrQrb6wzAjUEtDNL2HZhdq1Diw3BZoSll+oXenAciOQCXQ5Kag8D2pHAllA6cWkoPI8qB0VaEJQ+YAwO4b0XAdQLiDQjiH9rwMoFxBoRwUaF1Q+IMyOIf2nAygXEGhHAplAf8cElQsItCOBTKCzn4LKBQTaMaSnOoByAYF2JJAFVD0ZldiK/MSejUAm0LEOkRUaKPJsCjQisRUbKO5soXqkQ2SFBoo8G4FMoMNhia3QQJFnC9UDHSIrNFDk2QhkAu0PSWyFBoo8G4FMoL1BQeU6KGhHAllAye6goPI8qB0VaEBQ+YAwO4ZkRwdQLiDQjiH5owMoFxBoRwXqF1Q+IMyOIdnWAZQLCLQjgUygrT5B5QIC7UggE2hTB1AuINCOCvRDUPmAMDuGZEMHUC4g0I6hbb1XWH4EMoHWdGC5KVCPsPxe/1+sbVVfWGYEaglopVtYdnWgZX1hmRGoFaBXpKUuYY013d1BlEacZqDFTmH1cu8Pqugfy555A1VlQb9Y0lx3mFUWOqQsffoWvMq8/sA376PzvwADSzvingdpZQAAAABJRU5ErkJggg==';

/* ══════ IndexedDB ══════ */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NOTIF))
        db.createObjectStore(STORE_NOTIF, { keyPath: 'tag' });
      if (!db.objectStoreNames.contains(STORE_STATE))
        db.createObjectStore(STORE_STATE, { keyPath: 'key' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbGet(store, key) {
  try {
    const db  = await openDB();
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    return new Promise(res => {
      req.onsuccess = () => res(req.result || null);
      req.onerror   = () => res(null);
    });
  } catch { return null; }
}

async function dbPut(store, record) {
  try {
    const db = await openDB();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(record);
    return new Promise(res => { tx.oncomplete = res; tx.onerror = res; });
  } catch { /* silent */ }
}

async function saveSchedule(notifications) {
  try {
    const db    = await openDB();
    const tx    = db.transaction(STORE_NOTIF, 'readwrite');
    const store = tx.objectStore(STORE_NOTIF);
    store.clear();
    notifications.forEach(n => store.put(n));
    return new Promise(res => { tx.oncomplete = res; });
  } catch (e) { console.warn('[SW] saveSchedule:', e); }
}

async function loadSchedule() {
  try {
    const db  = await openDB();
    const tx  = db.transaction(STORE_NOTIF, 'readonly');
    const req = tx.objectStore(STORE_NOTIF).getAll();
    return new Promise(res => {
      req.onsuccess = () => res(req.result || []);
      req.onerror   = () => res([]);
    });
  } catch { return []; }
}

/* ══════ Install / Activate / Fetch ══════ */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => rescheduleFromDB())
      .then(() => scheduleKeepAlive())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || network;
    }).catch(() => caches.match('/index.html'))
  );
});

/* ══════ Notify ══════ */
function notify(title, body, tag, important, actions) {
  const opts = {
    body, dir: 'rtl', lang: 'ar',
    icon: ICON_192, badge: ICON_72,
    tag:  tag || ('dw-' + Date.now()),
    data: { tag },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: !!important,
    actions: actions || []
  };
  return self.registration.getNotifications({ tag: opts.tag })
    .then(existing => {
      if (existing.length) return;
      return self.registration.showNotification(title, opts);
    })
    .catch(() => self.registration.showNotification(title, opts));
}

/* ══════ Timers ══════ */
let timers = [];
function clearAllTimers() { timers.forEach(clearTimeout); timers = []; }

/* ══════ Keep-Alive — الجوهر الجديد ══════
   يحافظ على حياة الـ SW بعد إغلاق التطبيق
   عبر setTimeout ذاتي التكرار كل 20 ثانية.
   لو ما فيش نوافذ مفتوحة يُعيد قراءة الجدول
   من IndexedDB ويُعيد جدولة الإشعارات.        */
let keepAliveTimer = null;
const KEEP_ALIVE_MS = 20 * 1000;

function scheduleKeepAlive() {
  if (keepAliveTimer) clearTimeout(keepAliveTimer);
  keepAliveTimer = setTimeout(async () => {
    const clients = await self.clients.matchAll({
      type: 'window', includeUncontrolled: true
    });
    if (clients.length === 0) {
      // التطبيق مغلق — أعد الجدولة من DB
      await rescheduleFromDB();
      await checkMidnightReset();
    }
    scheduleKeepAlive();   // استمر
  }, KEEP_ALIVE_MS);
}

/* ══════ إعادة الجدولة من IndexedDB ══════ */
async function rescheduleFromDB() {
  const notifications = await loadSchedule();
  if (!notifications.length) return;
  clearAllTimers();
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let count = 0;
  notifications.forEach(n => {
    const delay = n.at - now;
    if (delay < 0 || delay > DAY) return;
    timers.push(setTimeout(
      () => notify(n.title, n.body, n.tag, n.important, n.actions),
      delay
    ));
    count++;
  });
  if (count) console.log('[دوائي SW] أُعيد جدولة', count, 'إشعار');
}

/* ══════ تصفير منتصف الليل من الـ SW ══════ */
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function checkMidnightReset() {
  const today  = todayKey();
  const record = await dbGet(STORE_STATE, 'last_reset_day');
  if (record && record.value === today) return;
  await dbPut(STORE_STATE, { key: 'last_reset_day', value: today });
  const clients = await self.clients.matchAll({
    type: 'window', includeUncontrolled: true
  });
  clients.forEach(c => c.postMessage({ type: 'NEW_DAY' }));
  console.log('[دوائي SW] يوم جديد —', today);
}

/* ══════ Messages ══════ */
self.addEventListener('message', async e => {
  if (!e.data) return;

  switch (e.data.type) {

    case 'SHOW_NOW':
      notify(e.data.title, e.data.body, e.data.tag, e.data.important, e.data.actions);
      break;

    case 'SCHEDULE': {
      clearAllTimers();
      const notifs = e.data.notifications || [];
      await saveSchedule(notifs);
      const now = Date.now();
      notifs.forEach(n => {
        const delay = n.at - now;
        if (delay < 0) return;
        timers.push(setTimeout(
          () => notify(n.title, n.body, n.tag, n.important, n.actions),
          delay
        ));
      });
      console.log('[دوائي SW] جُدول', notifs.length, 'إشعار');
      self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(cs => cs.forEach(c =>
          c.postMessage({ type: 'SCHEDULE_OK', count: notifs.length })
        ));
      scheduleKeepAlive();
      break;
    }

    case 'CLEAR':
      clearAllTimers();
      await saveSchedule([]);
      break;

    case 'DOSE_TAKEN':
      if (e.data.tag)
        self.registration.getNotifications({ tag: e.data.tag })
          .then(ns => ns.forEach(n => n.close()));
      break;

    case 'RESCHEDULE':
      await rescheduleFromDB();
      await checkMidnightReset();
      scheduleKeepAlive();
      break;

    case 'PING':
      if (e.source) e.source.postMessage({ type: 'PONG' });
      break;
  }
});

/* ══════ Background Sync ══════ */
self.addEventListener('sync', e => {
  if (e.tag === 'reschedule')
    e.waitUntil(rescheduleFromDB().then(checkMidnightReset));
});

/* ══════ Periodic Background Sync ══════ */
self.addEventListener('periodicsync', e => {
  if (e.tag === 'reschedule-periodic')
    e.waitUntil(rescheduleFromDB().then(checkMidnightReset));
});

/* ══════ Push (جاهز للمستقبل) ══════ */
self.addEventListener('push', e => {
  try {
    const data = e.data ? e.data.json() : {};
    e.waitUntil(notify(
      data.title     || '💊 دوائي',
      data.body      || 'لديك إشعار جديد',
      data.tag       || 'push-' + Date.now(),
      data.important || false,
      data.actions   || []
    ));
  } catch { /* بيانات push غير صالحة */ }
});

/* ══════ Notification Click ══════ */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const action = e.action;
  const tag    = e.notification.data && e.notification.data.tag;

  if (action === 'taken') {
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(cs => cs.forEach(c => c.postMessage({ type: 'DOSE_TAKEN_FROM_NOTIF', tag })));
    return;
  }
  if (action === 'snooze') {
    const { title, body } = e.notification;
    setTimeout(() => notify(title, body, tag + '-snooze', true, []), 10 * 60 * 1000);
    return;
  }
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const open = cs.find(c => c.url.endsWith('/') || c.url.includes('index'));
      if (open) return open.focus();
      return self.clients.openWindow('/');
    })
  );
});

/* ══════ Notification Close ══════ */
self.addEventListener('notificationclose', e => {
  const tag = e.notification.data && e.notification.data.tag;
  console.log('[دوائي SW] إغلاق إشعار:', tag);
});
