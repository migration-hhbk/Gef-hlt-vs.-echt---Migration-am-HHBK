/*
 * Gefühlt vs. echt – App-Logik
 * Projekt der AIA31, Heinrich-Hertz-Berufskolleg Düsseldorf
 *
 * Aufbau: Deckblatt (Passeinband) → 8 Stationen (Visa-Seiten) → Mein Pass.
 * Dazu die eigene Seite „Sprachpaten“ mit direkter Anmeldung.
 * 9 Stempel = Einreise (schon drin) + 8 Stationen – genau wie auf dem Flyer.
 */
(function () {
  "use strict";

  var C = window.MHHBK_CONFIG || {};
  var D = window.MHHBK_DATA;
  var CH = window.MHHBK_CHARTS;
  var h = CH.h;
  var MIN_N = C.minN || 5;
  var TOTAL = 9;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmt(v, unit) { return CH.withUnit(v, unit); }
  function langName(code) { var f = D.languages.filter(function (l) { return l[0] === code; })[0]; return f ? f[1] : code; }
  function label(list, key) { var f = list.filter(function (l) { return l[0] === key; })[0]; return f ? f[1] : key; }
  function dateDe(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  function minutes(m) { return m < 1 ? "unter 1 Min." : "ca. " + CH.num(m, 0) + " Min."; }
  function buzz(pattern) { if (reduceMotion) return; try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* egal */ } }

  // Wurde gerade mit Finger oder Maus gewählt? Nur dann springen Fragen automatisch weiter.
  var lastPointer = 0;
  document.addEventListener("pointerdown", function () { lastPointer = Date.now(); }, true);
  function viaPointer() { return Date.now() - lastPointer < 900; }

  /* ---------------- Speicher im Browser ---------------- */
  var STORE_KEY = "mhhbk.v1";
  function newId() {
    var a = new Uint8Array(12);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
    return "m" + Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function loadState() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || null; } catch (e) { return null; } }
  var state = Object.assign({
    id: newId(), answers: {}, quiz: {}, done: {}, doneAt: {}, moments: {}, level: 0,
    pending: {}, pate: null, nachher: false,
    terms: {}, tl: [], sort: {}, since: null, flyer: false, valid: false
  }, loadState() || {});
  ["answers", "quiz", "done", "doneAt", "moments", "pending", "terms", "sort"].forEach(function (k) {
    if (!state[k] || typeof state[k] !== "object" || Array.isArray(state[k])) state[k] = {};
  });
  if (!Array.isArray(state.tl)) state.tl = [];
  if (!state.since) state.since = new Date().toISOString();
  // Wer über den QR-Code des Flyers kommt, bekommt den Einreise-Stempel „Flyer gelesen“ – wie auf dem Flyer gedruckt.
  if (/[?&]flyer(?:[=&]|$)/.test(location.search)) {
    state.flyer = true;
    try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) { /* egal */ }
  }
  function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* privater Modus */ } }
  persist();

  /* ---------------- Verbindung zur Datenbank ---------------- */
  var API = {
    enabled: typeof C.apiUrl === "string" && /^https:\/\/script\.google(usercontent)?\.com\//.test(C.apiUrl.trim()),
    url: (C.apiUrl || "").trim(),
    _timer: null, _busy: false, _stats: null, _statsAt: 0,

    send: function (payload) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      return fetch(API.url, { method: "POST", body: JSON.stringify(payload), redirect: "follow", signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json(); })
        .finally(function () { clearTimeout(t); });
    },
    queue: function (fields) {
      Object.keys(fields).forEach(function (k) { state.pending[k] = fields[k]; });
      persist();
      clearTimeout(API._timer);
      API._timer = setTimeout(API.flush, 350);
    },
    flush: function () {
      if (!API.enabled || API._busy) return Promise.resolve(false);
      var keys = Object.keys(state.pending);
      if (!keys.length) return Promise.resolve(true);
      var fields = {};
      keys.forEach(function (k) { fields[k] = state.pending[k]; });
      API._busy = true;
      return API.send({ action: "save", id: state.id, fields: fields })
        .then(function (res) {
          if (res && res.ok) {
            keys.forEach(function (k) { if (state.pending[k] === fields[k]) delete state.pending[k]; });
            persist();
            API._stats = null;
            return true;
          }
          return false;
        })
        .catch(function () { return false; })
        .finally(function () { API._busy = false; });
    },
    stats: function (force) {
      if (!API.enabled) return Promise.resolve(null);
      if (!force && API._stats && Date.now() - API._statsAt < 20000) return Promise.resolve(API._stats);
      var ctrl = window.AbortController ? new AbortController() : null;
      var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      return fetch(API.url + "?action=stats&t=" + Date.now(), { redirect: "follow", signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.ok) { API._stats = data; API._statsAt = Date.now(); return data; }
          throw new Error("stats");
        })
        .finally(function () { clearTimeout(t); });
    }
  };
  window.addEventListener("online", function () { API.flush(); });

  /* ---------------- Hinweise ---------------- */
  var toastQ = [], toastOn = false;
  function toast(msg, kind) {
    var item = { msg: msg, kind: kind || "info" };
    toastQ.push(item);
    if (toastQ.length > 3) toastQ.splice(0, toastQ.length - 3);
    if (!toastOn) nextToast();
    return item;
  }
  function nextToast() {
    var t = $("#toast");
    var item = toastQ.shift();
    if (!item) { toastOn = false; return; }
    toastOn = true;
    t.textContent = item.msg;
    t.classList.add("is-on");
    var ms = item.kind === "term" ? 2400 : Math.max(2600, Math.min(5200, item.msg.length * 55));
    setTimeout(function () { t.classList.remove("is-on"); setTimeout(nextToast, 300); }, ms);
  }
  function announce(msg) { var a = $("#announce"); if (!a) return; a.textContent = ""; setTimeout(function () { a.textContent = msg; }, 60); }

  /* ---------------- Stempel ---------------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  // Eckiger Stempel mit Doppelrahmen
  function stamp(o) {
    var top = (o.top || "").toUpperCase(), main = String(o.main).toUpperCase(), bottom = (o.bottom || "").toUpperCase();
    var mainSize = o.mainSize || 40, small = o.smallSize || 13;
    var wMain = main.length * mainSize * 0.46;
    var wSmall = Math.max(top.length, bottom.length) * small * 0.6;
    var W = Math.round(Math.max(wMain, wSmall) + 46);
    var y = 15, texts = [];
    if (top) { y += small + 3; texts.push({ t: top, y: y, s: small, cls: "stamp__small", w: top.length * small * 0.6 }); y += 5; }
    y += mainSize * 0.74;
    texts.push({ t: main, y: y, s: mainSize, cls: "", w: wMain });
    y += mainSize * 0.12 + 4;
    if (bottom) { y += small + 1; texts.push({ t: bottom, y: y, s: small, cls: "stamp__small", w: bottom.length * small * 0.6 }); y += 3; }
    var H = Math.round(y + 14);

    var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "stamp", role: "img", "aria-label": o.label || main, focusable: "false" });
    svg.style.color = o.color || "var(--stamp)";
    var rot = o.rotate === undefined ? -4 : o.rotate;
    svg.style.setProperty("--r", rot + "deg");
    svg.style.transform = "rotate(" + rot + "deg)";
    var g = svgEl("g", { filter: "url(#ink)" });
    g.appendChild(svgEl("rect", { x: 3, y: 3, width: W - 6, height: H - 6, rx: 8, fill: "none", stroke: "currentColor", "stroke-width": 4.6 }));
    g.appendChild(svgEl("rect", { x: 10, y: 10, width: W - 20, height: H - 20, rx: 4, fill: "none", stroke: "currentColor", "stroke-width": 1.7 }));
    texts.forEach(function (tx) {
      var t = svgEl("text", { x: W / 2, y: tx.y, "text-anchor": "middle", "font-size": tx.s, fill: "currentColor", textLength: Math.min(tx.w, W - 30), lengthAdjust: "spacingAndGlyphs" });
      if (tx.cls) t.setAttribute("class", tx.cls);
      t.textContent = tx.t;
      g.appendChild(t);
    });
    svg.appendChild(g);
    if (o.animate && !reduceMotion) svg.classList.add("stamp--in");
    return svg;
  }
  // Runder Einreisestempel mit Schrift im Ring
  var uidN = 0;
  function roundStamp(o) {
    var uid = "rs" + (++uidN);
    var svg = svgEl("svg", { viewBox: "0 0 120 120", class: "stamp stamp--round", role: "img", "aria-label": o.label || o.main, focusable: "false" });
    svg.style.color = o.color || "var(--stamp)";
    var rot = o.rotate === undefined ? -6 : o.rotate;
    svg.style.setProperty("--r", rot + "deg");
    svg.style.transform = "rotate(" + rot + "deg)";
    var defs = svgEl("defs");
    defs.appendChild(svgEl("path", { id: uid + "t", d: "M21 60 A39 39 0 0 1 99 60", fill: "none" }));
    defs.appendChild(svgEl("path", { id: uid + "b", d: "M14 60 A46 46 0 0 0 106 60", fill: "none" }));
    svg.appendChild(defs);
    var g = svgEl("g", { filter: "url(#ink)" });
    g.appendChild(svgEl("circle", { cx: 60, cy: 60, r: 55, fill: "none", stroke: "currentColor", "stroke-width": 4.4 }));
    g.appendChild(svgEl("circle", { cx: 60, cy: 60, r: 48.5, fill: "none", stroke: "currentColor", "stroke-width": 1.5 }));
    g.appendChild(svgEl("circle", { cx: 60, cy: 60, r: 33, fill: "none", stroke: "currentColor", "stroke-width": 1.2 }));
    function arc(id, txt) {
      var t = svgEl("text", { "font-size": 8.6, fill: "currentColor", class: "stamp__small", "text-anchor": "middle" });
      var tp = svgEl("textPath", { href: "#" + id, startOffset: "50%" });
      tp.textContent = String(txt || "").toUpperCase();
      t.appendChild(tp);
      return t;
    }
    g.appendChild(arc(uid + "t", o.ring || "Gefühlt vs. echt"));
    if (o.bottom) g.appendChild(arc(uid + "b", o.bottom));
    g.appendChild(svgEl("circle", { cx: 9.5, cy: 60, r: 1.7, fill: "currentColor" }));
    g.appendChild(svgEl("circle", { cx: 110.5, cy: 60, r: 1.7, fill: "currentColor" }));
    var main = String(o.main).toUpperCase();
    var size = main.length > 9 ? 15 : main.length > 7 ? 17 : 19;
    var mw = Math.min(main.length * size * 0.5, 58);
    if (o.small) {
      var s1 = svgEl("text", { x: 60, y: 55, "text-anchor": "middle", "font-size": 8.4, fill: "currentColor", class: "stamp__small" });
      s1.textContent = o.small.toUpperCase();
      g.appendChild(s1);
    }
    var m = svgEl("text", { x: 60, y: o.small ? 71 : 60 + size * 0.36, "text-anchor": "middle", "font-size": size, fill: "currentColor", textLength: mw, lengthAdjust: "spacingAndGlyphs" });
    m.textContent = main;
    g.appendChild(m);
    svg.appendChild(g);
    if (o.animate && !reduceMotion) svg.classList.add("stamp--in");
    return svg;
  }

  /* ---------------- Stationen, Pass und Navigation ---------------- */
  var stations = D.stations;
  var order = ["start"].concat(stations.map(function (s) { return s.slug; })).concat(["pass", "sprachpaten", "projekt"]);
  var pageTitles = { pass: "Mein Pass", sprachpaten: "Sprachpaten", projekt: "Über das Projekt" };
  var current = null;
  var enterHooks = {};
  var leaveHooks = {};

  function stationIndex(slug) { for (var i = 0; i < stations.length; i++) if (stations[i].slug === slug) return i; return -1; }
  function doneCount() { return 1 + stations.filter(function (s) { return state.done[s.slug]; }).length; }
  function firstUndone() { for (var i = 0; i < stations.length; i++) if (!state.done[stations[i].slug]) return stations[i]; return null; }
  function termCount() { return Object.keys(state.terms).filter(function (k) { return D.terms[k]; }).length; }

  function stampFor(slug, animate) {
    var cfg = D.stamps[slug] || {};
    if (slug === "einreise") {
      return stamp({
        top: "Einreise", main: state.flyer ? "Flyer" : "HHBK", bottom: state.flyer ? "gelesen" : dateDe(state.since),
        color: cfg.color, rotate: cfg.rot, mainSize: 36, animate: animate,
        label: state.flyer ? "Stempel 1 von 9: Einreise, Flyer gelesen" : "Stempel 1 von 9: Einreise"
      });
    }
    var i = stationIndex(slug), st = stations[i];
    var lab = "Stempel für Station " + (i + 1) + ": " + st.title;
    var date = dateDe(state.doneAt[slug]);
    if (cfg.shape === "round") {
      return roundStamp({ ring: "Station " + (i + 1) + " · HHBK", small: cfg.small, main: cfg.word, bottom: date, color: cfg.color, rotate: cfg.rot, animate: animate, label: lab });
    }
    return stamp({ top: cfg.small || "Station " + (i + 1), main: cfg.word, bottom: date, color: cfg.color, rotate: cfg.rot, mainSize: 34, animate: animate, label: lab });
  }

  // Stempel vergeben – mit kleiner Feier, die nicht im Weg ist
  var AUTO_NEXT = ["zeitreise", "abwaegen", "loesung"];
  var barHold = null; // so viele Stempel zeigt die Kopfleiste, bis der neue Stempel gelandet ist
  function markDone(slug) {
    if (state.done[slug] || stationIndex(slug) === -1) return false;
    if (!reduceMotion) barHold = doneCount();
    state.done[slug] = true;
    state.doneAt[slug] = new Date().toISOString();
    persist();
    renderBar();
    renderVisa(slug, true);
    var n = doneCount();
    celebrate(slug, n);
    if (n === TOTAL && !state.valid) {
      state.valid = true; persist();
      setTimeout(passValid, reduceMotion ? 400 : 1950);
    }
    return true;
  }

  var popTimer = null;
  function showPop(content, caption, big, onDone) {
    var pop = $("#pop");
    clearTimeout(popTimer);
    if (barHold !== null && big) { barHold = null; }
    pop.className = "pop" + (big ? " pop--big" : "");
    pop.innerHTML = "";
    var fly = h("div", { class: "pop__fly" }, [
      h("div", { class: "pop__inner" }, [h("div", { class: "pop__paper" }, [content]), caption ? h("p", { class: "pop__cap" }, caption) : null])
    ]);
    pop.appendChild(fly);
    popTimer = setTimeout(function () {
      var tgt = $("#bar-pass");
      if (!big && tgt && tgt.offsetParent !== null) {
        var a = tgt.getBoundingClientRect(), b = fly.getBoundingClientRect();
        fly.style.setProperty("--dx", Math.round(a.left + a.width / 2 - (b.left + b.width / 2)) + "px");
        fly.style.setProperty("--dy", Math.round(a.top + a.height / 2 - (b.top + b.height / 2)) + "px");
      }
      pop.classList.add("is-out");
      popTimer = setTimeout(function () { pop.className = "pop"; pop.innerHTML = ""; if (onDone) onDone(); }, 480);
    }, big ? 1900 : 1250);
  }
  function celebrate(slug, n) {
    var st = stations[stationIndex(slug)];
    var msg = "Stempel " + n + " von " + TOTAL + ": " + st.title + "." + (n < TOTAL ? " Noch " + (TOTAL - n) + " bis zum gültigen Pass." : "");
    buzz([16, 50, 28]);
    if (reduceMotion) { toast(msg); return; }
    announce(msg);
    showPop(stampFor(slug, false), ["Stempel ", h("b", { text: n + " von " + TOTAL })], false, function () { barHold = null; renderBar(); bumpBar(); });
  }
  function passValid() {
    buzz([30, 60, 30, 60, 90]);
    var msg = "Dein Pass ist gültig! Alle 9 Stempel gesammelt.";
    insertValidBanner();
    renderBar();
    if (reduceMotion) { toast(msg); return; }
    announce(msg);
    confetti();
    showPop(stamp({ top: "Reisepass", main: "gültig", bottom: "9 von 9 Stempeln", color: "#2B704F", rotate: -8, mainSize: 58, label: "Pass gültig" }), ["Alle ", h("b", { text: "9 Stempel" }), " gesammelt"], true, bumpBar);
  }
  function confetti(count) {
    if (reduceMotion) return;
    var box = $("#confetti");
    box.innerHTML = "";
    var cols = ["#5B3C9F", "#1C7FA3", "#8A4B2A", "#2B704F", "#A33434", "#6B1E2E", "#2B5C8A", "#D4B06A", "#ECD49B"];
    for (var i = 0; i < (count || 42); i++) {
      var round = i % 3 === 0;
      box.appendChild(h("i", { style:
        "left:" + (Math.random() * 100).toFixed(1) + "%;background:" + cols[i % cols.length] +
        ";--x:" + Math.round((Math.random() - 0.5) * 180) + "px;--rot:" + Math.round(Math.random() * 900 - 450) + "deg" +
        ";--d:" + (1.7 + Math.random() * 1.3).toFixed(2) + "s;--delay:" + (Math.random() * 0.45).toFixed(2) + "s" +
        (round ? ";width:9px;height:9px;border-radius:50%" : "") }));
    }
    setTimeout(function () { box.innerHTML = ""; }, 3800);
  }
  function insertValidBanner() {
    var page = document.getElementById(current);
    if (!page || current === "pass" || current === "start" || page.querySelector(".valid")) return;
    var b = h("div", { class: "valid" }, [
      h("p", null, [h("strong", { text: "Pass gültig! " }), "Du hast alle 9 Stempel."]),
      h("a", { class: "btn btn--primary", href: "#/pass", text: "Pass ansehen" })
    ]);
    var anchor = $(".title", page);
    if (anchor) anchor.parentNode.insertBefore(b, anchor.nextSibling);
  }

  function renderBar() {
    var n = barHold !== null ? barHold : doneCount();
    var a = $("#bar-pass");
    if (!a) return;
    renderCover();
    $("#bar-count").textContent = n + "/" + TOTAL;
    a.setAttribute("aria-label", "Mein Pass: " + n + " von " + TOTAL + " Stempeln" + (n === TOTAL ? ", gültig" : ""));
    a.classList.toggle("is-full", n === TOTAL);
    if (current === "pass") a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    var sp = $("#bar-sp");
    if (current === "sprachpaten") sp.setAttribute("aria-current", "page"); else sp.removeAttribute("aria-current");
  }
  function bumpBar() {
    var a = $("#bar-pass");
    if (!a || reduceMotion) return;
    a.classList.remove("is-bump"); void a.offsetWidth; a.classList.add("is-bump");
  }

  // Kopfzeile jeder Station (Visum mit Stempelfeld), Navigation unten, Seitenzahl
  function buildStationChrome() {
    stations.forEach(function (s, i) {
      var page = document.getElementById(s.slug);
      if (!page) return;
      var visa = h("div", { class: "visa" }, [
        h("span", { class: "visa__no", text: "Station " + (i + 1) + " von " + stations.length }),
        h("span", { class: "visa__time", text: minutes(s.min) }),
        h("span", { class: "sr-only", "data-slot-text": s.slug }),
        h("span", { class: "visa__slot", "data-slot": s.slug, "aria-hidden": "true" })
      ]);
      page.insertBefore(visa, page.firstChild);
      var prev = i === 0 ? { slug: "start", title: "Deckblatt" } : stations[i - 1];
      var next = i === stations.length - 1 ? { slug: "pass", title: "Mein Pass" } : stations[i + 1];
      var nextLink = h("a", { class: "btn btn--line", href: "#/" + next.slug, "data-next": s.slug }, ["Weiter: " + next.title, " ", h("span", { class: "arrow", "aria-hidden": "true", text: "→" })]);
      nextLink.addEventListener("click", function () { if (AUTO_NEXT.indexOf(s.slug) !== -1) markDone(s.slug); });
      page.appendChild(h("nav", { class: "pagenav js-only", "aria-label": "Seiten" }, [
        h("a", { class: "btn btn--quiet", href: "#/" + prev.slug }, ["Zurück"]),
        nextLink
      ]));
      page.appendChild(h("p", { class: "page__no" }, [h("span", { text: "Seite " + (i + 1) + " von " + stations.length }), h("span", { text: s.title })]));
      renderVisa(s.slug, false);
    });
    $$("main > .page").forEach(function (p, i) { p.style.setProperty("--g-rot", (i * 41) + "deg"); });
  }
  function renderVisa(slug, animate) {
    var slot = $('[data-slot="' + slug + '"]');
    var txt = $('[data-slot-text="' + slug + '"]');
    if (!slot) return;
    slot.innerHTML = "";
    if (state.done[slug]) {
      slot.appendChild(stampFor(slug, animate));
      if (txt) txt.textContent = "Stempel erhalten.";
    } else {
      slot.appendChild(h("span", { class: "visa__empty", text: "dein Stempel" }));
      if (txt) txt.textContent = "";
    }
  }

  function parseHash() {
    var raw = (location.hash || "").replace(/^#\/?/, "");
    var q = raw.indexOf("?");
    var slug = q === -1 ? raw : raw.slice(0, q);
    var params;
    try { params = new URLSearchParams(q === -1 ? "" : raw.slice(q + 1)); } catch (e) { params = { get: function () { return null; } }; }
    return { slug: slug || "start", params: params };
  }

  var firstRoute = true;
  function route() {
    var r = parseHash();
    var slug = order.indexOf(r.slug) === -1 ? "start" : r.slug;
    var same = current === slug;
    if (current && !same && leaveHooks[current]) leaveHooks[current]();
    $$("main > .page").forEach(function (p) { p.hidden = p.id !== slug; });
    var page = document.getElementById(slug);
    if (!same && !firstRoute && !reduceMotion && page) {
      page.classList.remove("is-entering"); void page.offsetWidth; page.classList.add("is-entering");
    }
    current = slug;
    document.body.setAttribute("data-page", slug);
    var idx = stationIndex(slug);
    document.title = (idx >= 0 ? stations[idx].title + " – " : pageTitles[slug] ? pageTitles[slug] + " – " : "") + "Gefühlt vs. echt";
    renderBar();
    if (!same) window.scrollTo(0, 0);
    if (!firstRoute && !same) {
      var heading = $("#" + slug + " .title") || $("#" + slug + " h1");
      if (heading) heading.focus({ preventScroll: true });
    }
    firstRoute = false;
    if (enterHooks[slug]) enterHooks[slug](r.params, same);
  }

  /* ---------------- Formular-Bausteine ---------------- */
  function radioGroup(container, name, options, selected) {
    container.innerHTML = "";
    options.forEach(function (o) {
      var input = h("input", { type: "radio", name: name, value: o[0] });
      if (selected === o[0]) input.checked = true;
      container.appendChild(h("label", { class: "option" }, [input, h("span", { class: "box", "aria-hidden": "true" }), h("span", { text: o[1] })]));
    });
  }
  function checkGroup(container, name, options, selected) {
    container.innerHTML = "";
    selected = selected || [];
    options.forEach(function (o) {
      var input = h("input", { type: "checkbox", name: name, value: o[0] });
      if (selected.indexOf(o[0]) !== -1) input.checked = true;
      container.appendChild(h("label", { class: "option" }, [input, h("span", { class: "box", "aria-hidden": "true" }), h("span", { text: o[1] })]));
    });
  }
  function langChips(container, name, selected) {
    container.innerHTML = "";
    selected = selected || [];
    D.languages.forEach(function (l, i) {
      var input = h("input", { type: "checkbox", name: name, value: l[0] });
      if (selected.indexOf(l[0]) !== -1) input.checked = true;
      var chip = h("label", { class: "chip" }, [input, h("span", { text: l[1] })]);
      if (i >= D.languagesShown && selected.indexOf(l[0]) === -1) { chip.hidden = true; chip.setAttribute("data-extra", ""); }
      container.appendChild(chip);
    });
    var btn = container.parentNode.querySelector("[data-more-langs]");
    if (btn) {
      btn.onclick = function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        $$("[data-extra]", container).forEach(function (c) { if (!c.querySelector("input").checked) c.hidden = open; });
        btn.setAttribute("aria-expanded", String(!open));
        btn.textContent = open ? "Mehr Sprachen zeigen" : "Weniger Sprachen zeigen";
      };
    }
  }
  var CROSS = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 7 C 15 16, 24 25, 34 34"/><path d="M33 6 C 24 16, 15 25, 7 35"/></svg>';
  function kreuz(container, name, selected) {
    container.innerHTML = "";
    var row = h("div", { class: "kreuz__row" });
    for (var i = 1; i <= 5; i++) {
      var input = h("input", { type: "radio", name: name, value: String(i), "aria-label": i + " von 5" + (i === 1 ? " (" + container.dataset.low + ")" : i === 5 ? " (" + container.dataset.high + ")" : "") });
      if (String(selected) === String(i)) input.checked = true;
      var box = h("label", { class: "kreuz__box" }, [input, h("span", { class: "kreuz__num", "aria-hidden": "true", text: String(i) })]);
      box.insertAdjacentHTML("beforeend", CROSS);
      row.appendChild(box);
    }
    container.appendChild(row);
    container.appendChild(h("div", { class: "kreuz__ends", "aria-hidden": "true" }, [h("span", { text: container.dataset.low }), h("span", { text: container.dataset.high })]));
  }
  function readRadio(form, name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : null; }
  function readChecks(form, name) { return $$('input[name="' + name + '"]:checked', form).map(function (i) { return i.value; }); }

  // Immer nur eine Frage zeigen: Schritt für Schritt
  function stepper(form, opts) {
    var steps = $$(".step", form);
    var count = $(".stepper__count", form);
    var bar = $(".stepper__bar span", form);
    var back = $("[data-step-back]", form), next = $("[data-step-next]", form), submit = $("[data-step-submit]", form);
    var idx = 0;
    form.classList.add("is-on");
    function go(i, focus) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === idx); });
      if (count) count.textContent = (opts.word || "Frage") + " " + (idx + 1) + " von " + steps.length;
      if (bar) bar.style.width = ((idx + 1) / steps.length * 100) + "%";
      if (back) back.hidden = idx === 0;
      if (next) next.hidden = idx === steps.length - 1;
      if (submit) submit.hidden = idx !== steps.length - 1;
      if (opts.onStep) opts.onStep(idx);
      if (focus) {
        var top = form.getBoundingClientRect().top;
        if (top < 70) window.scrollTo({ top: Math.max(0, top + window.scrollY - 90), behavior: reduceMotion ? "auto" : "smooth" });
        var f = steps[idx].querySelector('input:not([tabindex="-1"]):not([type="hidden"])');
        if (f) f.focus({ preventScroll: true });
      }
    }
    function tryNext() {
      var err = opts.validate ? opts.validate(idx) : null;
      if (opts.onError) opts.onError(err || "");
      if (err) return false;
      go(idx + 1, true);
      return true;
    }
    if (next) next.addEventListener("click", tryNext);
    if (back) back.addEventListener("click", function () { if (opts.onError) opts.onError(""); go(idx - 1, true); });
    // Enter in einem Textfeld heißt „weiter“, nicht „abschicken“
    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type === "text" && idx < steps.length - 1) { e.preventDefault(); tryNext(); }
    });
    go(0, false);
    return { go: go, next: tryNext, steps: steps, get index() { return idx; } };
  }

  /* ---------------- Fachbegriffe sammeln ---------------- */
  var termQ = [], termTimer = null, termToast = null;
  function termMsg(list) {
    var names = list.map(function (id) { return D.terms[id].name; });
    var tally = " · " + termCount() + "/" + Object.keys(D.terms).length;
    return (names.length === 1 ? "+ Fachbegriff im Pass: " : "+ " + names.length + " Fachbegriffe im Pass: ") + names.join(", ") + tally;
  }
  function collect(ids) {
    ids = [].concat(ids || []).join(" ").split(/\s+/).filter(function (id) { return id && D.terms[id] && !state.terms[id]; });
    if (!ids.length) return;
    ids.forEach(function (id) { state.terms[id] = new Date().toISOString(); });
    persist();
    termQ = termQ.concat(ids);
    clearTimeout(termTimer);
    termTimer = setTimeout(function () {
      // Wartet schon ein Begriffs-Hinweis? Dann zusammenfassen statt stapeln.
      if (termToast && toastQ.indexOf(termToast) !== -1) {
        termToast.ids = termToast.ids.concat(termQ);
        termToast.msg = termMsg(termToast.ids);
      } else {
        termToast = toast(termMsg(termQ), "term");
        termToast.ids = termQ.slice();
      }
      termQ = [];
    }, 700);
  }
  // Begriffe in Texten zählen erst, wenn man sie wirklich eine Weile im Blick hatte
  function observeTerms() {
    var els = $$("[data-term-view]");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (en.isIntersecting && en.intersectionRatio >= 0.6) {
          if (!el._termTimer) el._termTimer = setTimeout(function () { collect(el.getAttribute("data-term-view")); io.unobserve(el); }, 900);
        } else if (el._termTimer) { clearTimeout(el._termTimer); el._termTimer = null; }
      });
    }, { threshold: [0, 0.6, 1] });
    els.forEach(function (el) {
      if (el._termObserved) return;
      el._termObserved = true;
      var ids = el.getAttribute("data-term-view").split(/\s+/);
      if (ids.every(function (id) { return state.terms[id]; })) return;
      io.observe(el);
    });
  }

  /* =================== Deckblatt =================== */
  function renderCover() {
    var n = doneCount();
    var dots = $("#cover-dots");
    if (dots) {
      dots.innerHTML = "";
      for (var i = 0; i < TOTAL; i++) dots.appendChild(h("i", { class: i < n ? "is-on" : "" }));
    }
    var text = $("#cover-progress-text");
    if (text) text.textContent = n === 1
      ? (state.flyer ? "1 von 9 Stempeln hast du schon – vom Flyer." : "1 von 9 Stempeln hast du schon.")
      : n === TOTAL ? "Alle 9 Stempel – dein Pass ist gültig!" : n + " von 9 Stempeln. Noch " + (TOTAL - n) + " bis zum gültigen Pass.";
    var go = $("#cover-go"), next = firstUndone(), fresh = !Object.keys(state.done).some(function (k) { return state.done[k]; });
    if (!go) return;
    go.setAttribute("href", "#/" + (next ? next.slug : "pass"));
    $("#cover-go-text").textContent = fresh ? "Pass aufklappen" : next ? "Weiter: " + next.title : "Mein Pass ansehen";
    $("#cover-hand").hidden = !fresh;
    var tour = $("#sp-tour");
    if (tour) { tour.setAttribute("href", "#/" + (next ? next.slug : "pass")); tour.textContent = fresh ? "Rundgang starten" : next ? "Weiter: " + next.title : "Mein Pass ansehen"; }
  }
  function initCover() {
    var go = $("#cover-go");
    go.addEventListener("click", function (e) {
      if (reduceMotion) return;
      e.preventDefault();
      var cover = $("#start");
      var href = go.getAttribute("href");
      buzz(12);
      cover.classList.add("is-opening");
      setTimeout(function () { location.hash = href; cover.classList.remove("is-opening"); }, 440);
    });
  }
  function socialProof() {
    if (!API.enabled) return;
    API.stats().then(function (s) {
      if (!s) return;
      var el = $("#cover-proof");
      if (el && s.n >= MIN_N) { el.textContent = "Schon " + CH.num(s.n, 0) + " am HHBK haben mitgemacht."; el.hidden = false; }
      var pt = s.paten || { helfen: 0, suchen: 0 };
      var sp = $("#sp-proof");
      if (sp && pt.helfen + pt.suchen >= MIN_N) {
        sp.textContent = pt.helfen + (pt.helfen === 1 ? " Person will" : " Personen wollen") + " schon helfen, " + pt.suchen + " " + (pt.suchen === 1 ? "sucht" : "suchen") + " Unterstützung – mach mit.";
      }
    }).catch(function () {});
  }
  enterHooks.start = function () { renderCover(); socialProof(); };

  /* =================== Station 1: Kurz zu dir =================== */
  function initDu() {
    var form = $("#form-du");
    var a = state.answers;
    radioGroup($('[data-radio="herkunft"]', form), "herkunft", D.herkunft, a.herkunft);
    langChips($('[data-langs="sprachen"]', form), "sprachen", a.sprachen);
    form.sprachen_andere.value = a.sprachen_andere || "";
    kreuz($('[data-kreuz="akzeptanz"]', form), "akzeptanz", a.akzeptanz);
    kreuz($('[data-kreuz="wissen_vorher"]', form), "wissen_vorher", a.wissen_vorher);
    var st = stepper(form, { word: "Frage" });

    // Ein Tipp genügt: Bei Einzelauswahl geht es von selbst weiter
    form.addEventListener("change", function (e) {
      var name = e.target.name;
      if ((name === "herkunft" || name === "akzeptanz") && viaPointer()) {
        var at = st.index;
        setTimeout(function () { if (st.index === at) st.next(); }, 420);
      }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (st.index < st.steps.length - 1) { st.next(); return; }
      var fields = {};
      var herkunft = readRadio(form, "herkunft"); if (herkunft) fields.herkunft = herkunft;
      var sprachen = readChecks(form, "sprachen"); if (sprachen.length) fields.sprachen = sprachen;
      var andere = form.sprachen_andere.value.trim(); if (andere) fields.sprachen_andere = andere;
      var akz = readRadio(form, "akzeptanz"); if (akz) fields.akzeptanz = Number(akz);
      var wv = readRadio(form, "wissen_vorher"); if (wv) fields.wissen_vorher = Number(wv);
      Object.assign(state.answers, fields);
      persist();
      if (Object.keys(fields).length) { API.queue(fields); markDone("du"); }
      location.hash = "#/schaetzen";
    });
  }

  /* =================== Station 2: Schätz mal =================== */
  var quizShow = null; // Index einer gerade aufgedeckten Frage

  function schoolMean(stats, id) {
    if (!stats || !stats.schaetzung || !stats.schaetzung[id]) return null;
    var s = stats.schaetzung[id];
    return s.mean === null || s.mean === undefined ? null : s;
  }

  function makeRuler(q) {
    var root = h("div", { class: "ruler is-untouched" });
    root.appendChild(h("p", { class: "ruler__invite", "aria-hidden": "true", text: "Tipp auf die Skala oder zieh den Stift" }));
    var scale = h("div", { class: "ruler__scale", "aria-hidden": "true" });
    for (var i = 0; i <= 20; i++) {
      var p = i * 5;
      scale.appendChild(h("span", { class: "ruler__tick" + (i % 2 === 0 ? " ruler__tick--major" : ""), style: "left:" + p + "%" }));
      if (i % 4 === 0) scale.appendChild(h("span", { class: "ruler__num", style: "left:" + p + "%", text: CH.num(q.min + (q.max - q.min) * p / 100, 0) }));
    }
    root.appendChild(scale);
    var mid = q.min + (q.max - q.min) / 2;
    var input = h("input", { type: "range", min: q.min, max: q.max, step: q.step, value: mid, "aria-label": "Deine Schätzung" + (q.unit === "%" ? " in Prozent" : " in Millionen") });
    root.appendChild(input);
    var mineLabel = h("span", { class: "ruler__label" });
    var mine = h("div", { class: "ruler__mark ruler__mine", "aria-hidden": "true" }, [h("span", { class: "ruler__line" }), h("span", { class: "ruler__grip" }), mineLabel]);
    root.appendChild(mine);

    function pos(v) { return CH.pct(v, q.max, q.min); }
    function edge(el, p) { el.classList.toggle("is-left", p < 12); el.classList.toggle("is-right", p > 88); }
    var touched = false;
    function update() {
      var v = Number(input.value), p = pos(v);
      mine.style.left = p + "%";
      mineLabel.textContent = "du: " + fmt(v, q.unit);
      edge(mineLabel, p);
      input.setAttribute("aria-valuetext", fmt(v, q.unit));
    }
    var api = {
      root: root, input: input,
      onTouch: null,
      get value() { return Number(input.value); },
      get touched() { return touched; },
      setValue: function (v) { input.value = v; touched = true; root.classList.remove("is-untouched"); update(); },
      reveal: function (real, school, animate) {
        root.classList.add("is-revealed");
        input.disabled = true;
        var rp = pos(real);
        var st = stamp({ top: "echt", main: fmt(real, q.unit), smallSize: 17, rotate: -5 + Math.round(Math.random() * 6), animate: animate, label: "Echter Wert: " + fmt(real, q.unit) });
        var lab = h("span", { class: "ruler__label" }, [st]);
        edge(lab, rp);
        root.appendChild(h("div", { class: "ruler__mark ruler__real", style: "left:" + rp + "%" }, [h("span", { class: "ruler__line" }), lab]));
        if (school) api.showSchool(school);
      },
      showSchool: function (s) {
        if (root.querySelector(".ruler__school")) return;
        root.classList.add("has-school");
        var sp = pos(s.mean);
        var lab = h("span", { class: "ruler__label", text: "HHBK im Schnitt: " + fmt(s.mean, q.unit) });
        edge(lab, sp);
        root.appendChild(h("div", { class: "ruler__mark ruler__school", style: "left:" + sp + "%" }, [h("span", { class: "ruler__tri" }), lab]));
      }
    };
    function touch() {
      if (!touched) { touched = true; root.classList.remove("is-untouched"); if (api.onTouch) api.onTouch(); }
      update();
    }
    input.addEventListener("input", touch);
    input.addEventListener("click", function () { if (!input.disabled) touch(); });
    update();
    return api;
  }

  // Wie nah war die Schätzung? hit = Volltreffer, near = knapp, off = daneben
  function verdictInfo(q, guess) {
    var diff = guess - q.real, abs = Math.round(Math.abs(diff) * 10) / 10;
    var tol = q.unit === "%" ? 2 : 0.3;
    var amount = q.unit === "%" ? CH.num(abs) + (abs === 1 ? " Prozentpunkt" : " Prozentpunkte") : CH.num(abs) + " Millionen";
    var dir = diff > 0 ? " zu hoch" : " zu niedrig";
    if (abs <= tol) return { tier: "hit", word: "Volltreffer!", text: abs === 0 ? "Genau getroffen." : "Nur " + amount + dir + " – fast genau." };
    if (abs <= tol * 3) return { tier: "near", word: "Knapp dran!", text: "Du lagst " + amount + dir + "." };
    return { tier: "off", word: abs > (q.unit === "%" ? 15 : 2) ? "Weit daneben!" : "Daneben!", text: "Du hast " + amount + dir + " geschätzt." };
  }
  function gutProfile() {
    var pq = D.quiz.filter(function (q) { return q.unit === "%"; });
    if (!pq.every(function (q) { return state.quiz[q.id] !== undefined; })) return null;
    var mae = pq.reduce(function (s, q) { return s + Math.abs(state.quiz[q.id] - q.real); }, 0) / pq.length;
    var hits = D.quiz.filter(function (q) { return state.quiz[q.id] !== undefined && verdictInfo(q, state.quiz[q.id]).tier === "hit"; }).length;
    var tier = D.gutTiers.filter(function (t) { return mae <= t.max; })[0] || D.gutTiers[D.gutTiers.length - 1];
    return { mae: mae, hits: hits, tier: tier };
  }
  function gutCard(prof) {
    return h("div", { class: "gut" }, [
      h("p", { class: "gut__kicker", text: "Dein Bauchgefühl-Profil" }),
      h("p", { class: "gut__name", text: prof.tier.name }),
      h("p", { class: "gut__text", text: prof.tier.text }),
      h("p", { class: "gut__facts", text: "Bei den Prozentfragen im Schnitt " + CH.num(prof.mae) + " Prozentpunkte daneben" + (prof.hits ? " · " + prof.hits + " Volltreffer" : "") + "." })
    ]);
  }

  function renderQuiz() {
    var box = $("#quiz");
    var qs = D.quiz;
    var nextIdx = -1;
    for (var i = 0; i < qs.length; i++) if (state.quiz[qs[i].id] === undefined) { nextIdx = i; break; }
    if (quizShow !== null) return renderQuestion(box, quizShow, true);
    if (nextIdx === -1) return renderSummary(box);
    renderQuestion(box, nextIdx, false);
  }

  function pipClass(q, i, activeIdx, revealed) {
    var g = state.quiz[q.id];
    if (i === activeIdx && !revealed) return "is-now";
    if (g === undefined) return "";
    return verdictInfo(q, g).tier === "hit" ? "is-hit" : "is-done";
  }
  function pips(activeIdx, revealed) {
    return h("ol", { class: "q__pips", "aria-hidden": "true" }, D.quiz.map(function (q, i) { return h("li", { class: pipClass(q, i, activeIdx, revealed) }); }));
  }

  function renderQuestion(box, idx, revealed) {
    var q = D.quiz[idx];
    box.innerHTML = "";
    var qid = "q-" + q.id;
    box.appendChild(h("p", { class: "q__count", text: "Frage " + (idx + 1) + " von " + D.quiz.length }));
    var pipRow = pips(idx, revealed);
    box.appendChild(pipRow);
    box.appendChild(h("h2", { class: "q__question", id: qid, tabindex: "-1", text: q.question }));
    box.appendChild(h("p", { class: "q__hint", text: q.hint }));

    var ruler = makeRuler(q);
    ruler.input.setAttribute("aria-describedby", qid);
    box.appendChild(ruler.root);

    var actions = h("div", { class: "q__actions" });
    var result = h("div", { class: "q__result", "aria-live": "polite" });
    box.appendChild(actions);
    box.appendChild(result);

    function showResult(animate) {
      var guess = state.quiz[q.id];
      ruler.setValue(guess);
      var s = schoolMean(API._stats, q.id);
      ruler.reveal(q.real, s, animate);
      var info = verdictInfo(q, guess);
      var pipNow = pipRow.children[idx];
      if (pipNow) pipNow.className = info.tier === "hit" ? "is-hit" : "is-done";
      actions.innerHTML = "";
      result.innerHTML = "";
      result.appendChild(h("p", { class: "q__react q__react--" + info.tier + (animate ? " is-new" : ""), text: info.word }));
      result.appendChild(h("p", { class: "q__verdict", text: info.text }));
      result.appendChild(h("p", { class: "q__explain", text: q.explain }));
      result.appendChild(h("details", { class: "q__more" }, [h("summary", { text: "Gut zu wissen" }), h("p", { text: q.note })]));
      var schoolNote = h("p", { class: "q__school-note" });
      function fillSchool(stats) {
        var sm = schoolMean(stats, q.id);
        if (sm) { schoolNote.textContent = "Das HHBK schätzt im Schnitt " + fmt(sm.mean, q.unit) + " (" + sm.n + " Schätzungen)."; ruler.showSchool(sm); }
        else if (API.enabled) schoolNote.textContent = "Den Durchschnitt des HHBK zeigen wir ab " + MIN_N + " Schätzungen.";
        else schoolNote.textContent = "";
      }
      fillSchool(API._stats);
      if (API.enabled) API.flush().then(function () { return API.stats(true); }).then(fillSchool).catch(function () {});
      result.appendChild(schoolNote);
      result.appendChild(h("p", { class: "source", text: "Quelle: " + q.source }));
      var last = idx === D.quiz.length - 1;
      var next = h("button", { type: "button", class: "btn btn--primary", text: last ? "Zum Bauchgefühl-Profil" : "Nächste Frage" });
      next.addEventListener("click", function () {
        quizShow = null;
        renderQuiz();
        var nq = $("#quiz .q__question") || $("#quiz .summary__head");
        if (nq) nq.focus({ preventScroll: false });
      });
      result.appendChild(h("div", { class: "q__actions" }, [next]));
      if (animate) {
        buzz(info.tier === "hit" ? [20, 40, 20, 40, 70] : 18);
        if (info.tier === "hit") confetti(18);
      }
    }

    if (revealed) { showResult(false); return; }

    var submit = h("button", { type: "button", class: "btn btn--primary", disabled: true, text: "Schätzung abgeben" });
    var help = h("span", { class: "muted", text: "Erst schätzen, dann abgeben." });
    actions.appendChild(submit);
    actions.appendChild(help);
    ruler.onTouch = function () { submit.disabled = false; help.textContent = ""; };
    submit.addEventListener("click", function () {
      if (!ruler.touched) return;
      var guess = Math.round(ruler.value / q.step) * q.step;
      guess = Math.round(guess * 10) / 10;
      state.quiz[q.id] = guess;
      persist();
      var f = {}; f["s_" + q.id] = guess;
      API.queue(f);
      quizShow = idx;
      showResult(true);
      if (q.term) collect(q.term);
      if (D.quiz.every(function (x) { return state.quiz[x.id] !== undefined; })) markDone("schaetzen");
    });
  }

  function renderSummary(box) {
    box.innerHTML = "";
    var head = h("h2", { class: "q__question summary__head", tabindex: "-1", text: "Deine Schätzungen im Überblick" });
    box.appendChild(head);
    var prof = gutProfile();
    if (prof) box.appendChild(gutCard(prof));
    var list = h("ol", { class: "summary" });
    D.quiz.forEach(function (q) {
      var g = state.quiz[q.id];
      var a = CH.pct(g, q.max, q.min), b = CH.pct(q.real, q.max, q.min);
      var hit = verdictInfo(q, g).tier === "hit";
      list.appendChild(h("li", null, [
        h("span", { class: "summary__q", text: q.question }),
        h("div", { class: "mini", "aria-hidden": "true" }, [
          h("span", { class: "mini__track" }),
          h("span", { class: "mini__gap", style: "left:" + Math.min(a, b) + "%;width:" + Math.abs(a - b) + "%" }),
          h("span", { class: "mini__dot mini__dot--mine", style: "left:" + a + "%" }),
          h("span", { class: "mini__dot mini__dot--real", style: "left:" + b + "%" })
        ]),
        h("p", { class: "summary__vals" }, [
          h("span", null, ["du: ", h("span", { class: "hand", text: fmt(g, q.unit) })]),
          h("span", null, ["echt: ", h("span", { class: "real", text: fmt(q.real, q.unit) })]),
          hit ? h("span", { class: "summary__hit", text: "Volltreffer" }) : null
        ])
      ]));
    });
    box.appendChild(list);
    var schoolLine = h("p", { class: "q__school-note" });
    box.appendChild(schoolLine);
    API.stats().then(function (s) {
      if (s && s.schaetzung && s.schaetzung.maePercent !== null && s.schaetzung.maePercent !== undefined) {
        schoolLine.textContent = "Zum Vergleich: Das HHBK liegt bei den Prozentfragen im Schnitt " + CH.num(s.schaetzung.maePercent) + " Prozentpunkte daneben.";
      }
    }).catch(function () {});
    var again = h("button", { type: "button", class: "btn btn--quiet", text: "Noch einmal schätzen" });
    again.addEventListener("click", function () { state.quiz = {}; persist(); quizShow = null; renderQuiz(); var q = $("#quiz .q__question"); if (q) q.focus(); });
    box.appendChild(h("div", { class: "q__actions" }, [h("a", { class: "btn btn--primary", href: "#/zeitreise" }, ["Weiter: Zeitreise ", h("span", { class: "arrow", "aria-hidden": "true", text: "→" })]), again]));
  }

  enterHooks.schaetzen = function () {
    renderQuiz();
    if (API.enabled && !API._stats) API.stats().catch(function () {});
  };

  /* =================== Station 3: Zeitreise =================== */
  var ZEIT_GOAL = 6;
  function initZeit() {
    var stops = $$("#zeitreise .stop");
    stops.forEach(function (li, i) {
      var d = li.querySelector("details");
      if (state.tl.indexOf(i) !== -1) li.classList.add("is-seen");
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        var hint = $(".stop__hint", li); if (hint) hint.remove();
        if (state.tl.indexOf(i) === -1) {
          state.tl.push(i); persist();
          li.classList.add("is-seen");
          buzz(8);
          updateZeit();
        }
        var t = li.getAttribute("data-terms");
        if (t) collect(t);
        if (state.tl.length >= ZEIT_GOAL) markDone("zeitreise");
      });
    });
    if (!state.tl.length && stops[0]) stops[0].appendChild(h("p", { class: "stop__hint", "aria-hidden": "true", text: "tipp mich an" }));
    updateZeit();
  }
  function updateZeit() {
    var box = $("#tl-progress");
    if (!box) return;
    var total = $$("#zeitreise .stop").length, n = state.tl.length;
    var dots = h("span", { class: "discover__dots", "aria-hidden": "true" });
    for (var i = 0; i < total; i++) dots.appendChild(h("i", { class: i < n ? "is-on" : "" }));
    box.innerHTML = "";
    box.appendChild(dots);
    box.appendChild(h("p", { class: "discover__text" }, [
      "Entdeckt: " + n + " von " + total + " ",
      h("span", { text: state.done.zeitreise ? "· Stempel erhalten" : n >= ZEIT_GOAL ? "" : "· ab " + ZEIT_GOAL + " gibt es den Stempel" })
    ]));
  }

  /* =================== Station 4: Ein Morgen ohne Deutsch =================== */
  var TOKEN = /\{([^|}]+)\|(A1|A2|B1|B2|C1)\}/g;
  function tokenize(text) {
    var out = [], last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(text))) {
      if (m.index > last) out.push({ text: text.slice(last, m.index) });
      var tok = { text: m[1], level: D.levels.indexOf(m[2]), tail: "" };
      last = TOKEN.lastIndex;
      var p = text.slice(last).match(/^[.,!?:;]+/);
      if (p) { tok.tail = p[0]; last += p[0].length; }
      out.push(tok);
    }
    if (last < text.length) out.push({ text: text.slice(last) });
    return out;
  }
  var KEY_LEVELS = [];
  D.moments.forEach(function (m) { tokenize(m.text).forEach(function (t) { if (t.level !== undefined) KEY_LEVELS.push(t.level); }); });

  function updateWords() {
    var lvl = state.level || 0;
    $$("#moments .word").forEach(function (w) {
      var l = Number(w.getAttribute("data-l"));
      var unknown = l > lvl;
      w.classList.toggle("is-unknown", unknown);
      w.classList.toggle("is-new", !unknown && l > 0);
      w.querySelector(".w").setAttribute("aria-hidden", unknown ? "true" : "false");
    });
    $("#level-value").textContent = D.levels[lvl];
    $("#level-name").textContent = D.levelNames[lvl];
    var ok = KEY_LEVELS.filter(function (l) { return l <= lvl; }).length;
    $("#key-meter-n").textContent = ok + " von " + KEY_LEVELS.length;
    $("#key-meter-fill").style.width = (ok / KEY_LEVELS.length * 100) + "%";
  }
  function showFeedback(slot, choice) {
    slot.innerHTML = "";
    slot.appendChild(h("div", { class: "feedback" }, [
      h("span", { class: "feedback__concept", text: "Aus dem Unterricht: " + choice.concept }),
      h("p", { text: choice.feedback })
    ]));
  }
  function initMorgen() {
    var wrap = $("#moments");
    wrap.innerHTML = "";
    D.moments.forEach(function (m, i) {
      var text = h("p", { class: "moment__text" });
      if (m.speaker) text.appendChild(h("span", { class: "moment__speaker", text: m.speaker + ":" }));
      tokenize(m.text).forEach(function (tok) {
        if (tok.level === undefined) { text.appendChild(document.createTextNode(tok.text)); return; }
        text.appendChild(h("span", { class: "word", "data-l": String(tok.level) }, [
          h("span", { class: "w", text: tok.text }),
          h("span", { class: "unk sr-only", text: "[unverständlich]" }),
          tok.tail || null
        ]));
      });
      var promptId = "mp-" + i;
      var choices = h("div", { class: "choices", role: "group", "aria-labelledby": promptId });
      var slot = h("div", { "aria-live": "polite" });
      m.choices.forEach(function (c, ci) {
        var b = h("button", { type: "button", class: "choice", "aria-pressed": String(state.moments[i] === ci), text: c.label });
        b.addEventListener("click", function () {
          state.moments[i] = ci; persist();
          $$(".choice", choices).forEach(function (x, xi) { x.setAttribute("aria-pressed", String(xi === ci)); });
          showFeedback(slot, c);
          buzz(10);
          if (c.term) collect(c.term);
          maybeAfter(true);
        });
        choices.appendChild(b);
      });
      if (state.moments[i] !== undefined) showFeedback(slot, m.choices[state.moments[i]]);
      wrap.appendChild(h("article", { class: "moment moment--" + m.kind }, [
        h("p", { class: "moment__when", text: m.time + ", " + m.place }),
        text,
        h("p", { class: "moment__prompt", id: promptId, text: m.prompt }),
        choices, slot
      ]));
    });

    var input = $("#level-input");
    input.value = state.level || 0;
    input.addEventListener("input", function () { state.level = Number(input.value); persist(); updateWords(); });
    updateWords();

    var form = $("#form-barrieren");
    checkGroup($('[data-check="barrieren"]', form), "barrieren", D.barrieren, state.answers.barrieren);
    form.addEventListener("change", function (e) {
      if (e.target.name !== "barrieren") return;
      if (e.target.value === "keine" && e.target.checked) $$('input[name="barrieren"]', form).forEach(function (x) { if (x.value !== "keine") x.checked = false; });
      if (e.target.value !== "keine" && e.target.checked) { var k = $('input[value="keine"]', form); if (k) k.checked = false; }
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var vals = readChecks(form, "barrieren");
      var note = $(".saved-note", form);
      if (!vals.length) { note.textContent = "Wähl mindestens eine Antwort aus."; return; }
      state.answers.barrieren = vals; persist();
      API.queue({ barrieren: vals });
      note.textContent = "Gespeichert. Danke!";
    });
    maybeAfter(false);
  }
  function maybeAfter(fresh) {
    var all = D.moments.every(function (m, i) { return state.moments[i] !== undefined; });
    var after = $("#morgen-after");
    var wasHidden = after.hidden;
    after.hidden = !all;
    if (all) {
      markDone("morgen");
      if (fresh && wasHidden) setTimeout(function () { after.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }, 350);
    }
  }

  /* =================== Station 5: Streitfrage =================== */
  function initStreit() {
    var form = $("#form-streit");
    radioGroup($('[data-radio="streitfrage"]', form), "streitfrage", D.streitfrage, state.answers.streitfrage);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = readRadio(form, "streitfrage");
      var out = $("#streit-result");
      if (!v) { out.innerHTML = ""; out.appendChild(h("p", { class: "form-error", text: "Wähl eine Antwort aus." })); return; }
      state.answers.streitfrage = v; persist();
      API.queue({ streitfrage: v });
      collect("triggerpunkte");
      markDone("streitfrage");
      renderStreitResult(true);
    });
    if (state.answers.streitfrage) renderStreitResult(false);
  }
  function renderStreitResult(fresh) {
    var out = $("#streit-result");
    var mine = state.answers.streitfrage;
    out.innerHTML = "";
    out.appendChild(h("p", { class: "compare", text: "Deine Stellung: " + label(D.streitfrage, mine) + "." }));
    if (!API.enabled) {
      out.appendChild(h("p", { class: "muted", text: "Das Meinungsbild des HHBK erscheint hier, sobald die Datenbank verbunden ist." }));
      return;
    }
    var holder = h("div", null, [h("p", { class: "muted", text: "Meinungsbild wird geladen …" })]);
    out.appendChild(holder);
    var p = fresh ? API.flush().then(function () { return API.stats(true); }) : API.stats();
    p.then(function (s) {
      holder.innerHTML = "";
      var sf = s && s.streitfrage;
      if (!sf || sf.hidden) {
        holder.appendChild(h("p", { class: "muted", text: "Das Meinungsbild zeigen wir ab " + MIN_N + " Stimmen" + (sf ? " (bisher " + sf.n + ")." : ".") }));
        return;
      }
      holder.appendChild(h("h2", { text: "So sieht es am HHBK aus" }));
      holder.appendChild(CH.bars(D.streitfrage.map(function (o) {
        var n = sf.dist[o[0]] || 0;
        return { label: o[1], value: n, display: CH.num(n / sf.n * 100, 0) + " %", mine: o[0] === mine };
      }), { max: sf.n }));
      holder.appendChild(h("p", { class: "fineprint", text: sf.n + " Stimmen. Meinungsbild, nicht repräsentativ." }));
    }).catch(function () {
      holder.innerHTML = "";
      holder.appendChild(h("p", { class: "muted", text: "Das Meinungsbild konnte gerade nicht geladen werden." }));
    });
  }

  /* =================== Station 6: Abwägen =================== */
  var sortShow = null;
  var SORT_COLORS = { chance: "var(--chance)", problem: "var(--problem)", beides: "var(--stamp)" };
  function renderSort(focus) {
    var box = $("#sort");
    if (!box) return;
    box.innerHTML = "";
    var cards = D.sortCards;
    var idx = sortShow;
    if (idx === null) { idx = -1; for (var i = 0; i < cards.length; i++) if (state.sort[cards[i].id] === undefined) { idx = i; break; } }
    if (idx === -1) { renderSortSummary(box, focus); return; }
    var c = cards[idx], mine = state.sort[c.id];
    var pipRow = h("ol", { class: "q__pips", "aria-hidden": "true" }, cards.map(function (x, k) {
      return h("li", { class: k === idx && mine === undefined ? "is-now" : state.sort[x.id] !== undefined ? "is-done" : "" });
    }));
    box.appendChild(h("div", { class: "sort__head" }, [h("p", { class: "sort__count", text: "Fakt " + (idx + 1) + " von " + cards.length }), pipRow]));
    var card = h("p", { class: "sort__card", id: "sort-q", tabindex: "-1", text: c.text });
    box.appendChild(card);
    var choices = h("div", { class: "sort__choices", role: "group", "aria-labelledby": "sort-q" });
    ["chance", "problem", "beides"].forEach(function (k) {
      var b = h("button", { type: "button", class: "sort__btn sort__btn--" + k, "aria-pressed": String(mine === k), text: D.sortLabels[k] });
      if (mine !== undefined) b.disabled = true;
      b.addEventListener("click", function () {
        if (state.sort[c.id] !== undefined) return;
        state.sort[c.id] = k; persist();
        sortShow = idx;
        buzz(14);
        if (c.term) collect(c.term);
        renderSort(false);
        var ans = $("#sort .sort__answer"); if (ans) ans.focus({ preventScroll: true });
      });
      choices.appendChild(b);
    });
    box.appendChild(choices);
    if (mine !== undefined) {
      var same = mine === c.team;
      var ans = h("div", { class: "sort__answer sort__answer--" + c.team, tabindex: "-1" }, [
        h("p", { class: "sort__compare" }, ["Du: ", h("strong", { text: D.sortLabels[mine] }), " · Unsere Einordnung: ", h("strong", { text: D.sortLabels[c.team] }), same ? " – da sind wir uns einig." : " – spannend, wir sehen es etwas anders."]),
        h("p", { text: c.why }),
        h("p", { class: "source", text: "Quelle: " + c.source })
      ]);
      box.appendChild(ans);
      var last = idx === cards.length - 1;
      var nb = h("button", { type: "button", class: "btn btn--primary", text: last ? "Zur Auswertung" : "Nächster Fakt" });
      nb.addEventListener("click", function () { sortShow = null; renderSort(true); });
      box.appendChild(h("div", { class: "q__actions" }, [nb]));
    }
    if (focus) card.focus({ preventScroll: false });
  }
  function renderSortSummary(box, focus) {
    var counts = { chance: 0, problem: 0, beides: 0 }, same = 0, n = D.sortCards.length;
    D.sortCards.forEach(function (c) { var m = state.sort[c.id]; if (counts[m] !== undefined) counts[m]++; if (m === c.team) same++; });
    var head = h("h3", { tabindex: "-1", text: "Deine Einordnung" });
    var mix = h("div", { class: "sort__mix", "aria-hidden": "true" }, ["chance", "problem", "beides"].filter(function (k) { return counts[k]; }).map(function (k) {
      return h("span", { style: "flex:" + counts[k] + ";background:" + SORT_COLORS[k] });
    }));
    var legendList = h("ul", { class: "sort__legend" }, ["chance", "problem", "beides"].map(function (k) {
      return h("li", null, [h("i", { style: "background:" + SORT_COLORS[k] }), D.sortLabels[k] + ": " + counts[k] + "×"]);
    }));
    var again = h("button", { type: "button", class: "btn btn--quiet", text: "Noch einmal einordnen" });
    again.addEventListener("click", function () { state.sort = {}; persist(); sortShow = null; renderSort(true); });
    var toPanels = h("button", { type: "button", class: "btn btn--primary", text: "Zu den drei Blickwinkeln" });
    toPanels.addEventListener("click", function () {
      var t = $("#weigh-title");
      t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      t.focus({ preventScroll: true });
    });
    box.appendChild(h("div", { class: "sort__summary" }, [
      head, mix, legendList,
      h("p", { text: "Bei " + same + " von " + n + " Fakten siehst du es wie wir." }),
      h("p", { class: "compare", text: "Unser Fazit: Vieles ist beides. Ob Migration eher Chance oder Problem wird, hängt davon ab, wer Verantwortung übernimmt – Staat, Schule, Neue und wir alle." }),
      h("div", { class: "q__actions" }, [toPanels, again])
    ]));
    markDone("abwaegen");
    if (focus) head.focus({ preventScroll: false });
  }
  function initTabs() {
    var tabs = $$('#abwaegen [role="tab"]');
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).classList.toggle("is-active", on);
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n); n.focus(); }
      });
    });
  }
  function fillLive(stats) {
    if (!stats) return;
    var sp = stats.sprachen;
    var el = $('[data-live="sprachen"]');
    if (el && sp && !sp.hidden && sp.distinct > 0) {
      var top = (sp.top || []).slice(0, 3).map(function (t) { return langName(t[0]); });
      el.textContent = "Mehrsprachigkeit ist ein Schatz für Ausbildung und Beruf. In unserer Umfrage sprechen die Teilnehmenden bisher " + sp.distinct + " verschiedene Sprachen" + (top.length ? " – am häufigsten " + top.join(", ") + "." : ".");
    }
    var b = stats.barrieren;
    var el2 = $('[data-live="barriere-sprache"]');
    if (el2 && b && !b.hidden && b.respondents) {
      var share = (b.counts.sprache || 0) / b.respondents * 100;
      el2.textContent = "Wer die Sprache noch nicht kann, verliert schnell den Anschluss. In unserer Umfrage nennen " + CH.num(share, 0) + " % der Befragten am HHBK die Sprache als Hürde.";
    }
    $$('[data-live="loesung-daten"], [data-live="sp-daten"]').forEach(function (li) {
      if (!(b && !b.hidden && b.respondents)) return;
      var share2 = (b.counts.sprache || 0) / b.respondents * 100;
      var a = stats.akzeptanz;
      li.textContent = "Unsere Umfrage: " + CH.num(share2, 0) + " % nennen Sprache als Hürde am HHBK" + (a && !a.hidden ? ", die Akzeptanz liegt im Schnitt bei " + CH.num(a.mean) + " von 5." : ".");
      li.hidden = false;
    });
  }
  enterHooks.abwaegen = function () {
    if (sortShow === null) renderSort(false);
    API.stats().then(fillLive).catch(function () {});
  };

  /* =================== Station 7: Lösung =================== */
  function initLoesung() {
    $$("[data-cta-loesung]").forEach(function (a) { a.addEventListener("click", function () { markDone("loesung"); }); });
  }
  enterHooks.loesung = function () { API.stats().then(fillLive).catch(function () {}); };

  /* =================== Sprachpaten (eigene Seite) =================== */
  var pateStepper = null;
  var NAME_RE = /^[\p{L}\p{M}' .-]{1,30}$/u;
  var KLASSE_RE = /^[A-Za-z0-9ÄÖÜäöü .\/-]{1,12}$/;
  function initSprachpaten() {
    var track = $("#welcome-track");
    if (track) {
      [false, true].forEach(function (copy) {
        var set = h("span", { class: "welcome__set", "aria-hidden": copy ? "true" : null });
        D.welcome.forEach(function (w) { set.appendChild(h("span", { lang: w[0], dir: w[2] || null, text: w[1] })); });
        track.appendChild(set);
      });
    }

    var form = $("#form-pate");
    langChips($('[data-langs="pate_sprachen"]', form), "pate_sprachen", state.pate ? state.pate.sprachen : (state.answers.sprachen || []));
    var err = $(".form-error", form);

    function ausweis() {
      var rolle = readRadio(form, "rolle");
      $("#ausweis-role").textContent = rolle === "suchen" ? "sucht Unterstützung" : rolle === "helfen" ? "Sprachpatin oder -pate" : "Patin oder Pate";
      $("#ausweis-name").textContent = form.vorname.value.trim() || "…";
      $("#ausweis-klasse").textContent = form.klasse.value.trim() || "…";
      var langs = readChecks(form, "pate_sprachen").map(langName);
      $("#ausweis-sprachen").textContent = langs.length ? langs.join(", ") : "…";
      $$(".role").forEach(function (r) { r.classList.toggle("is-picked", r.getAttribute("data-role") === rolle); });
    }
    form.addEventListener("input", ausweis);
    form.addEventListener("change", ausweis);

    function validate(i) {
      if (i === 0) {
        if (!readRadio(form, "rolle")) return "Wähl aus, ob du helfen oder Unterstützung bekommen möchtest.";
        var v = form.vorname.value.trim();
        if (!v) return "Trag deinen Vornamen ein.";
        if (!NAME_RE.test(v)) return "Beim Vornamen bitte nur Buchstaben verwenden.";
        var k = form.klasse.value.trim();
        if (!k) return "Trag deine Klasse ein, zum Beispiel AIA31.";
        if (!KLASSE_RE.test(k)) return "Bei der Klasse bitte nur Buchstaben, Zahlen und Bindestriche, höchstens 12 Zeichen.";
      }
      if (i === 1 && !readChecks(form, "pate_sprachen").length) return "Wähl mindestens eine Sprache aus.";
      if (i === 2) {
        if (!form.einwilligung.checked) return "Ohne deine Einwilligung können wir die Anmeldung nicht speichern.";
        if (!form.alter.checked) return "Bitte bestätige dein Alter oder das Einverständnis deiner Eltern.";
      }
      return null;
    }
    pateStepper = stepper(form, { word: "Schritt", validate: validate, onError: function (m) { err.textContent = m; } });

    function lock(animate) {
      $$("input, button", form).forEach(function (x) { x.disabled = true; });
      var p = state.pate;
      if (p) {
        form.vorname.value = p.vorname; form.klasse.value = p.klasse;
        var r = form.querySelector('input[name="rolle"][value="' + p.rolle + '"]'); if (r) r.checked = true;
      }
      form.classList.remove("is-on");
      $$(".step, .stepper__head, .formnav", form).forEach(function (x) { x.hidden = true; });
      var holder = $("#ausweis-stamp");
      holder.innerHTML = "";
      holder.appendChild(stamp({ top: "Sprachpaten HHBK", main: "angemeldet", rotate: -8, animate: animate, label: "Angemeldet" }));
      $("#ausweis-note").textContent = "Dein Sprachpaten-Ausweis – gestempelt.";
      ausweis();
      err.textContent = "";
      if (!$(".signup__done", form)) {
        var shareBtn = h("button", { type: "button", class: "btn btn--line", text: "Link an Freunde schicken" });
        shareBtn.addEventListener("click", function () { share("Neu am HHBK oder mehrsprachig? Meld dich bei den Sprachpaten an.", "sprachpaten/"); });
        var title = $("#sp-form-title");
        title.textContent = "Du bist dabei!";
        title.parentNode.insertBefore(h("div", { class: "signup__done", role: "status" }, [
          h("p", null, [h("strong", { text: "Danke" + (p && p.vorname ? ", " + p.vorname : "") + "! " }), "Deine Anmeldung ist gespeichert. Sobald das Programm startet, melden wir uns über deine Klasse."]),
          h("p", { text: p && p.rolle === "suchen" ? "Kennst du noch jemanden, der neu ist? Schick den Link weiter." : "Kennst du jemanden, der auch zwei Sprachen spricht? Zu zweit macht es mehr Spaß." }),
          shareBtn
        ]), title.nextSibling);
      }
    }
    if (state.pate) lock(false);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (pateStepper.index < pateStepper.steps.length - 1) { pateStepper.next(); return; }
      for (var i = 0; i < pateStepper.steps.length; i++) {
        var m = validate(i);
        if (m) { pateStepper.go(i, true); err.textContent = m; return; }
      }
      err.textContent = "";
      var data = {
        rolle: readRadio(form, "rolle"),
        vorname: form.vorname.value.trim(),
        klasse: form.klasse.value.trim(),
        sprachen: readChecks(form, "pate_sprachen"),
        einwilligung: form.einwilligung.checked,
        alter: form.alter.checked,
        website: form.website.value
      };
      if (!API.enabled) { err.textContent = "Die Anmeldung ist noch nicht freigeschaltet, weil die Datenbank nicht verbunden ist."; return; }
      var btn = form.querySelector("[data-step-submit]");
      btn.disabled = true; btn.textContent = "Wird gespeichert …";
      API.send({ action: "pate", data: data }).then(function (res) {
        if (res && res.ok) {
          state.pate = { rolle: data.rolle, vorname: data.vorname, klasse: data.klasse, sprachen: data.sprachen };
          persist();
          lock(true);
          buzz([20, 50, 20, 50, 80]);
          confetti(30);
          toast("Danke! Deine Anmeldung ist gespeichert.");
          markDone("loesung");
          API._stats = null;
          API.stats(true).then(function (s) { fillLive(s); socialProof(); }).catch(function () {});
        } else {
          btn.disabled = false; btn.textContent = "Anmelden";
          err.textContent = "Das hat nicht geklappt: " + ((res && res.message) || "Bitte prüf deine Angaben.");
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = "Anmelden";
        err.textContent = "Keine Verbindung zur Datenbank. Prüf dein Internet und versuch es noch einmal.";
      });
    });

    // Rollenkarten: Rolle wählen und direkt zum Formular
    $$(".role").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (current !== "sprachpaten") return; // von anderen Seiten normal navigieren
        e.preventDefault();
        pickRole(card.getAttribute("data-role"));
        try { history.replaceState(null, "", "#/sprachpaten?r=" + card.getAttribute("data-role")); } catch (x) { /* egal */ }
      });
    });
    ausweis();
  }
  function pickRole(r) {
    var form = $("#form-pate");
    if (r !== "helfen" && r !== "suchen") return;
    if (!state.pate) {
      var input = form.querySelector('input[name="rolle"][value="' + r + '"]');
      if (input) { input.checked = true; form.dispatchEvent(new Event("change")); }
      if (pateStepper && pateStepper.index !== 0) pateStepper.go(0, false);
    }
    buzz(10);
    setTimeout(function () {
      $("#sp-signup").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      $("#sp-form-title").focus({ preventScroll: true });
    }, 60);
  }
  enterHooks.sprachpaten = function (params) {
    var form = $("#form-pate");
    if (!state.pate && !readChecks(form, "pate_sprachen").length && state.answers.sprachen) {
      state.answers.sprachen.forEach(function (code) {
        var input = form.querySelector('input[name="pate_sprachen"][value="' + code + '"]');
        if (input) { input.checked = true; input.closest(".chip").hidden = false; }
      });
      form.dispatchEvent(new Event("change"));
    }
    var r = params && params.get ? params.get("r") : null;
    if (r) pickRole(r);
    socialProof();
    API.stats().then(fillLive).catch(function () {});
  };

  /* =================== Station 8: Ergebnisse =================== */
  var refreshTimer = null;
  function initNachher() {
    var form = $("#form-nachher");
    kreuz($('[data-kreuz="wissen_nachher"]', form), "wissen_nachher", state.answers.wissen_nachher);
    radioGroup($('[data-radio="sicht"]', form), "sicht", D.sicht, state.answers.sicht);
    if (state.nachher) form.hidden = true;
    var err = $(".form-error", form);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = {};
      var w = readRadio(form, "wissen_nachher"); if (w) fields.wissen_nachher = Number(w);
      var s = readRadio(form, "sicht"); if (s) fields.sicht = s;
      if (!Object.keys(fields).length) { err.textContent = "Kreuz kurz etwas an – oder sieh dir direkt die Ergebnisse an."; return; }
      err.textContent = "";
      Object.assign(state.answers, fields);
      state.nachher = true; persist();
      API.queue(fields);
      form.hidden = true;
      markDone("ergebnisse");
      API.flush().then(function () { renderResults(true); });
    });
    $("[data-skip-nachher]", form).addEventListener("click", function () {
      state.nachher = true; persist();
      form.hidden = true;
      renderResults(false);
    });
  }

  function chartBlock(title, sub, body, tableEl) {
    return h("section", { class: "chart" }, [h("h2", { text: title }), sub ? h("p", { class: "chart__sub", text: sub }) : null, body, tableEl || null]);
  }

  function renderResults(force) {
    var box = $("#results");
    if (!API.enabled) {
      box.innerHTML = "";
      box.appendChild(h("div", { class: "notice" }, [
        h("p", { text: "Die Live-Ergebnisse des HHBK erscheinen hier, sobald die Datenbank verbunden ist." }),
        h("p", { class: "muted", text: "Für das Projektteam: Anleitung in README.md, Schritt 2 und 3." })
      ]));
      if (Object.keys(state.quiz).length) {
        box.appendChild(chartBlock("Deine Schätzungen", "Bleistift = du, Stempel = echter Wert.",
          CH.dumbbell(D.quiz.filter(function (q) { return state.quiz[q.id] !== undefined; }).map(function (q) {
            return { label: q.question, unit: q.unit, max: q.max, school: undefined, real: q.real, mine: state.quiz[q.id] };
          }))));
      }
      return;
    }
    box.style.opacity = box.childNodes.length ? ".55" : "1";
    if (!box.childNodes.length) box.appendChild(h("p", { class: "muted", text: "Ergebnisse werden geladen …" }));
    API.stats(force).then(function (s) {
      box.style.opacity = "1";
      box.innerHTML = "";
      drawResults(box, s);
    }).catch(function () {
      box.style.opacity = "1";
      box.innerHTML = "";
      var retry = h("button", { type: "button", class: "btn btn--line", text: "Erneut versuchen" });
      retry.addEventListener("click", function () { renderResults(true); });
      box.appendChild(h("div", { class: "notice" }, [h("p", { text: "Die Ergebnisse konnten gerade nicht geladen werden. Prüf deine Internetverbindung." }), retry]));
    });
  }

  function hiddenNote(block, what) {
    return h("p", { class: "muted", text: what + " zeigen wir ab " + MIN_N + " Antworten" + (block && block.n !== undefined ? " (bisher " + block.n + ")." : ".") });
  }

  function drawResults(box, s) {
    var time = new Date(s.generated || Date.now());
    var refresh = h("button", { type: "button", text: "Aktualisieren" });
    refresh.addEventListener("click", function () { renderResults(true); });
    box.appendChild(h("div", { class: "results__meta" }, [
      h("span", { text: "Stand: " + time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr. Aktualisiert sich alle 30 Sekunden." }),
      refresh
    ]));

    var sp = s.sprachen || {};
    var pt = s.paten || { helfen: 0, suchen: 0 };
    box.appendChild(h("div", { class: "tiles" }, [
      h("div", { class: "tile" }, [h("div", { class: "tile__value", text: CH.num(s.n, 0) }), h("div", { class: "tile__label", text: "haben mitgemacht" })]),
      h("div", { class: "tile" }, [h("div", { class: "tile__value", text: sp.hidden ? "–" : CH.num(sp.distinct || 0, 0) }), h("div", { class: "tile__label", text: "Sprachen gesprochen" })]),
      h("div", { class: "tile" }, [h("div", { class: "tile__value", text: CH.num(pt.helfen, 0) }), h("div", { class: "tile__label", text: "Sprachpaten angemeldet" })])
    ]));
    if (s.n < MIN_N) {
      box.appendChild(h("div", { class: "notice" }, [h("p", { text: "Bisher " + s.n + (s.n === 1 ? " Antwort" : " Antworten") + ". Die Auswertungen erscheinen ab " + MIN_N + " Antworten – teil den Link mit deiner Klasse!" })]));
    }

    /* 1. Gefühlt vs. echt */
    var rows = D.quiz.map(function (q) {
      var sm = schoolMean(s, q.id);
      return { label: q.question, unit: q.unit, max: q.max, school: sm ? sm.mean : null, n: sm ? sm.n : 0, real: q.real, mine: state.quiz[q.id] };
    });
    var hasMine = rows.some(function (r) { return r.mine !== undefined; });
    var lg = [{ key: "school", label: "HHBK im Schnitt" }, { key: "real", label: "echter Wert" }];
    if (hasMine) lg.unshift({ key: "mine", label: "du" });
    var db = h("div", null, [CH.legend(lg), CH.dumbbell(rows)]);
    box.appendChild(chartBlock("Gefühlt vs. echt", "Wie weit liegt die Schätzung des HHBK vom echten Wert entfernt?", db,
      CH.table(["Frage", "HHBK im Schnitt", "Schätzungen", "Echter Wert"], rows.map(function (r) {
        return [r.label, r.school === null ? "noch offen" : fmt(r.school, r.unit), String(r.n), fmt(r.real, r.unit)];
      }), "Gefühlt vs. echt")));
    if (s.schaetzung && s.schaetzung.maePercent !== null && s.schaetzung.maePercent !== undefined) {
      box.appendChild(h("p", { class: "compare", text: "Bei den Prozentfragen liegt das HHBK im Schnitt " + CH.num(s.schaetzung.maePercent) + " Prozentpunkte daneben." }));
    }

    /* 2. Akzeptanz */
    var a = s.akzeptanz;
    if (a && !a.hidden) {
      var body = h("div", null, [CH.columns(a.dist, ["gar nicht", "voll und ganz"]), h("p", { class: "compare", text: "Im Schnitt " + CH.num(a.mean) + " von 5." })]);
      var groups = a.byGroup || {};
      var gItems = [["selbst", "Selbst eingewandert"], ["eltern", "Eltern oder Großeltern eingewandert"], ["nein", "Keine Einwanderungsgeschichte"]]
        .filter(function (g) { return groups[g[0]]; })
        .map(function (g) { return { label: g[1], value: groups[g[0]].mean, display: CH.num(groups[g[0]].mean) + " von 5 (" + groups[g[0]].n + ")" }; });
      if (gItems.length >= 2) {
        body.appendChild(h("h3", { text: "Nach Einwanderungsgeschichte" }));
        body.appendChild(CH.bars(gItems, { max: 5 }));
      }
      box.appendChild(chartBlock("Wie akzeptiert fühlt ihr euch am HHBK?", "1 = gar nicht, 5 = voll und ganz", body,
        CH.table(["Antwort", "Anzahl"], a.dist.map(function (n, i) { return [String(i + 1), String(n)]; }), "Akzeptanz")));
    } else box.appendChild(chartBlock("Wie akzeptiert fühlt ihr euch am HHBK?", null, hiddenNote(a, "Diese Frage")));

    /* 3. Hürden */
    var b = s.barrieren;
    if (b && !b.hidden) {
      var items = D.barrieren.map(function (o) {
        var n = b.counts[o[0]] || 0;
        return { label: o[1], value: n, display: CH.num(n / b.respondents * 100, 0) + " %" };
      }).sort(function (x, y) { return y.value - x.value; });
      box.appendChild(chartBlock("Wo das HHBK Hürden erlebt", "Anteil der " + b.respondents + " Befragten, mehrere Antworten möglich", CH.bars(items),
        CH.table(["Hürde", "Anzahl"], items.map(function (i) { return [i.label, String(i.value)]; }), "Hürden")));
    } else box.appendChild(chartBlock("Wo das HHBK Hürden erlebt", null, hiddenNote(b, "Diese Frage")));

    /* 4. Streitfrage */
    var sf = s.streitfrage;
    if (sf && !sf.hidden) {
      var sItems = D.streitfrage.map(function (o) { var n = sf.dist[o[0]] || 0; return { label: o[1], value: n, display: CH.num(n / sf.n * 100, 0) + " %", mine: state.answers.streitfrage === o[0] }; });
      box.appendChild(chartBlock("Die Streitfrage", "Gehört der Islam zu Deutschland? " + sf.n + " Stimmen, Meinungsbild", CH.bars(sItems, { max: sf.n }),
        CH.table(["Antwort", "Anzahl"], sItems.map(function (i) { return [i.label, String(i.value)]; }), "Streitfrage")));
    } else box.appendChild(chartBlock("Die Streitfrage", null, hiddenNote(sf, "Das Meinungsbild")));

    /* 5. Hat der Rundgang etwas bewirkt? */
    var w = s.wissen;
    if (w && w.paired && !w.paired.hidden) {
      var arrow = '<svg class="slope__arrow" viewBox="0 0 80 14" aria-hidden="true"><path d="M2 7h70M64 2l8 5-8 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      var mid = h("span", { "aria-hidden": "true" });
      mid.innerHTML = arrow;
      var slope = h("p", { class: "slope", "aria-label": "Vorher " + CH.num(w.paired.before) + ", nachher " + CH.num(w.paired.after) + " von 5" }, [
        h("span", { class: "slope__val", text: CH.num(w.paired.before) }), mid, h("span", { class: "slope__val", text: CH.num(w.paired.after) }),
        h("span", { class: "muted", text: "von 5 – vorher und nachher" })
      ]);
      var sub = "Selbsteinschätzung „Wie gut kennst du dich aus?“ vor und nach dem Rundgang, 1 bis 5, " + w.paired.n + " Personen";
      var body2 = h("div", null, [slope]);
      var sv = s.sicht;
      if (sv && !sv.hidden) {
        body2.appendChild(h("h3", { text: "Hat der Rundgang deine Sicht verändert?" }));
        body2.appendChild(CH.bars(D.sicht.map(function (o) { var n = sv.dist[o[0]] || 0; return { label: o[1], value: n, display: CH.num(n / sv.n * 100, 0) + " %" }; }), { max: sv.n }));
      }
      box.appendChild(chartBlock("Hat der Rundgang etwas bewirkt?", sub, body2));
    } else box.appendChild(chartBlock("Hat der Rundgang etwas bewirkt?", null, hiddenNote(w && w.paired, "Den Vorher-nachher-Vergleich")));

    /* 6. Sprachen */
    if (!sp.hidden && sp.top && sp.top.length) {
      var lItems = sp.top.map(function (t) { return { label: langName(t[0]), value: t[1], display: String(t[1]) }; });
      box.appendChild(chartBlock("Welche Sprachen am HHBK gesprochen werden", "Anzahl der Nennungen. Sprachen mit weniger als 3 Nennungen fassen wir zusammen" + (sp.weitere ? " (" + sp.weitere + " weitere Sprachen)." : "."), CH.bars(lItems),
        CH.table(["Sprache", "Nennungen"], lItems.map(function (i) { return [i.label, String(i.value)]; }), "Sprachen")));
    }

    box.appendChild(h("p", { class: "fineprint", text: "Meinungsbild, nicht repräsentativ: Mitmachen kann, wer den Link hat. Gruppen mit weniger als " + MIN_N + " Antworten zeigen wir nicht an." }));
  }

  enterHooks.ergebnisse = function (params) {
    var form = $("#form-nachher");
    form.hidden = !!state.nachher;
    if (params && params.get && params.get("u")) setTimeout(function () { var s = $("#survey"); if (s) s.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }, 80);
    renderResults(false);
    clearInterval(refreshTimer);
    if (API.enabled) refreshTimer = setInterval(function () { if (!document.hidden) renderResults(true); }, 30000);
  };
  leaveHooks.ergebnisse = function () { clearInterval(refreshTimer); };

  /* =================== Unsere Umfrage (Google Forms) =================== */
  var U = D.umfrage;
  var G1 = "Gruppe 1: selbst eingewandert", G2 = "Gruppe 2: Erfahrungen mit Eingewanderten";
  function top2(dist) { return dist[3] + dist[4]; }
  function low2(dist) { return dist[0] + dist[1]; }
  function share100(a, b) { return b ? Math.round(a / b * 100) : 0; }
  // Kleine Gruppen (unter MIN_N Antworten) zeigen wir nicht – wie überall in der App
  function cell(text, n) { return n >= MIN_N ? text : "– (unter " + MIN_N + ")"; }

  function findingCard(o) {
    return h("article", { class: "finding" + (o.wide ? " finding--wide" : ""), "data-term-view": o.term || null }, [
      h("p", { class: "finding__kicker", text: o.kicker }),
      h("h3", { class: "finding__title", text: o.title }),
      h("p", { class: "finding__big" }, [h("span", { class: "finding__num", text: o.big }), o.unit ? h("span", { class: "finding__unit", text: o.unit }) : null]),
      h("p", { class: "finding__text", text: o.text })
    ].concat(o.body || []).concat([
      o.note ? h("p", { class: "finding__note", text: o.note }) : null,
      o.cta ? h("div", { class: "actions" }, [o.cta]) : null
    ]));
  }
  // Ein geteilter Balken für Ja/Nein- oder Positiv/Negativ-Fragen
  function splitBar(parts, n) {
    var lab = parts.map(function (p) { return p.label + ": " + p.value; }).join(", ") + " von " + n;
    return h("div", { class: "split", role: "img", "aria-label": lab }, [
      h("div", { class: "split__bar", "aria-hidden": "true" }, parts.map(function (p, i) {
        return h("span", { class: "split__seg split__seg--" + i, style: "flex:" + Math.max(p.value, 0.0001) });
      })),
      h("p", { class: "split__legend", "aria-hidden": "true" }, parts.map(function (p, i) {
        return h("span", null, [h("i", { class: "split__key split__seg--" + i }), p.label + ": " + p.value]);
      }))
    ]);
  }
  function barItems(labels, counts, n) {
    return labels.map(function (l, i) { return { label: l, value: counts[i], display: share100(counts[i], n) + " % (" + counts[i] + ")" }; });
  }

  function buildFindings() {
    var d = U.daten, E = U.ends;
    var wrap = h("div", { class: "survey__findings", id: "survey-findings" });
    var grid = h("div", { class: "findings" });

    var b = d.barrieren;
    var groups = h("details", { class: "finding__more" }, [
      h("summary", { text: "Nach Gruppen ansehen" }),
      h("div", { class: "multiples" }, [
        h("div", null, [h("h4", { text: G1 + " (" + b.g1.n + ")" }), CH.bars(barItems(b.labels, b.g1.counts, b.g1.n), { max: b.g1.n })]),
        h("div", null, [h("h4", { text: G2 + " (" + b.g2.n + ")" }), CH.bars(barItems(b.labels, b.g2.counts, b.g2.n), { max: b.g2.n })])
      ])
    ]);
    grid.appendChild(findingCard({
      kicker: "Barrieren", title: "Wo erlebt ihr Barrieren?", wide: true, term: "integration",
      big: share100(b.alle.counts[0], b.alle.n) + " %", unit: "nennen Kommunikation und Sprache",
      text: "Das ist die häufigste Antwort – bei den selbst Eingewanderten sogar " + b.g1.counts[0] + " von " + b.g1.n + ". Freundschaften und soziale Kontakte nennen " + b.g1.counts[5] + " von " + b.g1.n + " aus Gruppe 1, aber nur " + b.g2.counts[5] + " von " + b.g2.n + " aus Gruppe 2.",
      body: [CH.bars(barItems(b.labels, b.alle.counts, b.alle.n), { max: b.alle.n }), groups],
      note: "Mehrere Antworten möglich, " + b.alle.n + " Befragte."
    }));

    var a = d.akzeptanz;
    grid.appendChild(findingCard({
      kicker: "Akzeptanz", title: "Wie akzeptiert fühlt ihr euch am HHBK?", term: "anerkennung",
      big: CH.num(a.alle.mean), unit: "von 5 im Schnitt",
      text: top2(a.alle.dist) + " von " + a.alle.n + " kreuzen 4 oder 5 an. " + low2(a.alle.dist) + " von " + a.alle.n + " fühlen sich kaum akzeptiert (1 oder 2).",
      body: [CH.columns(a.alle.dist, E.akzeptanz), CH.bars([
        { label: G1 + " (" + a.g1.n + ")", value: a.g1.mean, display: CH.num(a.g1.mean) + " von 5" },
        { label: G2 + " (" + a.g2.n + ")", value: a.g2.mean, display: CH.num(a.g2.mean) + " von 5" }
      ], { max: 5 })],
      note: "Kaum Unterschied zwischen den Gruppen. Bei so wenigen Antworten ist das eine Tendenz, kein Beweis."
    }));

    var v = d.vorurteile.g2;
    grid.appendChild(findingCard({
      kicker: "Kontakt", title: "Verändert Begegnung etwas?", term: "kontakthypothese",
      big: v.counts.Ja + " von " + v.n,
      text: "aus Gruppe 2 hatten vor dem Kontakt mit Menschen anderer Herkunft Vorurteile, die sich später verändert haben.",
      body: [splitBar([{ label: "Ja", value: v.counts.Ja }, { label: "Nein", value: v.counts.Nein }], v.n)],
      note: "Genau das beschreibt die Kontakthypothese von Gordon Allport – darauf baut unsere Lösung auf."
    }));

    var e = d.erfahrung.g2;
    grid.appendChild(findingCard({
      kicker: "Erfahrungen", title: "Eher positiv oder eher negativ?",
      big: e.counts.Positiv + " : " + e.counts.Negativ, unit: "positiv : negativ",
      text: "So beschreiben die " + e.n + " Befragten aus Gruppe 2 ihre Erfahrungen mit Eingewanderten. Auch negative Erfahrungen gehören zu einem ehrlichen Bild.",
      body: [splitBar([{ label: "Eher positiv", value: e.counts.Positiv }, { label: "Eher negativ", value: e.counts.Negativ }], e.n)]
    }));

    var sp = d.sprache.g1, an = d.anpassung.g1;
    grid.appendChild(findingCard({
      kicker: "Schule und Ankommen", title: "Wie sehr bremst die Sprache?", term: "kapital",
      big: top2(sp.dist) + " von " + sp.n,
      text: "Eingewanderten sagen: Sprachbarrieren haben meine schulische Leistung stark beeinflusst (4 oder 5 von 5). Das Ankommen fanden " + top2(an.dist) + " von " + an.n + " eher schwierig, nur " + low2(an.dist) + " eher leicht.",
      body: [CH.columns(sp.dist, E.sprache)],
      note: "Nur Gruppe 1, " + sp.n + " Antworten."
    }));

    var g = d.geholfen.alle;
    grid.appendChild(findingCard({
      kicker: "Hilfsbereitschaft", title: "Wer hilft schon heute?", wide: true,
      big: top2(g.dist) + " von " + g.n,
      text: "haben schon oft jemandem mit Migrationshintergrund bei Sprache oder Schule geholfen (4 oder 5 von 5). Das sind die Sprachpaten von morgen.",
      body: [CH.columns(g.dist, E.geholfen)],
      cta: h("a", { class: "btn btn--primary", href: "#/sprachpaten?r=helfen", text: "Selbst Sprachpatin oder -pate werden" })
    }));
    wrap.appendChild(grid);

    wrap.appendChild(h("h3", { class: "voices__title", text: "Stimmen aus der Umfrage" }));
    var voices = h("div", { class: "voices" });
    [0, 2, 4, 5].forEach(function (i) {
      var z = U.zitate[i];
      if (z) voices.appendChild(voiceEl(z));
    });
    wrap.appendChild(voices);

    var pct = function (c, n) { return cell(share100(c, n) + " % (" + c + " von " + n + ")", n); };
    var mean = function (s) { return cell(CH.num(s.mean) + " (" + s.n + ")", s.n); };
    var rows = [["Akzeptanz am HHBK, Schnitt von 5", mean(d.akzeptanz.alle), mean(d.akzeptanz.g1), mean(d.akzeptanz.g2)]];
    b.labels.forEach(function (l, i) { rows.push(["Barriere: " + l, pct(b.alle.counts[i], b.alle.n), pct(b.g1.counts[i], b.g1.n), pct(b.g2.counts[i], b.g2.n)]); });
    rows.push(["Vorurteile nach dem Kontakt verändert", pct(d.vorurteile.alle.counts.Ja, d.vorurteile.alle.n), pct(d.vorurteile.g1.counts.Ja, d.vorurteile.g1.n), pct(d.vorurteile.g2.counts.Ja, d.vorurteile.g2.n)]);
    rows.push(["Erfahrungen mit Eingewanderten eher positiv", "–", "–", pct(d.erfahrung.g2.counts.Positiv, d.erfahrung.g2.n)]);
    rows.push(["Freundschaften aufbauen fällt leicht", pct(d.freunde.alle.counts.Ja, d.freunde.alle.n), pct(d.freunde.g1.counts.Ja, d.freunde.g1.n), pct(d.freunde.g2.counts.Ja, d.freunde.g2.n)]);
    rows.push(["Ankommen war schwierig, Schnitt von 5", mean(d.anpassung.alle), mean(d.anpassung.g1), mean(d.anpassung.g2)]);
    rows.push(["Sprachbarrieren beeinflussen die Leistung, Schnitt von 5", mean(d.sprache.alle), mean(d.sprache.g1), mean(d.sprache.g2)]);
    rows.push(["Kulturelle Unterschiede beeinflussen den Schulalltag, Schnitt von 5", mean(d.kultur.alle), mean(d.kultur.g1), mean(d.kultur.g2)]);
    rows.push(["Schon geholfen, Schnitt von 5", mean(d.geholfen.alle), mean(d.geholfen.g1), mean(d.geholfen.g2)]);

    wrap.appendChild(h("details", { class: "survey__method" }, [
      h("summary", { text: "So haben wir gefragt – und wo die Grenzen sind" }),
      h("ul", { class: "plain" }, [
        h("li", { text: "Fragebogen „" + U.titel + "“, " + U.werkzeug + ", " + U.zeitraum + ". Freiwillig und anonym, " + d.n + " Antworten." }),
        h("li", { text: "Die Gruppe hat jede und jeder selbst gewählt: " + G1 + ", " + G2 + "." }),
        h("li", { text: "Manche Fragen waren für eine Gruppe gedacht, wurden aber auch von der anderen beantwortet. Wir schreiben bei jeder Zahl dazu, wer gezählt ist. Gruppen mit weniger als " + MIN_N + " Antworten zeigen wir nicht." }),
        h("li", { text: "Alle Skalenfragen gehen von 1 bis 5. Bei der Frage zum Ankommen steht im Fragebogen „1 bis 10“, angekreuzt wurden aber nur Werte von 1 bis 5 – wir werten sie deshalb wie die anderen Skalen aus." }),
        h("li", { text: "Zitate sind anonym, ohne Namen und sprachlich leicht geglättet. Antworten, die nichts mit der Frage zu tun hatten, zitieren wir nicht." }),
        h("li", { text: "Nicht repräsentativ: " + d.n + " Antworten zeigen Tendenzen, aber keine sicheren Aussagen über das ganze HHBK." })
      ])
    ]));
    wrap.appendChild(h("section", { class: "chart" }, [CH.table(["Frage", "Alle", "Gruppe 1", "Gruppe 2"], rows, "Alle Ergebnisse unserer Umfrage")]));
    return wrap;
  }
  function voiceEl(z) {
    return h("figure", { class: "voice", "data-term-view": z.term || null }, [
      h("blockquote", null, [h("p", { text: "„" + z.text + "“" })]),
      h("figcaption", { text: (z.g === 1 ? G1 : G2) + " · anonym" })
    ]);
  }

  // Erst schätzen, dann aufdecken – wie im Schätzspiel
  function renderSurvey() {
    var box = $("#survey-body");
    if (!box || !U) return;
    var d = U.daten, b = d.barrieren;
    $("#survey-meta").textContent = d.n + " Schülerinnen und Schüler haben mitgemacht, " + U.zeitraum + " (" + U.werkzeug + "). " + d.g1 + " sind selbst eingewandert (Gruppe 1), " + d.g2 + " haben Erfahrungen mit Eingewanderten (Gruppe 2).";
    box.innerHTML = "";
    var q = { id: "umfrage", min: 0, max: 100, step: 1, unit: "%", real: share100(b.alle.counts[0], b.alle.n) };
    var findings = buildFindings();
    var guessed = typeof state.surveyGuess === "number";
    findings.hidden = !(guessed || state.surveyOpen);

    var card = h("div", { class: "survey__guess" });
    card.appendChild(h("p", { class: "kicker", text: "Erst schätzen, dann aufdecken" }));
    card.appendChild(h("h3", { class: "q__question", id: "survey-q", text: "Wie viel Prozent unserer Befragten nennen „Kommunikation und Sprache“ als Barriere?" }));
    var ruler = makeRuler(q);
    ruler.input.setAttribute("aria-describedby", "survey-q");
    card.appendChild(ruler.root);
    var actions = h("div", { class: "q__actions" });
    var result = h("div", { "aria-live": "polite" });
    card.appendChild(actions);
    card.appendChild(result);

    function open(animate) {
      findings.hidden = false;
      if (animate) setTimeout(function () { observeTerms(); }, 50);
    }
    function showResult(animate) {
      actions.innerHTML = "";
      result.innerHTML = "";
      if (typeof state.surveyGuess === "number") {
        ruler.setValue(state.surveyGuess);
        ruler.reveal(q.real, null, animate);
        var info = verdictInfo(q, state.surveyGuess);
        result.appendChild(h("p", { class: "q__react q__react--" + info.tier + (animate ? " is-new" : ""), text: info.word }));
        result.appendChild(h("p", { class: "q__verdict", text: info.text + " Echt: " + q.real + " % – " + b.alle.counts[0] + " von " + b.alle.n + " Befragten." }));
        if (animate) { buzz(info.tier === "hit" ? [20, 40, 20, 40, 70] : 18); if (info.tier === "hit") confetti(18); }
      } else {
        ruler.root.hidden = true;
        result.appendChild(h("p", { class: "q__verdict", text: "Echt: " + q.real + " % – " + b.alle.counts[0] + " von " + b.alle.n + " Befragten nennen Kommunikation und Sprache." }));
      }
      open(animate);
    }
    if (guessed || state.surveyOpen) { showResult(false); }
    else {
      var submit = h("button", { type: "button", class: "btn btn--primary", disabled: true, text: "Schätzung abgeben" });
      var skip = h("button", { type: "button", class: "btn btn--quiet", text: "Ohne Schätzen aufdecken" });
      actions.appendChild(submit);
      actions.appendChild(skip);
      ruler.onTouch = function () { submit.disabled = false; };
      submit.addEventListener("click", function () {
        if (!ruler.touched) return;
        state.surveyGuess = Math.round(ruler.value);
        state.surveyOpen = true; persist();
        showResult(true);
      });
      skip.addEventListener("click", function () { state.surveyOpen = true; persist(); showResult(true); });
    }
    box.appendChild(card);
    box.appendChild(findings);
  }

  // Zahlen aus der Umfrage an anderen Stellen (Lösung, Sprachpaten, Projekt)
  function fillSurveyBits() {
    if (!U) return;
    var d = U.daten, b = d.barrieren, v = d.vorurteile.g2;
    $$('[data-survey="beleg"]').forEach(function (li) {
      li.innerHTML = "";
      li.appendChild(h("strong", { text: "Unsere Umfrage zeigt es: " }));
      li.appendChild(document.createTextNode(b.alle.counts[0] + " von " + b.alle.n + " Befragten nennen Kommunikation und Sprache als Barriere, bei den selbst Eingewanderten sogar " + b.g1.counts[0] + " von " + b.g1.n + ". Und " + v.counts.Ja + " von " + v.n + " aus Gruppe 2 sagen: Ihre Vorurteile haben sich nach dem Kontakt verändert. "));
      li.appendChild(h("a", { class: "inline-link", href: "#/ergebnisse?u=1", text: "Zur Auswertung" }));
    });
    $$('[data-survey="basis"]').forEach(function (el) { el.textContent = "Ausgangswert aus unserer Umfrage vom November 2026: im Schnitt " + CH.num(d.akzeptanz.alle.mean) + " von 5."; });
    $$("[data-voice]").forEach(function (fig) {
      var z = U.zitate[Number(fig.getAttribute("data-voice"))];
      if (!z) return;
      fig.innerHTML = "";
      fig.setAttribute("data-term-view", z.term || "");
      fig.appendChild(h("blockquote", null, [h("p", { text: "„" + z.text + "“" })]));
      fig.appendChild(h("figcaption", { text: "Aus unserer Umfrage am HHBK · " + (z.g === 1 ? G1 : G2) + " · anonym" }));
    });
  }

  /* =================== Mein Pass =================== */
  function renderPass() {
    var n = doneCount(), next = firstUndone();
    $("#pass-lead").textContent = n === TOTAL
      ? "Alle 9 Stempel – dein Pass ist gültig. Danke fürs Mitmachen!"
      : "Dieser Pass ist noch nicht gültig: " + n + " von 9 Stempeln. Jede Station dauert ein bis zwei Minuten.";
    $("#pass-count").textContent = n + " von " + TOTAL;
    var card = $("#stampcard");
    card.innerHTML = "";
    card.appendChild(h("li", null, [h("div", { class: "cell is-done" }, [stampFor("einreise", false)])]));
    stations.forEach(function (s, i) {
      var done = !!state.done[s.slug];
      var isNext = !done && next && next.slug === s.slug;
      var title = s.slug === "abwaegen" ? "Chancen & Probleme" : s.title;
      var a = h("a", { class: "cell" + (done ? " is-done" : "") + (isNext ? " is-next" : ""), href: "#/" + s.slug });
      if (done) {
        a.appendChild(stampFor(s.slug, false));
        a.appendChild(h("span", { class: "sr-only", text: "Station " + (i + 1) + ", " + s.title + ": Stempel am " + dateDe(state.doneAt[s.slug]) + ". Noch einmal ansehen." }));
      } else {
        if (isNext) a.appendChild(h("span", { class: "cell__next", "aria-hidden": "true", text: "als Nächstes" }));
        a.appendChild(h("span", { class: "cell__no", "aria-hidden": "true", text: String(i + 1) }));
        a.appendChild(h("span", { class: "cell__title" }, [h("span", { class: "sr-only", text: "Station " + (i + 1) + ": " }), title, h("span", { class: "cell__time", text: minutes(s.min) })]));
      }
      card.appendChild(h("li", null, [a]));
    });
    $("#pass-status").textContent = n === TOTAL ? "Gültig – solange der Rhein fließt." : "Noch " + (TOTAL - n) + (TOTAL - n === 1 ? " Stempel" : " Stempel") + " bis zum gültigen Pass.";
    var actions = $("#pass-actions");
    actions.innerHTML = "";
    if (next) actions.appendChild(h("a", { class: "btn btn--primary", href: "#/" + next.slug }, ["Weiter: " + next.title + " ", h("span", { class: "arrow", "aria-hidden": "true", text: "→" })]));
    else actions.appendChild(h("a", { class: "btn btn--primary", href: "#/ergebnisse", text: "Ergebnisse des HHBK ansehen" }));
    actions.appendChild(h("a", { class: "btn btn--line", href: "#/sprachpaten", text: "Sprachpaten" }));

    var total = Object.keys(D.terms).length;
    $("#terms-count").textContent = termCount() + "/" + total;
    var list = $("#terms");
    list.innerHTML = "";
    Object.keys(D.terms).forEach(function (id) {
      var t = D.terms[id];
      if (state.terms[id]) {
        list.appendChild(h("li", { class: "term" }, [h("p", { class: "term__name", text: t.name }), h("p", { class: "term__def", text: t.def })]));
      } else {
        var where = stations[stationIndex(t.where)];
        list.appendChild(h("li", { class: "term is-locked" }, [
          h("p", { class: "term__name" }, [h("span", { "aria-hidden": "true", text: "? ? ?" }), h("span", { class: "sr-only", text: "Noch nicht gesammelt" })]),
          h("p", { class: "term__def" }, ["Zu finden in Station " + (stationIndex(t.where) + 1) + ": ", h("a", { href: "#/" + where.slug, text: where.title })])
        ]));
      }
    });

    var gut = $("#pass-gut");
    gut.innerHTML = "";
    var prof = gutProfile();
    if (prof) gut.appendChild(gutCard(prof));
    else gut.appendChild(h("p", null, ["Noch nicht geschätzt. ", h("a", { class: "inline-link", href: "#/schaetzen", text: "Zum Schätzspiel" }), " – sechs Fragen, danach weißt du, wie gut dein Bauchgefühl ist."]));

    var sp = $("#pass-sp");
    sp.innerHTML = "";
    if (state.pate) {
      sp.appendChild(h("p", null, [h("strong", { text: state.pate.rolle === "suchen" ? "Du bist angemeldet und bekommst Unterstützung. " : "Du bist als Sprachpatin oder Sprachpate angemeldet. " }), "Danke! Wir melden uns über deine Klasse, sobald das Programm startet."]));
    } else {
      sp.appendChild(h("p", { text: "Neu am HHBK? Oder du sprichst Deutsch und eine weitere Sprache? Die Anmeldung dauert eine Minute." }));
      sp.appendChild(h("div", { class: "actions" }, [
        h("a", { class: "btn btn--primary", href: "#/sprachpaten?r=helfen", text: "Ich will helfen" }),
        h("a", { class: "btn btn--line", href: "#/sprachpaten?r=suchen", text: "Ich brauche Unterstützung" })
      ]));
    }
  }
  enterHooks.pass = function () { renderPass(); };

  /* =================== Teilen, Über das Projekt =================== */
  function share(text, path) {
    var base = C.siteUrl ? C.siteUrl.replace(/\/?$/, "/") : location.origin + location.pathname.replace(/[^\/]*$/, "");
    var url = base + (path || "");
    var data = { title: "Gefühlt vs. echt – Migration am HHBK", text: text || "Schätz mal: Wie weit liegen Gefühl und Statistik beim Thema Migration auseinander?", url: url };
    function copy() {
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("Link kopiert: " + url); }).catch(function () { toast(url); });
      else toast(url);
    }
    // Wo Teilen nicht erlaubt ist, wird der Link stattdessen kopiert
    if (navigator.share) { navigator.share(data).catch(function (e) { if (!e || e.name !== "AbortError") copy(); }); return; }
    copy();
  }
  function initProjekt() {
    var ol = $("#sources");
    D.sources.forEach(function (s) {
      ol.appendChild(h("li", null, [s[1] ? h("a", { href: s[1], target: "_blank", rel: "noopener", text: s[0] }) : s[0]]));
    });
    $$("[data-share]").forEach(function (b) { b.addEventListener("click", function () { share(); }); });
  }

  /* =================== Start =================== */
  function boot() {
    $$("[data-contact]").forEach(function (el) { if (C.contact) el.textContent = C.contact; });
    var hero = $("#hero-stamp");
    if (hero) hero.appendChild(stamp({ main: "echt", bottom: "laut Statistik", mainSize: 66, rotate: -6, animate: true, color: "var(--gold-hi)", label: "echt" }));
    buildStationChrome();
    initCover();
    initDu();
    initZeit();
    initMorgen();
    initStreit();
    initTabs();
    renderSort(false);
    initLoesung();
    initSprachpaten();
    initNachher();
    initProjekt();
    renderSurvey();
    fillSurveyBits();
    observeTerms();
    renderCover();
    window.addEventListener("hashchange", route);
    route();
    API.flush();
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
