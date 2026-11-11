/*
 * Gefühlt vs. echt – App-Logik
 * Projekt der AIA31, Heinrich-Hertz-Berufskolleg Düsseldorf
 */
(function () {
  "use strict";

  var C = window.MHHBK_CONFIG || {};
  var D = window.MHHBK_DATA;
  var CH = window.MHHBK_CHARTS;
  var h = CH.h;
  var MIN_N = C.minN || 5;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function fmt(v, unit) { return CH.withUnit(v, unit); }
  function langName(code) { var f = D.languages.filter(function (l) { return l[0] === code; })[0]; return f ? f[1] : code; }
  function label(list, key) { var f = list.filter(function (l) { return l[0] === key; })[0]; return f ? f[1] : key; }

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
    id: newId(), answers: {}, quiz: {}, done: {}, moments: {}, level: 0,
    pending: {}, pate: null, nachher: false
  }, loadState() || {});
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
  var toastTimer;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 3200);
  }

  /* ---------------- Stempel ---------------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
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

  /* ---------------- Navigation & Laufzettel ---------------- */
  var stations = D.stations;
  var order = ["start"].concat(stations.map(function (s) { return s.slug; })).concat(["projekt"]);
  var current = null;
  var enterHooks = {};
  var leaveHooks = {};

  function stationIndex(slug) { for (var i = 0; i < stations.length; i++) if (stations[i].slug === slug) return i; return -1; }
  function markDone(slug) { if (!state.done[slug]) { state.done[slug] = true; persist(); renderLaufzettel(); } }

  var CHECK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function renderLaufzettel() {
    var ol = $("#laufzettel");
    if (!ol) return;
    ol.innerHTML = "";
    stations.forEach(function (s, i) {
      var done = !!state.done[s.slug];
      var a = h("a", {
        href: "#/" + s.slug,
        class: done ? "is-done" : "",
        "aria-label": "Station " + (i + 1) + ": " + s.title + (done ? " (erledigt)" : ""),
        "aria-current": current === s.slug ? "step" : null,
        title: s.title
      });
      if (done) a.innerHTML = CHECK_SVG; else a.textContent = String(i + 1);
      ol.appendChild(h("li", null, [a]));
    });
  }

  function buildPageNav() {
    stations.forEach(function (s, i) {
      var page = document.getElementById(s.slug);
      if (!page) return;
      var prev = i === 0 ? { slug: "start", title: "Deckblatt" } : stations[i - 1];
      var next = i === stations.length - 1 ? { slug: "projekt", title: "Über das Projekt" } : stations[i + 1];
      var nextLink = h("a", { class: "btn btn--line", href: "#/" + next.slug, "data-next": s.slug }, ["Weiter: " + next.title]);
      nextLink.addEventListener("click", function () { if (s.slug !== "schaetzen" && s.slug !== "streitfrage") markDone(s.slug); });
      var nav = h("nav", { class: "pagenav js-only", "aria-label": "Seiten" }, [
        h("a", { class: "btn btn--quiet", href: "#/" + prev.slug }, ["Zurück"]),
        nextLink
      ]);
      var foot = h("p", { class: "page__no" }, [h("span", { text: "Seite " + (i + 1) + " von " + stations.length }), h("span", { text: s.title })]);
      page.appendChild(nav);
      page.appendChild(foot);
    });
    $$("main > .page").forEach(function (p, i) { p.style.setProperty("--g-rot", (i * 41) + "deg"); });
  }

  var firstRoute = true;
  function route() {
    var slug = (location.hash || "").replace(/^#\/?/, "") || "start";
    if (order.indexOf(slug) === -1) slug = "start";
    if (current && current !== slug && leaveHooks[current]) leaveHooks[current]();
    $$("main > .page").forEach(function (p) { p.hidden = p.id !== slug; });
    current = slug;
    renderLaufzettel();
    var idx = stationIndex(slug);
    document.title = (idx >= 0 ? stations[idx].title + " – " : slug === "projekt" ? "Über das Projekt – " : "") + "Gefühlt vs. echt";
    window.scrollTo(0, 0);
    if (!firstRoute) {
      var heading = $("#" + slug + " .title") || $("#" + slug + " h1");
      if (heading) heading.focus({ preventScroll: true });
    }
    firstRoute = false;
    if (enterHooks[slug]) enterHooks[slug]();
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

  /* =================== Station 1: Kurz zu dir =================== */
  function initDu() {
    var form = $("#form-du");
    var a = state.answers;
    radioGroup($('[data-radio="herkunft"]', form), "herkunft", D.herkunft, a.herkunft);
    langChips($('[data-langs="sprachen"]', form), "sprachen", a.sprachen);
    form.sprachen_andere.value = a.sprachen_andere || "";
    kreuz($('[data-kreuz="akzeptanz"]', form), "akzeptanz", a.akzeptanz);
    kreuz($('[data-kreuz="wissen_vorher"]', form), "wissen_vorher", a.wissen_vorher);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = {};
      var herkunft = readRadio(form, "herkunft"); if (herkunft) fields.herkunft = herkunft;
      var sprachen = readChecks(form, "sprachen"); if (sprachen.length) fields.sprachen = sprachen;
      var andere = form.sprachen_andere.value.trim(); if (andere) fields.sprachen_andere = andere;
      var akz = readRadio(form, "akzeptanz"); if (akz) fields.akzeptanz = Number(akz);
      var wv = readRadio(form, "wissen_vorher"); if (wv) fields.wissen_vorher = Number(wv);
      Object.assign(state.answers, fields);
      persist();
      if (Object.keys(fields).length) API.queue(fields);
      markDone("du");
      location.hash = "#/schaetzen";
    });
    $('a[href="#/schaetzen"]', form).addEventListener("click", function () { markDone("du"); });
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
    input.addEventListener("input", function () {
      if (!touched) { touched = true; root.classList.remove("is-untouched"); if (api.onTouch) api.onTouch(); }
      update();
    });
    update();
    return api;
  }

  function verdict(q, guess) {
    var diff = guess - q.real, abs = Math.abs(diff);
    var tol = q.unit === "%" ? 2 : 0.3;
    if (abs <= tol) return "Fast genau getroffen!";
    var amount = q.unit === "%" ? CH.num(abs) + (abs === 1 ? " Prozentpunkt" : " Prozentpunkte") : CH.num(abs) + " Millionen";
    return "Du hast " + amount + (diff > 0 ? " zu hoch" : " zu niedrig") + " geschätzt.";
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

  function pips(activeIdx) {
    return h("ol", { class: "q__pips", "aria-hidden": "true" }, D.quiz.map(function (q, i) {
      return h("li", { class: state.quiz[q.id] !== undefined && i !== activeIdx ? "is-done" : i === activeIdx ? "is-now" : "" });
    }));
  }

  function renderQuestion(box, idx, revealed) {
    var q = D.quiz[idx];
    box.innerHTML = "";
    var qid = "q-" + q.id;
    box.appendChild(h("p", { class: "q__count", text: "Frage " + (idx + 1) + " von " + D.quiz.length }));
    box.appendChild(pips(idx));
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
      actions.innerHTML = "";
      result.innerHTML = "";
      result.appendChild(h("p", { class: "q__verdict", text: verdict(q, guess) }));
      result.appendChild(h("p", { class: "q__explain", text: q.explain }));
      result.appendChild(h("p", { class: "q__note", text: q.note }));
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
      var next = h("button", { type: "button", class: "btn btn--primary", text: last ? "Zur Auswertung" : "Nächste Frage" });
      next.addEventListener("click", function () {
        quizShow = null;
        renderQuiz();
        var nq = $("#quiz .q__question") || $("#quiz .summary__head");
        if (nq) nq.focus({ preventScroll: false });
      });
      result.appendChild(h("div", { class: "q__actions" }, [next]));
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
      if (Object.keys(state.quiz).length === D.quiz.length) markDone("schaetzen");
    });
  }

  function renderSummary(box) {
    box.innerHTML = "";
    var head = h("h2", { class: "q__question summary__head", tabindex: "-1", text: "Deine Schätzungen im Überblick" });
    box.appendChild(head);
    var list = h("ol", { class: "summary" });
    var errs = [];
    D.quiz.forEach(function (q) {
      var g = state.quiz[q.id];
      if (q.unit === "%") errs.push(Math.abs(g - q.real));
      var a = CH.pct(g, q.max, q.min), b = CH.pct(q.real, q.max, q.min);
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
          h("span", null, ["echt: ", h("span", { class: "real", text: fmt(q.real, q.unit) })])
        ])
      ]));
    });
    box.appendChild(list);
    var mae = errs.reduce(function (s, e) { return s + e; }, 0) / errs.length;
    var total = h("p", { class: "summary__total", text: "Bei den Prozentfragen lagst du im Schnitt " + CH.num(mae) + " Prozentpunkte daneben." });
    box.appendChild(total);
    var schoolLine = h("p", { class: "q__school-note" });
    box.appendChild(schoolLine);
    API.stats().then(function (s) {
      if (s && s.schaetzung && s.schaetzung.maePercent !== null && s.schaetzung.maePercent !== undefined) {
        schoolLine.textContent = "Zum Vergleich: Das HHBK liegt bei diesen Fragen im Schnitt " + CH.num(s.schaetzung.maePercent) + " Prozentpunkte daneben.";
      }
    }).catch(function () {});
    var again = h("button", { type: "button", class: "btn btn--quiet", text: "Noch einmal schätzen" });
    again.addEventListener("click", function () { state.quiz = {}; persist(); quizShow = null; renderQuiz(); var q = $("#quiz .q__question"); if (q) q.focus(); });
    box.appendChild(h("div", { class: "q__actions" }, [again]));
  }

  enterHooks.schaetzen = function () {
    renderQuiz();
    if (API.enabled && !API._stats) API.stats().catch(function () {});
  };

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
          maybeAfter();
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
    maybeAfter();
  }
  function maybeAfter() {
    var all = D.moments.every(function (m, i) { return state.moments[i] !== undefined; });
    $("#morgen-after").hidden = !all;
    if (all) markDone("morgen");
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
        return { label: o[1], value: n, display: CH.num(n / sf.n * 100, 0) + " %", mine: o[0] === mine };
      }), { max: sf.n }));
      holder.appendChild(h("p", { class: "fineprint", text: sf.n + " Stimmen. Meinungsbild, nicht repräsentativ." }));
    }).catch(function () {
      holder.innerHTML = "";
      holder.appendChild(h("p", { class: "muted", text: "Das Meinungsbild konnte gerade nicht geladen werden." }));
    });
  }

  /* =================== Station 6: Abwägen (Reiter) =================== */
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
      el2.textContent = "Wer die Sprache noch nicht kann, verliert schnell den Anschluss. In unserer Umfrage nennen " + CH.num(share, 0) + " % der Befragten am HHBK die Sprache als Hürde.";
    }
    var li = $('[data-live="loesung-daten"]');
    if (li && b && !b.hidden && b.respondents) {
      var share2 = (b.counts.sprache || 0) / b.respondents * 100;
      var a = stats.akzeptanz;
      li.textContent = "Unsere Umfrage: " + CH.num(share2, 0) + " % nennen Sprache als Hürde am HHBK" + (a && !a.hidden ? ", die Akzeptanz liegt im Schnitt bei " + CH.num(a.mean) + " von 5." : ".");
      li.hidden = false;
    }
    var counter = $("#pate-counter");
    if (counter && stats.paten) {
      var pt = stats.paten;
      counter.textContent = pt.helfen + (pt.helfen === 1 ? " Person will" : " Personen wollen") + " schon Sprachpatin oder Sprachpate werden, " + pt.suchen + " " + (pt.suchen === 1 ? "wünscht" : "wünschen") + " sich Unterstützung.";
    }
  }
  enterHooks.abwaegen = function () { API.stats().then(fillLive).catch(function () {}); };

  /* =================== Station 7: Sprachpaten =================== */
  function initPate() {
    var form = $("#form-pate");
    langChips($('[data-langs="pate_sprachen"]', form), "pate_sprachen", state.pate ? state.pate.sprachen : (state.answers.sprachen || []));
    var err = $(".form-error", form);

    function pass() {
      var rolle = readRadio(form, "rolle");
      $("#pass-role").textContent = rolle === "suchen" ? "sucht Unterstützung" : rolle === "helfen" ? "Sprachpatin oder -pate" : "Patin oder Pate";
      $("#pass-name").textContent = form.vorname.value.trim() || "…";
      $("#pass-klasse").textContent = form.klasse.value.trim() || "…";
      var langs = readChecks(form, "pate_sprachen").map(langName);
      $("#pass-sprachen").textContent = langs.length ? langs.join(", ") : "…";
    }
    form.addEventListener("input", pass);
    form.addEventListener("change", pass);

    function lock(data, animate) {
      $$("input, button", form).forEach(function (x) { x.disabled = true; });
      var holder = $("#pass-stamp");
      holder.innerHTML = "";
      holder.appendChild(stamp({ top: "Sprachpaten HHBK", main: "angemeldet", rotate: -8, animate: animate, label: "Angemeldet" }));
      if (data) {
        form.vorname.value = data.vorname; form.klasse.value = data.klasse;
        var r = form.querySelector('input[name="rolle"][value="' + data.rolle + '"]'); if (r) r.checked = true;
      }
      pass();
      err.textContent = "";
      var done = form.querySelector(".signup__done");
      if (!done) form.appendChild(h("p", { class: "saved-note signup__done", text: "Danke! Deine Anmeldung ist gespeichert. Sobald das Programm startet, melden wir uns über deine Klasse." }));
    }

    if (state.pate) { lock(state.pate, false); form.querySelector('button[type="submit"]').textContent = "Angemeldet"; }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
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
      if (!data.rolle) return (err.textContent = "Wähl aus, ob du helfen oder Unterstützung bekommen möchtest.");
      if (!data.vorname) return (err.textContent = "Trag deinen Vornamen ein.");
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]{1,30}$/.test(data.vorname)) return (err.textContent = "Beim Vornamen bitte nur Buchstaben verwenden.");
      if (!data.klasse) return (err.textContent = "Trag deine Klasse ein, zum Beispiel AIA31.");
      if (!data.sprachen.length) return (err.textContent = "Wähl mindestens eine Sprache aus.");
      if (!data.einwilligung) return (err.textContent = "Ohne deine Einwilligung können wir die Anmeldung nicht speichern.");
      if (!data.alter) return (err.textContent = "Bitte bestätige dein Alter oder das Einverständnis deiner Eltern.");
      if (!API.enabled) return (err.textContent = "Die Anmeldung ist noch nicht freigeschaltet, weil die Datenbank nicht verbunden ist.");
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "Wird gespeichert …";
      API.send({ action: "pate", data: data }).then(function (res) {
        if (res && res.ok) {
          state.pate = { rolle: data.rolle, vorname: data.vorname, klasse: data.klasse, sprachen: data.sprachen };
          persist();
          markDone("loesung");
          lock(null, true);
          btn.textContent = "Angemeldet";
          toast("Danke! Deine Anmeldung ist gespeichert.");
          API._stats = null;
          API.stats(true).then(fillLive).catch(function () {});
        } else {
          btn.disabled = false; btn.textContent = "Anmelden";
          err.textContent = "Das hat nicht geklappt: " + ((res && res.message) || "Bitte prüf deine Angaben.");
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = "Anmelden";
        err.textContent = "Keine Verbindung zur Datenbank. Prüf dein Internet und versuch es noch einmal.";
      });
    });
    pass();
  }
  enterHooks.loesung = function () {
    var form = $("#form-pate");
    if (!state.pate && !readChecks(form, "pate_sprachen").length && state.answers.sprachen) {
      state.answers.sprachen.forEach(function (code) {
        var input = form.querySelector('input[name="pate_sprachen"][value="' + code + '"]');
        if (input) { input.checked = true; input.closest(".chip").hidden = false; }
      });
      form.dispatchEvent(new Event("change"));
    }
    API.stats().then(fillLive).catch(function () {});
  };

  /* =================== Station 8: Ergebnisse =================== */
  var refreshTimer = null;
  function initNachher() {
    var form = $("#form-nachher");
    kreuz($('[data-kreuz="wissen_nachher"]', form), "wissen_nachher", state.answers.wissen_nachher);
    radioGroup($('[data-radio="sicht"]', form), "sicht", D.sicht, state.answers.sicht);
    if (state.nachher) form.hidden = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fields = {};
      var w = readRadio(form, "wissen_nachher"); if (w) fields.wissen_nachher = Number(w);
      var s = readRadio(form, "sicht"); if (s) fields.sicht = s;
      Object.assign(state.answers, fields);
      state.nachher = true; persist();
      if (Object.keys(fields).length) API.queue(fields);
      markDone("ergebnisse");
      form.hidden = true;
      toast("Danke fürs Mitmachen!");
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
        return { label: o[1], value: n, display: CH.num(n / b.respondents * 100, 0) + " %" };
      }).sort(function (x, y) { return y.value - x.value; });
      box.appendChild(chartBlock("Wo das HHBK Hürden erlebt", "Anteil der " + b.respondents + " Befragten, mehrere Antworten möglich", CH.bars(items),
        CH.table(["Hürde", "Anzahl"], items.map(function (i) { return [i.label, String(i.value)]; }), "Hürden")));
    } else box.appendChild(chartBlock("Wo das HHBK Hürden erlebt", null, hiddenNote(b, "Diese Frage")));

    /* 4. Streitfrage */
    var sf = s.streitfrage;
    if (sf && !sf.hidden) {
      var sItems = D.streitfrage.map(function (o) { var n = sf.dist[o[0]] || 0; return { label: o[1], value: n, display: CH.num(n / sf.n * 100, 0) + " %", mine: state.answers.streitfrage === o[0] }; });
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
        body2.appendChild(CH.bars(D.sicht.map(function (o) { var n = sv.dist[o[0]] || 0; return { label: o[1], value: n, display: CH.num(n / sv.n * 100, 0) + " %" }; }), { max: sv.n }));
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

  enterHooks.ergebnisse = function () {
    var form = $("#form-nachher");
    form.hidden = !!state.nachher;
    renderResults(false);
    clearInterval(refreshTimer);
    if (API.enabled) refreshTimer = setInterval(function () { if (!document.hidden) renderResults(true); }, 30000);
  };
  leaveHooks.ergebnisse = function () { clearInterval(refreshTimer); };

  /* =================== Über das Projekt =================== */
  function initProjekt() {
    var ol = $("#sources");
    D.sources.forEach(function (s) {
      ol.appendChild(h("li", null, [s[1] ? h("a", { href: s[1], target: "_blank", rel: "noopener", text: s[0] }) : s[0]]));
    });
    var btn = $("#share-btn");
    var url = C.siteUrl || location.href.split("#")[0];
    if (btn) btn.addEventListener("click", function () {
      var data = { title: "Gefühlt vs. echt – Migration am HHBK", text: "Schätz mal: Wie weit liegen Gefühl und Statistik beim Thema Migration auseinander?", url: url };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("Link kopiert."); }).catch(function () { toast(url); });
      else toast(url);
    });
  }

  /* =================== Start =================== */
  function boot() {
    $$("[data-contact]").forEach(function (el) { if (C.contact) el.textContent = C.contact; });
    var hero = $("#hero-stamp");
    if (hero) hero.appendChild(stamp({ main: "echt", bottom: "laut Statistik", mainSize: 66, rotate: -6, animate: true, label: "echt" }));
    buildPageNav();
    initDu();
    initMorgen();
    initStreit();
    initTabs();
    initPate();
    initNachher();
    initProjekt();
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
