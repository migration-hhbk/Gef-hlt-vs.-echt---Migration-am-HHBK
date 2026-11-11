/*
 * Kleine Diagramm-Bausteine ohne externe Bibliothek.
 * Farben: Bleistift = du, Füllertinte = HHBK, Stempel = echter Wert.
 * Jede Grafik hat eine Tabellenansicht, damit kein Wert nur über Farbe lesbar ist.
 */
window.MHHBK_CHARTS = (function () {
  "use strict";

  function h(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "style") node.setAttribute("style", v);
        else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function num(v, digits) {
    if (v === null || v === undefined || isNaN(v)) return "–";
    return Number(v).toLocaleString("de-DE", { maximumFractionDigits: digits === undefined ? 1 : digits, minimumFractionDigits: 0 });
  }
  function withUnit(v, unit, digits) {
    if (v === null || v === undefined || isNaN(v)) return "–";
    return num(v, digits) + " " + unit;
  }
  function pct(v, max, min) {
    min = min || 0;
    var p = (v - min) / (max - min) * 100;
    return Math.max(0, Math.min(100, p));
  }

  function table(headers, rows, caption) {
    var thead = h("thead", null, [h("tr", null, headers.map(function (t) { return h("th", { scope: "col", text: t }); }))]);
    var tbody = h("tbody", null, rows.map(function (r) {
      return h("tr", null, r.map(function (c, i) { return h(i === 0 ? "th" : "td", i === 0 ? { scope: "row", text: c } : { text: c }); }));
    }));
    var t = h("table", { class: "datatable" }, [caption ? h("caption", { class: "sr-only", text: caption }) : null, thead, tbody]);
    return h("details", null, [h("summary", { text: "Als Tabelle anzeigen" }), t]);
  }

  function legend(items) {
    return h("ul", { class: "legend" }, items.map(function (it) {
      return h("li", null, [h("span", { class: "key key--" + it.key, "aria-hidden": "true" }), it.label]);
    }));
  }

  /* Hantel-Diagramm: gefühlt (du, HHBK) gegen echt */
  function dumbbell(rows) {
    var list = h("ol", { class: "db" });
    rows.forEach(function (r) {
      var plot = h("div", { class: "db__plot", "aria-hidden": "true" });
      plot.appendChild(h("div", { class: "db__axis" }));
      [0, 0.5, 1].forEach(function (f) {
        var v = r.max * f;
        plot.appendChild(h("div", { class: "db__tick", style: "left:" + (f * 100) + "%" }));
        plot.appendChild(h("div", { class: "db__ticklabel", style: "left:" + (f * 100) + "%", text: num(v, 0) }));
      });
      if (r.school !== null && r.school !== undefined) {
        var a = pct(r.school, r.max), b = pct(r.real, r.max);
        plot.appendChild(h("div", { class: "db__link", style: "left:" + Math.min(a, b) + "%;width:" + Math.abs(a - b) + "%" }));
        plot.appendChild(h("div", { class: "db__dot db__dot--school", style: "left:" + a + "%", title: "HHBK im Schnitt: " + withUnit(r.school, r.unit) }));
      }
      if (r.mine !== null && r.mine !== undefined) {
        plot.appendChild(h("div", { class: "db__dot key--mine", style: "left:" + pct(r.mine, r.max) + "%;width:10px;height:10px;margin-left:-5px;top:14px", title: "Du: " + withUnit(r.mine, r.unit) }));
      }
      plot.appendChild(h("div", { class: "db__dot db__dot--real", style: "left:" + pct(r.real, r.max) + "%", title: "Echt: " + withUnit(r.real, r.unit) }));

      var vals = h("p", { class: "db__vals" }, [
        r.school === undefined ? null : h("span", null, ["HHBK ", h("b", { text: r.school === null ? "noch offen" : withUnit(r.school, r.unit) })]),
        h("span", null, ["echt ", h("b", { text: withUnit(r.real, r.unit) })]),
        r.mine !== null && r.mine !== undefined ? h("span", null, ["du ", h("b", { text: withUnit(r.mine, r.unit) })]) : null
      ]);
      list.appendChild(h("li", { class: "db__row" }, [h("p", { class: "db__label", text: r.label }), plot, vals]));
    });
    return list;
  }

  /* Waagerechte Balken, eine Farbe (eine Reihe = keine Legende nötig) */
  function bars(items, opts) {
    opts = opts || {};
    var max = opts.max || Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    var list = h("ul", { class: "bars" });
    items.forEach(function (it) {
      var w = pct(it.value, max);
      list.appendChild(h("li", { class: "bar-row" + (it.mine ? " bar-row--mine" : "") }, [
        h("span", { class: "bar-row__label", text: it.label + (it.mine ? " (deine Antwort)" : "") }),
        h("span", { class: "bar-row__track" }, [
          h("span", { class: "bar-row__fill", style: "width:calc((100% - 4rem) * " + (w / 100).toFixed(4) + ")" }),
          h("span", { class: "bar-row__value", text: it.display })
        ])
      ]));
    });
    return list;
  }

  /* Säulen für eine 1–5-Skala */
  function columns(dist, ends) {
    var max = Math.max.apply(null, dist.concat([1]));
    var wrap = h("div");
    var cols = h("div", { class: "cols", "aria-hidden": "true" });
    dist.forEach(function (n) {
      cols.appendChild(h("div", { class: "col" }, [
        h("span", { class: "col__value", text: String(n) }),
        h("span", { class: "col__fill", style: "height:" + Math.max(1, n / max * 100) + "%" })
      ]));
    });
    wrap.appendChild(cols);
    wrap.appendChild(h("div", { class: "cols__labels", "aria-hidden": "true" }, [1, 2, 3, 4, 5].map(function (i) { return h("span", { text: String(i) }); })));
    if (ends) wrap.appendChild(h("div", { class: "cols__ends", "aria-hidden": "true" }, [h("span", { text: "1 = " + ends[0] }), h("span", { text: "5 = " + ends[1] })]));
    return wrap;
  }

  return { h: h, num: num, withUnit: withUnit, pct: pct, table: table, legend: legend, dumbbell: dumbbell, bars: bars, columns: columns };
})();
