// ╔══════════════════════════════════════════════╗
// ║   Push Server - تذكير الدواء                 ║
// ║   تشغيل: node server.js                      ║
// ╚══════════════════════════════════════════════╝

const http = require("http");
const webpush = require("web-push");

// ── 1. توليد مفاتيح VAPID (مرة واحدة فقط) ──────
const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  "mailto:admin@medicine-reminder.app",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

console.log("\n🔑 VAPID Public Key (انسخها للصفحة):\n", vapidKeys.publicKey, "\n");

// ── 2. تخزين الاشتراكات في الذاكرة ──────────────
let subscriptions = [];

// ── 3. السيرفر ───────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") { res.end(); return; }

  // الصفحة الرئيسية - تعرض الـ public key
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ publicKey: vapidKeys.publicKey }));
    return;
  }

  // تسجيل اشتراك جديد من المتصفح
  if (req.url === "/subscribe" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      const sub = JSON.parse(body);
      // تجنب التكرار
      const exists = subscriptions.some(s => s.endpoint === sub.endpoint);
      if (!exists) subscriptions.push(sub);
      console.log("✅ مشترك جديد | إجمالي:", subscriptions.length);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // إرسال إشعار لكل المشتركين
  // POST /notify  { title, body }
  if (req.url === "/notify" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", async () => {
      const { title, body: msg } = JSON.parse(body);
      const payload = JSON.stringify({ title, body: msg });

      let sent = 0, failed = 0;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub, payload);
          sent++;
        } catch (err) {
          failed++;
          // لو الاشتراك انتهى نحذفه
          if (err.statusCode === 410) {
            subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
          }
        }
      }
      console.log(`📨 أُرسل: ${sent} | فشل: ${failed}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ sent, failed }));
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 السيرفر شغّال على http://localhost:${PORT}`);
  console.log(`   POST /subscribe  → تسجيل المتصفح`);
  console.log(`   POST /notify     → إرسال إشعار\n`);
});