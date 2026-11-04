// Сервер сайта: раздаёт статику и принимает заявки (POST /api/lead).
// Без зависимостей, Node 18+.  Запуск:  node server.js
// Заявки: пишутся в leads.jsonl и (если заданы переменные) уходят в Telegram.
//   TELEGRAM_BOT_TOKEN=123:ABC  TELEGRAM_CHAT_ID=123456789  node server.js
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8795;
const ROOT = __dirname;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT = process.env.TELEGRAM_CHAT_ID;
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".json": "application/json" };
const BLOCK = new Set(["server.js", "leads.jsonl", "README.md", "package.json"]);

const rub = n => Number(n || 0).toLocaleString("ru-RU") + " ₽";
const esc = s => String(s == null ? "" : s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const clip = (s, n = 500) => String(s == null ? "" : s).slice(0, n);

function format(d) {
  if (d.type === "question") {
    return `❓ <b>Вопрос с сайта</b>\n👤 ${esc(clip(d.name, 80))}\n📞 ${esc(clip(d.phone, 30))}\n\n${esc(clip(d.question, 1500))}`;
  }
  const p = d.pricing || {}, c = d.car || {};
  return [
    `🚗 <b>Новая заявка — расчёт чехла</b>`,
    `👤 ${esc(clip(d.name, 80))}`,
    `📞 ${esc(clip(d.phone, 30))}`,
    `🔔 Связаться: ${esc(clip(d.contact || "Звонок", 20))}`,
    d.comment ? `💬 ${esc(clip(d.comment, 500))}` : "",
    ``,
    `<b>Авто:</b> ${esc(clip(c.brand, 60))} ${esc(clip(c.model, 80))}${c.year ? " (" + esc(c.year) + ")" : ""}${c.knownModel ? "" : " (модель вписана вручную)"}`,
    `<b>Кузов:</b> ${esc(clip(c.body, 40))}`,
    `<b>Материал:</b> ${esc(clip(d.fabric, 80))}`,
    `<b>Площадь:</b> ${esc(d.areaM2)} м²`,
    Array.isArray(d.extras) && d.extras.length ? `<b>Опции:</b> ${esc(d.extras.map(x => clip(x, 60)).join(", "))}` : "",
    ``,
    `<b>Расчёт:</b>`,
    `• Закупка ткани: ${rub(p.fabricPurchase)}`,
    `• Расходники: ${rub(p.materials)}`,
    `• Труд: ${esc(p.laborHours)} ч = ${rub(p.labor)}`,
    `• Накладные: ${rub(p.overhead)}`,
    `• Реклама на заказ: ${rub(p.cac)}`,
    `• Себестоимость: ${rub(p.cost)}`,
    `• Цена без скидки: ${rub(p.price)}${p.rush ? " (срочный)" : ""}`,
    `• Прибыль после налога: ${rub(p.profit)}`,
    `• Срок: ${esc(p.leadTime)}`,
    `<b>К оплате${p.discountPercent ? ` со скидкой ${esc(p.discountPercent)}%` : ""}: ${rub(p.priceWithDiscount)}</b>`
  ].filter(x => x !== "").join("\n");
}

async function toTelegram(text) {
  if (!TOKEN || !CHAT) return false;
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: "HTML", disable_web_page_preview: true })
  });
  if (!r.ok) throw new Error("telegram " + r.status);
  return true;
}

function readBody(req) {
  return new Promise((res, rej) => {
    let b = "";
    req.on("data", c => { b += c; if (b.length > 20000) { rej(new Error("too big")); req.destroy(); } });
    req.on("end", () => res(b));
    req.on("error", rej);
  });
}

const hits = new Map(); // простейший лимит: 8 заявок / 10 мин с IP
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 600000);
  a.push(now); hits.set(ip, a); return a.length > 8;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");
    if (req.method === "POST" && url.pathname === "/api/lead") {
      if (limited(req.socket.remoteAddress)) { res.writeHead(429); return res.end('{"ok":false}'); }
      const d = JSON.parse(await readBody(req));
      const phone = String(d.phone || "").replace(/\D/g, "");
      if (!d.name || phone.length < 10 || (d.type !== "question" && d.type !== "calc")) { res.writeHead(400); return res.end('{"ok":false}'); }
      fs.appendFileSync(path.join(ROOT, "leads.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...d }) + "\n");
      let tg = false;
      try { tg = await toTelegram(format(d)); } catch (e) { console.error("Telegram:", e.message); }
      console.log(`[lead] ${d.type} ${d.name} ${d.phone} tg=${tg}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true, telegram: tg }));
    }
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
    let p = decodeURIComponent(url.pathname);
    if (p === "/") p = "/index.html";
    const file = path.normalize(path.join(ROOT, p));
    if (!file.startsWith(ROOT + path.sep) || BLOCK.has(path.basename(file)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    res.writeHead(400); res.end('{"ok":false}');
  }
}).listen(PORT, () => console.log(`Сайт: http://localhost:${PORT}  (Telegram: ${TOKEN && CHAT ? "включён" : "не настроен — заявки пишутся в leads.jsonl"})`));
