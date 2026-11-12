/**
 * Gefühlt vs. echt – Datenbank (Google Apps Script)
 * Projekt der AIA31, Heinrich-Hertz-Berufskolleg Düsseldorf
 *
 * Was dieses Skript macht:
 *  - speichert anonyme Antworten im Tabellenblatt "Antworten"
 *  - speichert Anmeldungen zum Sprachpaten-Programm im Blatt "Sprachpaten"
 *  - gibt nach außen NUR Zusammenfassungen heraus (Durchschnitte, Anzahlen),
 *    nie einzelne Zeilen und nie Namen
 *
 * Einrichtung: siehe README.md, Schritt 2.
 */

var MIN_N = 5;          // Gruppen mit weniger Antworten werden nicht angezeigt
var MIN_LANG = 3;       // Sprachen mit weniger Nennungen werden zusammengefasst
var SHEET_A = "Antworten";
var SHEET_P = "Sprachpaten";

var COLS_A = ["id", "erstellt", "aktualisiert", "herkunft", "sprachen", "sprachen_andere", "akzeptanz", "wissen_vorher",
  "s_de", "s_muslime", "s_pflege", "s_ddorf", "s_schule", "s_auswanderung",
  "barrieren", "streitfrage", "wissen_nachher", "sicht"];
var COLS_P = ["erstellt", "rolle", "vorname", "klasse", "sprachen"];

var LANGS = ["de", "en", "tr", "ar", "ku", "pl", "ru", "uk", "el", "it", "es", "fr", "fa", "ps", "sq", "sh", "ro", "bg",
  "pt", "ja", "zh", "vi", "hi", "ur", "ta", "ber", "ti", "so", "nl", "hu"];
var ENUMS = {
  herkunft: ["selbst", "eltern", "nein", "keine_angabe"],
  barrieren: ["sprache", "freundschaften", "mitschueler", "lehrkraefte", "erwartungen", "missverstaendnisse", "keine"],
  streitfrage: ["dazu", "eher_dazu", "unentschieden", "eher_nicht", "nicht_dazu", "keine_angabe"],
  sicht: ["gar_nicht", "etwas", "deutlich"],
  rolle: ["helfen", "suchen"]
};
// Schätzfragen: erlaubter Bereich und echter Wert (für die durchschnittliche Abweichung)
var QUIZ = {
  s_de: { max: 100, real: 26.3, percent: true },
  s_muslime: { max: 100, real: 6.6, percent: true },
  s_pflege: { max: 100, real: 20, percent: true },
  s_ddorf: { max: 100, real: 45.3, percent: true },
  s_schule: { max: 100, real: 44.6, percent: true },
  s_auswanderung: { max: 10, real: 4.8, percent: false }
};

/* ---------- Einmalig ausführen: legt die Tabellenblätter an ---------- */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", ss.getId());
  sheet_(SHEET_A, COLS_A);
  sheet_(SHEET_P, COLS_P);
  return "Fertig: Tabellenblätter sind angelegt.";
}

/* ---------- Web-App: Lesen ---------- */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "stats";
  if (action === "ping") return json_({ ok: true, time: new Date().toISOString() });
  if (action === "stats") {
    var cache = CacheService.getScriptCache();
    var hit = cache.get("stats_v1");
    if (hit) return text_(hit);
    var str = JSON.stringify(stats_());
    cache.put("stats_v1", str, 30);
    return text_(str);
  }
  return json_({ ok: false, error: "unknown_action" });
}

/* ---------- Web-App: Schreiben ---------- */
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: "invalid_json" }); }
  if (!body || typeof body !== "object") return json_({ ok: false, error: "invalid_body" });
  try {
    if (body.action === "save") return json_(save_(body));
    if (body.action === "pate") return json_(pate_(body.data || {}));
    return json_({ ok: false, error: "unknown_action" });
  } catch (err) {
    return json_({ ok: false, error: "server_error" });
  }
}

function save_(body) {
  var id = String(body.id || "");
  if (!/^[a-z0-9]{16,40}$/.test(id)) return { ok: false, error: "invalid_id" };
  if (!rateOk_("rl_" + id, 40)) return { ok: false, error: "too_many_requests" };
  var fields = clean_(body.fields || {});
  if (!Object.keys(fields).length) return { ok: true, saved: 0 };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sh = sheet_(SHEET_A, COLS_A);
    var now = new Date();
    var row = findRow_(sh, id);
    if (row === -1) {
      var values = COLS_A.map(function (c) {
        if (c === "id") return id;
        if (c === "erstellt" || c === "aktualisiert") return now;
        return fields.hasOwnProperty(c) ? fields[c] : "";
      });
      sh.appendRow(values);
    } else {
      var range = sh.getRange(row, 1, 1, COLS_A.length);
      var vals = range.getValues()[0];
      Object.keys(fields).forEach(function (k) { vals[COLS_A.indexOf(k)] = fields[k]; });
      vals[COLS_A.indexOf("aktualisiert")] = now;
      range.setValues([vals]);
    }
  } finally {
    lock.releaseLock();
  }
  CacheService.getScriptCache().remove("stats_v1");
  return { ok: true, saved: Object.keys(fields).length };
}

function pate_(d) {
  if (d.website) return { ok: true }; // Falle für Spam-Programme: still ignorieren
  if (!rateOk_("rl_pate", 60)) return { ok: false, error: "too_many_requests", message: "Gerade melden sich sehr viele an. Versuch es gleich noch einmal." };
  var rolle = ENUMS.rolle.indexOf(d.rolle) !== -1 ? d.rolle : null;
  var vorname = text_clean_(d.vorname, 30);
  var klasse = text_clean_(d.klasse, 12);
  var sprachen = list_(d.sprachen, LANGS);
  if (!rolle) return { ok: false, error: "rolle", message: "Bitte wähl aus, ob du helfen oder Unterstützung möchtest." };
  if (!vorname || /[0-9@<>]/.test(vorname)) return { ok: false, error: "vorname", message: "Bitte gib einen gültigen Vornamen an." };
  if (!klasse || !/^[A-Za-z0-9ÄÖÜäöü .\/-]{1,12}$/.test(klasse.replace(/^'/, ""))) return { ok: false, error: "klasse", message: "Bitte gib deine Klasse an, zum Beispiel AIA31." };
  if (!sprachen) return { ok: false, error: "sprachen", message: "Bitte wähl mindestens eine Sprache aus." };
  if (d.einwilligung !== true || d.alter !== true) return { ok: false, error: "einwilligung", message: "Ohne Einwilligung speichern wir nichts." };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    sheet_(SHEET_P, COLS_P).appendRow([new Date(), rolle, vorname, klasse, sprachen]);
  } finally {
    lock.releaseLock();
  }
  CacheService.getScriptCache().remove("stats_v1");
  return { ok: true };
}

/* ---------- Prüfen und Säubern der Eingaben ---------- */
function clean_(f) {
  var out = {};
  if (ENUMS.herkunft.indexOf(f.herkunft) !== -1) out.herkunft = f.herkunft;
  var sp = list_(f.sprachen, LANGS); if (sp) out.sprachen = sp;
  var andere = text_clean_(f.sprachen_andere, 40); if (andere) out.sprachen_andere = andere;
  ["akzeptanz", "wissen_vorher", "wissen_nachher"].forEach(function (k) {
    var n = Number(f[k]);
    if (f[k] !== undefined && f[k] !== null && f[k] !== "" && n >= 1 && n <= 5 && Math.round(n) === n) out[k] = n;
  });
  Object.keys(QUIZ).forEach(function (k) {
    if (f[k] === undefined || f[k] === null || f[k] === "") return;
    var n = Number(f[k]);
    if (isFinite(n) && n >= 0 && n <= QUIZ[k].max) out[k] = Math.round(n * 10) / 10;
  });
  var ba = list_(f.barrieren, ENUMS.barrieren); if (ba) out.barrieren = ba;
  if (ENUMS.streitfrage.indexOf(f.streitfrage) !== -1) out.streitfrage = f.streitfrage;
  if (ENUMS.sicht.indexOf(f.sicht) !== -1) out.sicht = f.sicht;
  return out;
}
function list_(arr, allowed) {
  if (!Array.isArray(arr)) return null;
  var seen = {};
  var ok = arr.filter(function (x) { var keep = allowed.indexOf(x) !== -1 && !seen[x]; seen[x] = true; return keep; });
  return ok.length ? ok.join(",") : null;
}
function text_clean_(s, max) {
  if (s === undefined || s === null) return "";
  var t = String(s).replace(/[\u0000-\u001f\u007f<>"`]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
  if (/^[=+\-@]/.test(t)) t = "'" + t; // verhindert Formeln in der Tabelle
  return t;
}
function rateOk_(key, maxPer10Min) {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(n), 600);
  return n <= maxPer10Min;
}

/* ---------- Auswertung (nur Zusammenfassungen) ---------- */
function stats_() {
  var sh = sheet_(SHEET_A, COLS_A);
  var data = sh.getDataRange().getValues();
  var head = data.shift() || [];
  var ix = {};
  COLS_A.forEach(function (c) { ix[c] = head.indexOf(c); });
  function v(row, c) { var i = ix[c]; return i === -1 ? "" : row[i]; }
  function has(x) { return x !== "" && x !== null && x !== undefined; }

  var rows = data.filter(function (r) { return has(v(r, "id")); });
  var res = { ok: true, generated: new Date().toISOString(), minN: MIN_N, n: rows.length };

  // Schätzungen
  res.schaetzung = {};
  var errSum = 0, errN = 0;
  Object.keys(QUIZ).forEach(function (k) {
    var vals = rows.map(function (r) { return v(r, k); }).filter(has).map(Number).filter(isFinite);
    var id = k.replace(/^s_/, "");
    if (vals.length >= MIN_N) {
      var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
      res.schaetzung[id] = { n: vals.length, mean: round1_(mean), median: round1_(median_(vals)) };
      if (QUIZ[k].percent) vals.forEach(function (x) { errSum += Math.abs(x - QUIZ[k].real); errN++; });
    } else {
      res.schaetzung[id] = { n: vals.length, mean: null };
    }
  });
  res.schaetzung.maePercent = errN >= MIN_N ? round1_(errSum / errN) : null;

  // Herkunft (nur Anzahlen)
  var herk = count_(rows.map(function (r) { return v(r, "herkunft"); }).filter(has), ENUMS.herkunft);
  res.herkunft = sum_(herk) >= MIN_N ? { n: sum_(herk), counts: herk } : { n: sum_(herk), hidden: true };

  // Akzeptanz, auch nach Gruppen
  var akzRows = rows.filter(function (r) { return has(v(r, "akzeptanz")); });
  if (akzRows.length >= MIN_N) {
    var dist = [0, 0, 0, 0, 0];
    akzRows.forEach(function (r) { var n = Number(v(r, "akzeptanz")); if (n >= 1 && n <= 5) dist[n - 1]++; });
    var byGroup = {};
    ["selbst", "eltern", "nein"].forEach(function (g) {
      var g_ = akzRows.filter(function (r) { return v(r, "herkunft") === g; }).map(function (r) { return Number(v(r, "akzeptanz")); });
      byGroup[g] = g_.length >= MIN_N ? { n: g_.length, mean: round1_(avg_(g_)) } : null;
    });
    res.akzeptanz = { n: akzRows.length, dist: dist, mean: round1_(avg_(akzRows.map(function (r) { return Number(v(r, "akzeptanz")); }))), byGroup: byGroup };
  } else res.akzeptanz = { n: akzRows.length, hidden: true };

  // Hürden
  var baRows = rows.map(function (r) { return String(v(r, "barrieren") || ""); }).filter(function (s) { return s.length; });
  if (baRows.length >= MIN_N) {
    var counts = {};
    ENUMS.barrieren.forEach(function (b) { counts[b] = 0; });
    baRows.forEach(function (s) { s.split(",").forEach(function (b) { if (counts.hasOwnProperty(b)) counts[b]++; }); });
    res.barrieren = { n: baRows.length, respondents: baRows.length, counts: counts };
  } else res.barrieren = { n: baRows.length, hidden: true };

  // Streitfrage
  var sf = rows.map(function (r) { return v(r, "streitfrage"); }).filter(has);
  res.streitfrage = sf.length >= MIN_N ? { n: sf.length, dist: count_(sf, ENUMS.streitfrage) } : { n: sf.length, hidden: true };

  // Sicht verändert
  var si = rows.map(function (r) { return v(r, "sicht"); }).filter(has);
  res.sicht = si.length >= MIN_N ? { n: si.length, dist: count_(si, ENUMS.sicht) } : { n: si.length, hidden: true };

  // Wissen vorher/nachher
  var paired = rows.filter(function (r) { return has(v(r, "wissen_vorher")) && has(v(r, "wissen_nachher")); });
  res.wissen = {
    paired: paired.length >= MIN_N
      ? { n: paired.length, before: round1_(avg_(paired.map(function (r) { return Number(v(r, "wissen_vorher")); }))), after: round1_(avg_(paired.map(function (r) { return Number(v(r, "wissen_nachher")); }))) }
      : { n: paired.length, hidden: true }
  };

  // Sprachen
  var spRows = rows.map(function (r) { return String(v(r, "sprachen") || ""); }).filter(function (s) { return s.length; });
  if (spRows.length >= MIN_N) {
    var lc = {};
    spRows.forEach(function (s) { s.split(",").forEach(function (l) { if (LANGS.indexOf(l) !== -1) lc[l] = (lc[l] || 0) + 1; }); });
    var all = Object.keys(lc).map(function (k) { return [k, lc[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
    res.sprachen = {
      respondents: spRows.length,
      distinct: all.length,
      top: all.filter(function (x) { return x[1] >= MIN_LANG; }).slice(0, 12),
      weitere: all.filter(function (x) { return x[1] < MIN_LANG; }).length
    };
  } else res.sprachen = { respondents: spRows.length, hidden: true };

  // Sprachpaten (nur Anzahlen)
  var ps = sheet_(SHEET_P, COLS_P).getDataRange().getValues();
  ps.shift();
  res.paten = { helfen: 0, suchen: 0 };
  ps.forEach(function (r) { if (r[1] === "helfen") res.paten.helfen++; if (r[1] === "suchen") res.paten.suchen++; });

  return res;
}

/* ---------- Hilfsfunktionen ---------- */
function ss_() {
  var ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  if (!ss) {
    var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
    if (id) ss = SpreadsheetApp.openById(id);
  }
  return ss;
}
function sheet_(name, cols) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, cols.length).setValues([cols]);
    sh.setFrozenRows(1);
    if (cols[0] === "id") sh.getRange(1, 1, sh.getMaxRows(), 1).setNumberFormat("@"); // IDs als Text speichern
  }
  return sh;
}
function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var hit = sh.getRange(2, 1, last - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : -1;
}
function count_(arr, keys) { var o = {}; keys.forEach(function (k) { o[k] = 0; }); arr.forEach(function (x) { if (o.hasOwnProperty(x)) o[x]++; }); return o; }
function sum_(o) { return Object.keys(o).reduce(function (s, k) { return s + o[k]; }, 0); }
function avg_(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
function median_(a) { var s = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function round1_(x) { return Math.round(x * 10) / 10; }
function json_(obj) { return text_(JSON.stringify(obj)); }
function text_(str) { return ContentService.createTextOutput(str).setMimeType(ContentService.MimeType.JSON); }
