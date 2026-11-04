(function () {
  "use strict";
  var C = window.CONFIG, P = window.PRICING, F = window.FABRICS, E = window.EXTRAS, B = window.BODIES, CARS = window.CARS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var fmt = function (n) { return Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ") + " ₽"; };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- аналитика (Яндекс.Метрика, если задан metrikaId) ---------- */
  window.dataLayer = window.dataLayer || [];
  function track(goal, params) {
    try { window.dataLayer.push({ event: goal, params: params || {} }); } catch (e) {}
    try { if (window.ym && C.metrikaId) window.ym(C.metrikaId, "reachGoal", goal, params || {}); } catch (e) {}
  }
  if (C.metrikaId) {
    (function (m, e, t, r, i, k, a) { m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date(); k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(C.metrikaId, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
    var h = a.getAttribute("href") || "";
    if (h.indexOf("tel:") === 0) track("phone_click");
    else if (h.indexOf("t.me") >= 0) track("telegram_click");
    else if (h.indexOf("wa.me") >= 0) track("whatsapp_click");
  });

  /* ---------- config → DOM ---------- */
  document.querySelectorAll("[data-cfg]").forEach(function (el) { el.textContent = C[el.dataset.cfg] || ""; });
  document.querySelectorAll("[data-phone]").forEach(function (el) { el.href = "tel:" + C.phoneRaw; if (el.classList.contains("hdr__phone")) el.textContent = C.phone; });
  document.querySelectorAll("[data-phone-text]").forEach(function (el) { el.textContent = C.phone; });
  document.querySelectorAll("[data-tg]").forEach(function (el) { el.href = C.telegram; });
  document.querySelectorAll("[data-wa]").forEach(function (el) { el.href = C.whatsapp; });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- auto banner carousel (бесконечная лента) ---------- */
  (function () {
    var root = $("#banner"), track = $("#bTrack"), dots = $("#bDots"), prog = $("#bProg"), pauseBtn = $("#bPause");
    var real = Array.prototype.slice.call(track.children), n = real.length;
    var first = real[0].cloneNode(true), last = real[n - 1].cloneNode(true);
    [first, last].forEach(function (c) { c.setAttribute("aria-hidden", "true"); var im = c.querySelector("img"); im.alt = ""; im.removeAttribute("fetchpriority"); im.loading = "eager"; });
    track.insertBefore(last, real[0]); track.appendChild(first);
    var pos = 1, busy = false, DELAY = 5000, left = DELAY, last_t = Date.now(), hover = false, touching = false, userPaused = false, finishT;
    for (var i = 0; i < n; i++) (function (i) {
      var b = document.createElement("button"); b.setAttribute("aria-label", "Слайд " + (i + 1));
      b.addEventListener("click", function () { move(i + 1); }); dots.appendChild(b);
    })(i);
    function put(p, animate) {
      track.style.transition = animate ? "" : "none";
      track.style.transform = "translateX(" + (-p * 100) + "%)";
      pos = p;
      var idx = ((p - 1) % n + n) % n;
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === idx); });
    }
    function finish() { // «перепрыгиваем» с клона на настоящий слайд без анимации — лента выглядит бесконечной
      clearTimeout(finishT);
      if (pos === 0) put(n, false); else if (pos === n + 1) put(1, false);
      void track.offsetWidth; busy = false;
    }
    function move(p) {
      if (busy && p !== pos) { finish(); }
      busy = true; put(p, true); left = DELAY;
      clearTimeout(finishT); finishT = setTimeout(finish, 900);
    }
    track.addEventListener("transitionend", function (e) { if (e.target === track) finish(); });
    $("#bPrev").addEventListener("click", function () { move(pos - 1); });
    $("#bNext").addEventListener("click", function () { move(pos + 1); });
    root.addEventListener("mouseenter", function () { hover = true; });
    root.addEventListener("mouseleave", function () { hover = false; });
    var sx = null;
    root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; touching = true; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (sx !== null) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) move(pos + (dx < 0 ? 1 : -1)); }
      sx = null; touching = false;
    });
    pauseBtn.addEventListener("click", function () {
      userPaused = !userPaused; pauseBtn.classList.toggle("paused", userPaused);
      pauseBtn.setAttribute("aria-label", userPaused ? "Запустить автопрокрутку" : "Остановить автопрокрутку");
    });
    window.addEventListener("load", function () { root.querySelectorAll("img").forEach(function (im) { im.loading = "eager"; }); });
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function loop() {
      var now = Date.now(), dt = now - last_t; last_t = now;
      if (!hover && !touching && !userPaused && !document.hidden && !reduce) { left -= Math.min(dt, 200); if (left <= 0) move(pos + 1); }
      prog.style.width = (userPaused ? 0 : 100 - left / DELAY * 100) + "%";
      requestAnimationFrame(loop);
    }
    put(1, false); requestAnimationFrame(loop);
  })();

  /* ---------- меню, подсветка раздела, появление блоков ---------- */
  (function () {
    document.documentElement.classList.add("js");
    var burger = $("#burger"), nav = $("#nav");
    function closeNav() { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }
    burger.addEventListener("click", function () { var o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
    if (!("IntersectionObserver" in window)) return;
    var links = {};
    nav.querySelectorAll("a").forEach(function (a) { links[a.getAttribute("href")] = a; });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].classList.remove("active"); }); var l = links["#" + e.target.id]; if (l) l.classList.add("active"); } });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["calc", "how", "fabrics", "faq", "contacts"].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
    var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } }); }, { threshold: 0.12 });
    document.querySelectorAll(".sec__head, .strip__grid > div, .steps li, .fcard, .why__text, .why__stats > div, .faq__list details, .cbtn, .qform, .contacts__info").forEach(function (el, i) {
      el.classList.add("reveal"); el.style.transitionDelay = (i % 4) * 70 + "ms"; rv.observe(el);
    });
  })();

  /* ---------- calculator state ---------- */
  var state = { contact: "Звонок", brand: "", model: "", mult: 1, body: null, bodyAuto: false, fabric: "premium", extras: {} };

  var brandEl = $("#brand"), modelEl = $("#model");

  function findBrand(v) {
    v = v.trim().toLowerCase(); if (!v) return null;
    var keys = Object.keys(CARS);
    for (var i = 0; i < keys.length; i++) if (keys[i].toLowerCase() === v) return keys[i];
    return null;
  }
  function onBrand() {
    var raw = brandEl.value.trim(), b = findBrand(raw);
    state.brand = b || raw;
    state.known = !!b;
    modelEl.disabled = !raw;
    modelEl.placeholder = raw ? (b ? "Выберите или впишите модель" : "Впишите модель вручную") : "Сначала выберите марку";
    state.model = ""; modelEl.value = ""; state.mult = 1;
    if (!state.body || state.bodyAuto) { state.body = null; state.bodyAuto = false; }
    render();
  }
  function onModel() {
    var raw = modelEl.value.trim();
    state.model = raw; state.mult = 1;
    var list = CARS[state.brand] || [], hit = null;
    for (var i = 0; i < list.length; i++) if (list[i][0].toLowerCase() === raw.toLowerCase()) { hit = list[i]; break; }
    if (hit) { state.body = hit[1]; state.bodyAuto = true; state.mult = hit[2] || 1; state.model = hit[0]; }
    else if (state.bodyAuto) { state.body = null; state.bodyAuto = false; }
    render();
  }
  var yearEl = $("#year");
  yearEl.addEventListener("input", function () { yearEl.value = yearEl.value.replace(/\D/g, "").slice(0, 4); yearEl.classList.remove("bad"); });
  function yearVal() { var v = yearEl.value.trim(); if (!v) return ""; var n = +v; return (v.length === 4 && n >= 1970 && n <= new Date().getFullYear() + 1) ? v : null; }
  brandEl.addEventListener("input", onBrand);
  modelEl.addEventListener("input", onModel);

  /* ---------- кастомный выпадающий список (combobox) ---------- */
  function norm(s) { return String(s).toLowerCase().replace(/ё/g, "е"); }
  function escHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function Combo(input, getItems, onPick) {
    var wrap = input.parentNode, list = wrap.querySelector(".combo__list"), btn = wrap.querySelector(".combo__btn");
    var items = [], act = -1, isOpen = false;
    function highlight(name, q) {
      if (!q) return escHtml(name);
      var i = norm(name).indexOf(q);
      if (i < 0) return escHtml(name);
      return escHtml(name.slice(0, i)) + "<mark>" + escHtml(name.slice(i, i + q.length)) + "</mark>" + escHtml(name.slice(i + q.length));
    }
    function render(all) {
      var q = all ? "" : norm(input.value.trim()), src = getItems();
      items = q ? src.filter(function (it) { return norm(it.value + " " + (it.alias || "")).indexOf(q) >= 0; }) : src.slice();
      if (q) items.sort(function (a, b) { return (norm(a.value + " " + (a.alias || "")).indexOf(q) !== 0) - (norm(b.value + " " + (b.alias || "")).indexOf(q) !== 0); });
      act = -1;
      if (!items.length) {
        list.innerHTML = "<div class='combo__empty'>" + (src.length ? "Такого нет в списке.<br><small>Оставьте как есть — подберём вручную по телефону.</small>" : "Список пуст.<br><small>Впишите значение вручную.</small>") + "</div>";
        return;
      }
      list.innerHTML = items.map(function (it, i) {
        var cur = norm(it.value) === norm(input.value.trim());
        return "<div class='combo__opt" + (cur ? " cur" : "") + "' role='option' id='" + list.id + "-" + i + "' data-i='" + i + "'><span class='n'>" + highlight(it.value, q) + "</span>" + (it.meta ? "<span class='m'>" + escHtml(it.meta) + "</span>" : "") + "</div>";
      }).join("");
      var cur = list.querySelector(".cur"); if (cur) { act = +cur.dataset.i; mark(); }
    }
    function mark() {
      Array.prototype.forEach.call(list.children, function (c, i) { c.classList.toggle("act", i === act); });
      var el = list.children[act];
      if (el) { input.setAttribute("aria-activedescendant", el.id); el.scrollIntoView({ block: "nearest" }); }
    }
    function open(all) {
      if (input.disabled) return;
      render(all); list.hidden = false; isOpen = true; wrap.classList.add("open"); input.setAttribute("aria-expanded", "true");
      var cur = list.querySelector(".cur"); if (cur) list.scrollTop = cur.offsetTop - 60;
    }
    function close() { list.hidden = true; isOpen = false; wrap.classList.remove("open"); input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); }
    function pick(i) { var it = items[i]; if (!it) return; input.value = it.value; close(); onPick(it); }
    input.addEventListener("focus", function () { open(true); });
    input.addEventListener("click", function () { if (!isOpen) open(true); });
    input.addEventListener("input", function () { open(false); });
    input.addEventListener("blur", close);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); if (!isOpen) open(true); else { act = Math.min(items.length - 1, act + 1); mark(); } }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (isOpen) { act = Math.max(0, act - 1); mark(); } }
      else if (e.key === "Enter") { if (isOpen && items.length && (act >= 0 || input.value.trim())) { e.preventDefault(); pick(act >= 0 ? act : 0); } else { e.preventDefault(); close(); } }
      else if (e.key === "Escape") close();
      else if (e.key === "Tab") close();
    });
    list.addEventListener("mousedown", function (e) { e.preventDefault(); var o = e.target.closest(".combo__opt"); if (o) pick(+o.dataset.i); });
    btn.addEventListener("mousedown", function (e) { e.preventDefault(); if (isOpen) close(); else { input.focus(); open(true); } });
  }
  function modelAlias(name) {
    var a = [], low = name.toLowerCase(), MA = window.MODEL_ALIASES || {};
    Object.keys(MA).forEach(function (k) { if (low.indexOf(k.toLowerCase()) === 0) a.push(MA[k]); });
    return a.join(" ");
  }
  new Combo(brandEl, function () {
    return Object.keys(CARS).map(function (b) { return { value: b, alias: (window.BRAND_ALIASES || {})[b], meta: CARS[b].length + " мод." }; });
  }, function () { onBrand(); modelEl.focus(); });
  new Combo(modelEl, function () {
    return (CARS[state.brand] || []).map(function (m) { return { value: m[0], alias: modelAlias(m[0]), meta: B[m[1]].name }; });
  }, function () { onModel(); });

  /* популярные марки (Владивосток) */
  var pop = $("#popular");
  ["Toyota", "Nissan", "Honda", "Mazda", "Subaru", "Mitsubishi", "Lexus", "Hyundai", "Kia", "BMW", "Mercedes-Benz", "Audi"].forEach(function (b) {
    var c = document.createElement("button"); c.type = "button"; c.className = "pchip"; c.textContent = b.replace("Mercedes-Benz", "Mercedes");
    c.addEventListener("click", function () { brandEl.value = b; onBrand(); modelEl.focus(); });
    pop.appendChild(c);
  });
  var total = 0; Object.keys(CARS).forEach(function (b) { total += CARS[b].length; });
  $("#statModels").textContent = Math.floor(total / 100) * 100 + "+";

  /* bodies */
  function ic(body, win, extra, wx) {
    wx = wx || [24, 70];
    var w = wx.map(function (x) { return '<circle cx="' + x + '" cy="34" r="6"/>'; }).join("");
    return '<svg viewBox="0 0 96 44" aria-hidden="true"><path d="' + body + 'Z"/><path class="win" d="' + (win || "") + '"/>' + (extra || "") + w + '</svg>';
  }
  var ICONS = {
    // хэтчбек: короткий, «обрубленный» зад, купол крыши
    hb: ic("M12 34V23L18 12H52L68 21L86 24V34", "M24 15H37V21H20Z M40 15H51L61 21H40Z"),
    // седан: три объёма, отдельный багажник слева
    sd: ic("M6 34V25H15L26 11H56L70 21L90 24V34", "M28 14H40V21H22Z M43 14H55L64 21H43Z"),
    // универсал: длинная крыша до самого зада, три боковых окна
    wg: ic("M5 34V11L9 9H56L70 21L90 24V34", "M11 12H24V21H11Z M27 12H40V21H27Z M43 12H55L64 21H43Z"),
    // купе: низкий, скошенная крыша без заднего объёма
    cp: ic("M6 34V27L10 25L38 15H54L72 24L92 27V34", "M40 17H53L63 24H35Z"),
    // кроссовер: приподнят над землёй, пластик по низу
    cr: ic("M8 30V16L14 9H56L72 19L90 22V30", "M17 12H38V19H13Z M41 12H55L65 19H41Z", '<path class="win" d="M8 27H90"/>', [26, 72]),
    // внедорожник: прямоугольный, багажник на крыше, запаска сзади
    su: ic("M14 34V8H60L72 18H90V34", "M18 12H36V20H18Z M39 12H58V20H39Z", '<path d="M18 4H56"/><circle cx="9" cy="23" r="6"/>', [28, 74]),
    // минивэн: однообъёмный, высокий, сдвижная дверь
    mv: ic("M6 34V19Q6 8 20 8H50Q66 8 78 18L90 22V34", "M12 12H30V20H10Z M33 12H47V20H33Z M50 12H55L68 20H50Z", '<path class="win" d="M33 23V32"/>'),
    // пикап: кабина справа, открытый кузов слева
    pk: ic("M6 34V22H34V10H56L68 20H90V34", "M38 13H54L61 20H38Z", '<path class="win" d="M10 26H31"/>'),
    // микроавтобус: высокий фургон, много окон, плоский нос
    vn: ic("M6 34V6H62L76 18H90V34", "M10 10H22V18H10Z M26 10H38V18H26Z M42 10H60L68 18H42Z")
  };
  var bodiesEl = $("#bodies");
  Object.keys(B).forEach(function (k) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.k = k; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    b.innerHTML = ICONS[k] + "<span>" + B[k].name + "</span>";
    b.addEventListener("click", function () { state.body = k; state.bodyAuto = false; render(); });
    bodiesEl.appendChild(b);
  });

  /* fabrics */
  var fabEl = $("#fabricPick");
  F.forEach(function (f, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "fab"; b.dataset.id = f.id; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    b.innerHTML = "<i></i><div><b>" + f.name + "</b><small>" + f.desc + "</small></div><div class='fab__r'><span class='tag t" + (i + 1) + "'>" + f.tag + "</span><span class='fab__p'></span></div>";
    b.addEventListener("click", function () { state.fabric = f.id; render(); });
    fabEl.appendChild(b);
  });

  /* способ связи */
  var cpick = $("#contactPick");
  ["Звонок", "Telegram", "WhatsApp"].forEach(function (n) {
    var b = document.createElement("button"); b.type = "button"; b.textContent = n; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", n === state.contact);
    b.addEventListener("click", function () { state.contact = n; Array.prototype.forEach.call(cpick.children, function (c) { c.setAttribute("aria-checked", c.textContent === n); }); });
    cpick.appendChild(b);
  });

  /* extras */
  var extEl = $("#extras");
  E.forEach(function (x) {
    var l = document.createElement("label"); l.className = "ext";
    l.innerHTML = "<input type='checkbox' data-id='" + x.id + "'><span>" + x.name + "</span>";
    l.firstChild.addEventListener("change", function (e) { state.extras[x.id] = e.target.checked; render(); });
    extEl.appendChild(l);
  });

  /* ---------- pricing ---------- */
  /* чистая функция расчёта: используется и калькулятором, и карточками «от …» */
  function compute(areaBase, fid, extraIds, rush) {
    var f = F.filter(function (x) { return x.id === fid; })[0];
    var area = areaBase;
    var fabricCost = area * P.wasteFactor * f.purchase;
    var mats = P.fixedMaterials + area * P.perM2Materials, hours = P.hoursFixed + area * P.hoursPerM2, names = [];
    E.forEach(function (x) { if (!x.rush && extraIds[x.id]) { mats += x.cost; hours += x.hours; names.push(x.name); } });
    var labor = hours * P.laborRate;
    var direct = fabricCost + mats + labor;
    var overhead = direct * P.overheadPct;
    var base = direct + overhead + P.cacPerOrder;                 // себестоимость заказа
    var raw = base * (1 + P.profitPct) / (1 - P.taxPct);
    var price = Math.max(P.minPrice, Math.ceil(raw / P.roundTo) * P.roundTo);
    if (rush) price = Math.ceil(price * (1 + P.rushPct) / P.roundTo) * P.roundTo;
    var floor = Math.ceil(base / (1 - P.taxPct) * P.discountFloor / P.roundTo) * P.roundTo;
    var disc = Math.max(floor, Math.round(price * (1 - C.discountPercent / 100) / P.roundTo) * P.roundTo);
    if (disc > price) disc = price;
    var workdays = Math.ceil(hours / (rush ? P.rushHoursPerDay : P.hoursPerDay));
    var lo = rush ? 2 + workdays : P.prepDays + workdays, hi = rush ? lo + 1 : lo + P.queueDays;
    function profitAt(p) { return p * (1 - P.taxPct) - base; }
    return { area: area, fabric: f, hours: hours, fabricCost: fabricCost, mats: mats, labor: labor, overhead: overhead, cac: P.cacPerOrder,
      cost: base, price: price, disc: disc, profit: profitAt(price), profitDisc: profitAt(disc), extNames: names, lo: lo, hi: hi, rush: !!rush };
  }
  function calc(fid) {
    if (!state.brand || !state.model || !state.body) return null;
    return compute(B[state.body].area * state.mult, fid || state.fabric, state.extras, !!state.extras.rush);
  }
  function daysText(r) { return r.lo === r.hi ? r.lo + " раб. дн." : r.lo + "–" + r.hi + " раб. дн."; }

  /* ---------- discount timer (24h) ---------- */
  var TKEY = "ac_discount_until", deadline = null, tick;
  function startTimer() {
    var saved = parseInt(store.get(TKEY), 10);
    if (saved && saved > Date.now()) deadline = saved;
    else { deadline = Date.now() + C.discountHours * 3600 * 1000; store.set(TKEY, String(deadline)); }
    clearInterval(tick); tick = setInterval(updTimer, 1000); updTimer();
  }
  function updTimer() {
    var left = deadline - Date.now(), box = $(".res__timer"), t = $("#timer");
    if (left <= 0) { // скидка истекла
      if (!box.hidden) { box.hidden = true; render(); }
      return;
    }
    box.hidden = false;
    var h = Math.floor(left / 3.6e6), m = Math.floor(left % 3.6e6 / 6e4), s = Math.floor(left % 6e4 / 1e3);
    t.textContent = [h, m, s].map(function (n) { return String(n).padStart(2, "0"); }).join(":");
  }
  function discountActive() { return deadline && deadline > Date.now(); }

  /* ---------- render ---------- */
  var lastPrice = 0, started = false, lastSig = "";
  function render() {
    // chips
    Array.prototype.forEach.call(bodiesEl.children, function (c) {
      var on = c.dataset.k === state.body;
      c.setAttribute("aria-checked", on); c.classList.toggle("auto", on && state.bodyAuto);
    });
    Array.prototype.forEach.call(fabEl.children, function (c) {
      c.setAttribute("aria-checked", c.dataset.id === state.fabric);
      var rr = calc(c.dataset.id), pp = c.querySelector(".fab__p");
      pp.textContent = rr ? fmt(discountActive() ? rr.disc : rr.price) : "";
    });

    var r = calc();
    var sig = [state.brand, state.model, state.body, state.fabric, JSON.stringify(state.extras)].join("|");
    if (submitted && sig !== lastSig) { submitted = false; $("#done").hidden = true; $("#lSubmit").disabled = false; }
    lastSig = sig;
    var stepEls = document.querySelectorAll(".calc__form .step");
    stepEls[0].classList.toggle("is-done", !!(state.brand && state.model));
    stepEls[1].classList.toggle("is-done", !!state.body);
    stepEls[2].classList.toggle("is-done", !!r);
    stepEls[3].classList.toggle("is-done", !!(r && r.extNames.length));
    bodiesEl.classList.toggle("attn", !!(state.brand && state.model && !state.body));
    $("#resCar").textContent = state.brand ? (state.brand + (state.model ? " " + state.model : "")) : "Выберите автомобиль";
    var bn = state.body ? B[state.body].name : "кузов не выбран";
    var fn = F.filter(function (x) { return x.id === state.fabric; })[0].name;
    $("#resMeta").textContent = state.brand ? bn + " · " + fn : "Марка, модель, кузов и материал";
    $("#priceBox").hidden = !r; $("#priceEmpty").hidden = !!r; $("#leadForm").hidden = !r || !!submitted;
    var pe0 = $("#priceEmpty");
    if (!r) {
      var msg = !state.brand ? "Выберите марку автомобиля — первый шаг слева." : !state.model ? "Теперь выберите или впишите модель." : "Осталось выбрать тип кузова (шаг 2) — и покажем цену.";
      pe0.textContent = msg; pe0.classList.toggle("hint", !!state.brand);
    }
    if (!state.known && state.brand) $("#carNote").textContent = "Такой марки нет в списке — ничего страшного: впишите модель, выберите кузов, точную цену назовём по телефону.";
    else if (state.known && state.model && !state.bodyAuto) $("#carNote").textContent = "Модель вписана вручную — расчёт ориентировочный, точную цену подтвердим по телефону.";
    else $("#carNote").textContent = "Не нашли свою модель? Впишите её вручную и выберите кузов — цену уточним по телефону.";
    var mc = $(".mbar .btn:last-child");
    if (!r) { mc.textContent = "Рассчитать"; mc.setAttribute("href", "#calc"); return; }
    if (!started) { started = true; startTimer(); track("price_shown", { car: state.brand + " " + state.model }); }
    var active = discountActive();
    $("#lSubmit").textContent = active ? "Получить звонок со скидкой" : "Заказать звонок";
    $(".lform h4").textContent = active ? "Закрепите скидку — мы перезвоним" : "Оставьте заявку — мы перезвоним";
    var shown = active ? r.disc : r.price;
    $("#priceOld").parentNode.style.visibility = active ? "visible" : "hidden";
    $("#priceOld").textContent = fmt(r.price);
    $("#badge").textContent = "−" + C.discountPercent + "%";
    var pe = $("#priceNew");
    if (shown !== lastPrice) {
      var from = lastPrice || shown, t0 = null, dur = 380;
      cancelAnimationFrame(pe._raf);
      if (!from || from === shown || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) pe.textContent = fmt(shown);
      else (function tw(ts) { if (t0 === null) t0 = ts; var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3); pe.textContent = fmt(from + (shown - from) * e); if (k < 1) pe._raf = requestAnimationFrame(tw); else pe.textContent = fmt(shown); })(performance.now());
      lastPrice = shown;
    } else pe.textContent = fmt(shown);
    var lines = [
      ["Материал", r.fabric.name],
      ["Площадь выкройки", r.area.toFixed(1).replace(".", ",") + " м²"]
    ];
    if (r.extNames.length) lines.push(["Опции", r.extNames.length + " шт."]);
    lines.push(["Срок пошива", daysText(r)]);
    $("#lines").innerHTML = lines.map(function (l) { return "<li><span>" + l[0] + "</span><b>" + l[1] + "</b></li>"; }).join("");
    mc.textContent = "Заявка · " + fmt(shown); mc.setAttribute("href", "#result");
    window.__calc = r;
  }

  /* ---------- phone mask + validation ---------- */
  function maskPhone(el) {
    el.addEventListener("input", function () {
      var d = el.value.replace(/\D/g, "");
      if (d[0] === "8") d = "7" + d.slice(1);
      if (d && d[0] !== "7") d = "7" + d;
      d = d.slice(0, 11);
      var o = "";
      if (d.length) o = "+7";
      if (d.length > 1) o += " (" + d.slice(1, 4);
      if (d.length >= 4) o += ")";
      if (d.length > 4) o += " " + d.slice(4, 7);
      if (d.length > 7) o += "-" + d.slice(7, 9);
      if (d.length > 9) o += "-" + d.slice(9, 11);
      el.value = o;
    });
  }
  ["#lPhone", "#aPhone"].forEach(function (s) { maskPhone($(s)); });
  function phoneOk(v) { return v.replace(/\D/g, "").length === 11; }
  function bad(el, on) { el.classList.toggle("bad", !!on); }

  function rub(n) { return Math.round(n || 0).toLocaleString("ru-RU").replace(/ /g, " ") + " ₽"; }
  var NL = String.fromCharCode(10);
  function leadText(d) {
    if (d.type === "question") return ["ВОПРОС С САЙТА", "Имя: " + d.name, "Телефон: " + d.phone, "", d.question].join(NL);
    var p = d.pricing || {}, c = d.car || {};
    return [
      "НОВАЯ ЗАЯВКА — РАСЧЁТ ЧЕХЛА",
      "Имя: " + d.name, "Телефон: " + d.phone, "Как связаться: " + (d.contact || "Звонок"), d.comment ? "Комментарий: " + d.comment : "", "",
      "Авто: " + c.brand + " " + c.model + (c.year ? " (" + c.year + ")" : "") + (c.knownModel ? "" : " [модель вписана вручную]"),
      "Кузов: " + c.body, "Материал: " + d.fabric, "Площадь: " + d.areaM2 + " м²",
      d.extras && d.extras.length ? "Опции: " + d.extras.join(", ") : "", "",
      "Закупка ткани: " + rub(p.fabricPurchase), "Расходники: " + rub(p.materials), "Труд: " + p.laborHours + " ч = " + rub(p.labor),
      "Накладные: " + rub(p.overhead), "Реклама на заказ: " + rub(p.cac), "Себестоимость: " + rub(p.cost),
      "Цена без скидки: " + rub(p.price) + (p.rush ? " (срочный)" : ""),
      "К оплате" + (p.discountPercent ? " со скидкой " + p.discountPercent + "%" : "") + ": " + rub(p.priceWithDiscount),
      "Прибыль после налога: " + rub(p.profit), "Срок: " + p.leadTime
    ].filter(function (x, i, a) { return x !== "" || (a[i - 1] !== ""); }).join(NL);
  }
  function send(payload) {
    // Вариант 1 (GitHub Pages, без сервера): Web3Forms → письмо владельцу
    if (C.web3formsKey) {
      var subj = payload.type === "question" ? "Вопрос с сайта — " + payload.name : "Заявка: " + payload.car.brand + " " + payload.car.model + " — " + rub(payload.pricing.priceWithDiscount);
      return fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ access_key: C.web3formsKey, subject: subj, from_name: C.brand + " (сайт)", name: payload.name, phone: payload.phone, message: leadText(payload) })
      }).then(function (r) { return r.json(); }).then(function (r) { if (!r.success) throw new Error("web3forms"); return r; });
    }
    // Вариант 2: собственный сервер server.js
    return fetch(C.leadEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); });
  }

  /* ---------- lead form ---------- */
  var submitted = false;
  $("#leadForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var r = window.__calc, err = $("#lErr"), n = $("#lName"), p = $("#lPhone");
    err.hidden = true; bad(n, !n.value.trim()); bad(p, !phoneOk(p.value));
    if (!n.value.trim() || !phoneOk(p.value)) { err.textContent = "Укажите имя и телефон полностью."; err.hidden = false; return; }
    if (yearVal() === null) { bad(yearEl, true); err.textContent = "Год выпуска — четыре цифры, например 2018 (или оставьте поле пустым)."; err.hidden = false; yearEl.scrollIntoView({ block: "center" }); return; }
    if (!$("#lAgree").checked) { err.textContent = "Нужно согласие на обработку данных."; err.hidden = false; return; }
    if ($("#lHp").value) { submitted = true; $("#leadForm").hidden = true; $("#done").hidden = false; return; }
    var btn = $("#lSubmit"); btn.disabled = true; btn.textContent = "Отправляем…";
    var active = discountActive();
    send({
      type: "calc",
      name: n.value.trim(), phone: p.value, contact: state.contact, comment: $("#lComment").value.trim(),
      car: { brand: state.brand, model: state.model, year: yearVal(), knownModel: !!state.bodyAuto, body: B[state.body].name },
      fabric: r.fabric.name, extras: r.extNames, areaM2: +r.area.toFixed(2),
      pricing: {
        fabricPurchase: Math.round(r.fabricCost), materials: Math.round(r.mats), laborHours: +r.hours.toFixed(1), labor: Math.round(r.labor),
        overhead: Math.round(r.overhead), cac: r.cac, cost: Math.round(r.cost), price: r.price,
        discountPercent: active ? C.discountPercent : 0, priceWithDiscount: active ? r.disc : r.price,
        profit: Math.round(active ? r.profitDisc : r.profit), rush: r.rush, leadTime: daysText(r)
      },
      page: location.href
    }).then(function () {
      track("lead_submit", { price: r.price, car: state.brand + " " + state.model, discount: active });
      submitted = true; $("#leadForm").hidden = true; $("#done").hidden = false;
      $("#done").scrollIntoView({ behavior: "smooth", block: "center" });
    }).catch(function () {
      err.innerHTML = "Не удалось отправить заявку. Позвоните нам: <a href='tel:" + C.phoneRaw + "' style='text-decoration:underline'>" + C.phone + "</a> или напишите в Telegram.";
      err.hidden = false; btn.disabled = false; btn.textContent = discountActive() ? "Получить звонок со скидкой" : "Заказать звонок";
    });
  });

  /* ---------- question form ---------- */
  $("#askForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("#aName"), p = $("#aPhone"), q = $("#aQuestion"), err = $("#aErr"), ok = $("#aOk");
    err.hidden = true; ok.hidden = true;
    bad(n, !n.value.trim()); bad(p, !phoneOk(p.value)); bad(q, !q.value.trim());
    if (!n.value.trim() || !phoneOk(p.value) || !q.value.trim()) { err.textContent = "Заполните имя, телефон и вопрос."; err.hidden = false; return; }
    if (!$("#aAgree").checked) { err.textContent = "Нужно согласие на обработку данных."; err.hidden = false; return; }
    if ($("#aHp").value) { ok.hidden = false; $("#askForm").reset(); return; }
    var btn = $("#aSubmit"); btn.disabled = true; btn.textContent = "Отправляем…";
    send({ type: "question", name: n.value.trim(), phone: p.value, question: q.value.trim(), page: location.href })
      .then(function () { track("question_submit"); ok.hidden = false; $("#askForm").reset(); btn.textContent = "Отправить ещё вопрос"; btn.disabled = false; })
      .catch(function () {
        err.innerHTML = "Не удалось отправить. Позвоните: <a href='tel:" + C.phoneRaw + "' style='text-decoration:underline'>" + C.phone + "</a>";
        err.hidden = false; btn.disabled = false; btn.textContent = "Отправить вопрос";
      });
  });
  [$("#lName"), $("#aName"), $("#aQuestion"), $("#lPhone"), $("#aPhone")].forEach(function (el) { el.addEventListener("input", function () { bad(el, false); }); });

  /* ---------- сроки в хиро ---------- */
  (function () {
    var lo = 99, hi = 0;
    Object.keys(B).forEach(function (k) { var r = compute(B[k].area, "oxford", {}, false); lo = Math.min(lo, r.lo); hi = Math.max(hi, r.hi); });
    $("#heroDays").textContent = lo + "–" + hi + " дн.";
  })();

  /* ---------- fabric info cards ---------- */
  var fc = $("#fabCards");
  F.forEach(function (f, i) {
    var from = compute(B.hb.area, f.id, {}, false).price;
    if (i === 0) $("#heroFrom").textContent = "от " + fmt(from);
    var d = document.createElement("div");
    d.className = "fcard" + (i === 1 ? " hit" : "") + (i === 2 ? " t3" : "");
    d.innerHTML = "<span class='tag'>" + f.tag + "</span><h3>" + f.name + "</h3><p>" + f.desc + "</p><div class='from'>Чехол на хэтчбек от<b>" + fmt(from) + "</b></div>";
    fc.appendChild(d);
  });

  /* ---------- структурированные данные для поисковиков ---------- */
  (function () {
    var g = [];
    if (C.phoneRaw && C.phone.indexOf("000-00-00") < 0) {
      g.push({ "@type": "LocalBusiness", name: C.brand, telephone: C.phoneRaw, address: { "@type": "PostalAddress", addressLocality: C.city, addressCountry: "RU" }, areaServed: C.city, url: location.href.split("#")[0], image: location.origin + location.pathname.replace(/[^\/]*$/, "") + "assets/og.jpg" });
    }
    var q = [];
    document.querySelectorAll("#faq details").forEach(function (d) {
      q.push({ "@type": "Question", name: d.querySelector("summary").textContent, acceptedAnswer: { "@type": "Answer", text: d.querySelector("p").textContent } });
    });
    if (q.length) g.push({ "@type": "FAQPage", mainEntity: q });
    if (!g.length) return;
    var s = document.createElement("script"); s.type = "application/ld+json";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": g });
    document.head.appendChild(s);
  })();

  render();
})();
