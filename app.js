(function () {
  "use strict";
  var C = window.CONFIG, P = window.PRICING, F = window.FABRICS, E = window.EXTRAS, B = window.BODIES, CARS = window.CARS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var fmt = function (n) { return Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ") + " ₽"; };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- config → DOM ---------- */
  document.querySelectorAll("[data-cfg]").forEach(function (el) { el.textContent = C[el.dataset.cfg] || ""; });
  document.querySelectorAll("[data-phone]").forEach(function (el) { el.href = "tel:" + C.phoneRaw; if (el.classList.contains("hdr__phone")) el.textContent = C.phone; });
  document.querySelectorAll("[data-phone-text]").forEach(function (el) { el.textContent = C.phone; });
  document.querySelectorAll("[data-tg]").forEach(function (el) { el.href = C.telegram; });
  document.querySelectorAll("[data-wa]").forEach(function (el) { el.href = C.whatsapp; });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- auto banner carousel ---------- */
  (function () {
    var root = $("#banner"), track = $("#bTrack"), dots = $("#bDots"), prog = $("#bProg");
    var n = track.children.length, cur = 0, DELAY = 5000, start = Date.now(), paused = false, left = DELAY, last = Date.now();
    for (var i = 0; i < n; i++) (function (i) {
      var b = document.createElement("button"); b.setAttribute("aria-label", "Слайд " + (i + 1));
      b.addEventListener("click", function () { go(i); }); dots.appendChild(b);
    })(i);
    function go(i) {
      cur = (i + n) % n;
      track.style.transform = "translateX(" + (-cur * 100) + "%)";
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle("on", k === cur); });
      left = DELAY;
    }
    $("#bPrev").addEventListener("click", function () { go(cur - 1); });
    $("#bNext").addEventListener("click", function () { go(cur + 1); });
    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    // свайп
    var sx = null;
    root.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; paused = true; }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (sx !== null) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); }
      sx = null; paused = false;
    });
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function loop() {
      var now = Date.now(), dt = now - last; last = now;
      if (!paused && !document.hidden && !reduce) { left -= dt; if (left <= 0) go(cur + 1); }
      prog.style.width = (100 - left / DELAY * 100) + "%";
      requestAnimationFrame(loop);
    }
    go(0); requestAnimationFrame(loop);
  })();

  /* ---------- calculator state ---------- */
  var state = { brand: "", model: "", mult: 1, body: null, bodyAuto: false, fabric: "premium", extras: {} };

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
  var bodiesEl = $("#bodies");
  Object.keys(B).forEach(function (k) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.k = k; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    b.textContent = B[k].name;
    b.addEventListener("click", function () { state.body = k; state.bodyAuto = false; render(); });
    bodiesEl.appendChild(b);
  });

  /* fabrics */
  var fabEl = $("#fabricPick");
  F.forEach(function (f, i) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "fab"; b.dataset.id = f.id; b.setAttribute("role", "radio"); b.setAttribute("aria-checked", "false");
    b.innerHTML = "<i></i><div><b>" + f.name + "</b><small>" + f.desc + "</small></div><span class='tag t" + (i + 1) + "'>" + f.tag + "</span>";
    b.addEventListener("click", function () { state.fabric = f.id; render(); });
    fabEl.appendChild(b);
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
  function calc() {
    if (!state.brand || !state.model || !state.body) return null;
    var f = F.filter(function (x) { return x.id === state.fabric; })[0];
    var area = B[state.body].area * state.mult;
    var fabricCost = area * f.purchase;
    var prod = P.fixedPerCover + area * P.sewPerM2;
    var ext = 0, names = [];
    E.forEach(function (x) { if (state.extras[x.id]) { ext += x.cost; names.push(x.name); } });
    var cost = fabricCost + prod + ext;
    var price = cost * (1 + P.markup);
    price = Math.max(P.minPrice, Math.round(price / P.roundTo) * P.roundTo);
    var disc = Math.round(price * (1 - C.discountPercent / 100) / P.roundTo) * P.roundTo;
    return { area: area, fabric: f, fabricCost: fabricCost, prod: prod, ext: ext, extNames: names, cost: cost, markup: price - cost, price: price, disc: disc };
  }

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
    Array.prototype.forEach.call(fabEl.children, function (c) { c.setAttribute("aria-checked", c.dataset.id === state.fabric); });

    var r = calc();
    var sig = [state.brand, state.model, state.body, state.fabric, JSON.stringify(state.extras)].join("|");
    if (submitted && sig !== lastSig) { submitted = false; $("#done").hidden = true; $("#lSubmit").disabled = false; }
    lastSig = sig;
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
    if (!started) { started = true; startTimer(); }
    var active = discountActive();
    $("#lSubmit").textContent = active ? "Получить звонок со скидкой" : "Заказать звонок";
    $(".lead h4").textContent = active ? "Закрепите скидку — мы перезвоним" : "Оставьте заявку — мы перезвоним";
    var shown = active ? r.disc : r.price;
    $("#priceOld").parentNode.style.visibility = active ? "visible" : "hidden";
    $("#priceOld").textContent = fmt(r.price);
    $("#badge").textContent = "−" + C.discountPercent + "%";
    var pe = $("#priceNew"); pe.textContent = fmt(shown);
    if (shown !== lastPrice) { pe.classList.add("bump"); setTimeout(function () { pe.classList.remove("bump"); }, 200); lastPrice = shown; }
    var lines = [
      ["Материал", r.fabric.name],
      ["Площадь выкройки", r.area.toFixed(1).replace(".", ",") + " м²"]
    ];
    if (r.extNames.length) lines.push(["Опции", r.extNames.length + " шт."]);
    lines.push(["Срок пошива", "3–7 дней"]);
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
      "Имя: " + d.name, "Телефон: " + d.phone, d.comment ? "Комментарий: " + d.comment : "", "",
      "Авто: " + c.brand + " " + c.model + (c.year ? " (" + c.year + ")" : "") + (c.knownModel ? "" : " [модель вписана вручную]"),
      "Кузов: " + c.body, "Материал: " + d.fabric, "Площадь: " + d.areaM2 + " м²",
      d.extras && d.extras.length ? "Опции: " + d.extras.join(", ") : "", "",
      "Закупка ткани: " + rub(p.fabricPurchase), "Производство: " + rub(p.production), p.options ? "Опции: " + rub(p.options) : "",
      "Себестоимость: " + rub(p.cost), "Наценка: " + rub(p.markup), "Цена без скидки: " + rub(p.price),
      "К оплате" + (p.discountPercent ? " со скидкой " + p.discountPercent + "%" : "") + ": " + rub(p.priceWithDiscount)
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
    var btn = $("#lSubmit"); btn.disabled = true; btn.textContent = "Отправляем…";
    var active = discountActive();
    send({
      type: "calc",
      name: n.value.trim(), phone: p.value, comment: $("#lComment").value.trim(),
      car: { brand: state.brand, model: state.model, year: yearVal(), knownModel: !!state.bodyAuto, body: B[state.body].name },
      fabric: r.fabric.name, extras: r.extNames, areaM2: +r.area.toFixed(2),
      pricing: {
        fabricPurchase: Math.round(r.fabricCost), production: Math.round(r.prod), options: Math.round(r.ext),
        cost: Math.round(r.cost), markup: Math.round(r.markup), price: r.price,
        discountPercent: active ? C.discountPercent : 0, priceWithDiscount: active ? r.disc : r.price
      },
      page: location.href
    }).then(function () {
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
    var btn = $("#aSubmit"); btn.disabled = true; btn.textContent = "Отправляем…";
    send({ type: "question", name: n.value.trim(), phone: p.value, question: q.value.trim(), page: location.href })
      .then(function () { ok.hidden = false; $("#askForm").reset(); btn.textContent = "Отправить ещё вопрос"; btn.disabled = false; })
      .catch(function () {
        err.innerHTML = "Не удалось отправить. Позвоните: <a href='tel:" + C.phoneRaw + "' style='text-decoration:underline'>" + C.phone + "</a>";
        err.hidden = false; btn.disabled = false; btn.textContent = "Отправить вопрос";
      });
  });
  [$("#lName"), $("#aName"), $("#aQuestion"), $("#lPhone"), $("#aPhone")].forEach(function (el) { el.addEventListener("input", function () { bad(el, false); }); });

  /* ---------- fabric info cards ---------- */
  var fc = $("#fabCards");
  F.forEach(function (f, i) {
    var base = B.cr.area * f.purchase + P.fixedPerCover + B.cr.area * P.sewPerM2;
    var from = Math.round(B.hb.area * f.purchase * 1 + P.fixedPerCover + B.hb.area * P.sewPerM2);
    from = Math.max(P.minPrice, Math.round(from * (1 + P.markup) / P.roundTo) * P.roundTo);
    var d = document.createElement("div");
    d.className = "fcard" + (i === 1 ? " hit" : "") + (i === 2 ? " t3" : "");
    d.innerHTML = "<span class='tag'>" + f.tag + "</span><h3>" + f.name + "</h3><p>" + f.desc + "</p><div class='from'>Чехол на хэтчбек от<b>" + fmt(from) + "</b></div>";
    fc.appendChild(d);
  });

  render();
})();
