/*
 * Service Worker: macht die App installierbar und offline lesbar.
 * Seiten und Skripte kommen immer zuerst frisch aus dem Netz (damit Änderungen sofort ankommen),
 * Schriften und Bilder aus dem Zwischenspeicher. Anfragen an die Datenbank laufen nie über den Speicher.
 * Nach größeren Änderungen die Versionsnummer hochzählen.
 */
var CACHE = "mhhbk-v2";
var ASSETS = [
  "./",
  "index.html",
  "css/style.css",
  "js/config.js",
  "js/data.js",
  "js/charts.js",
  "js/app.js",
  "fonts/archivo-var.woff2",
  "fonts/atkinson-next-var.woff2",
  "fonts/shantell-var.woff2",
  "img/guilloche.svg",
  "img/qr.svg",
  "img/favicon-48.png",
  "img/icon-192.png",
  "manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  var url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  var isStatic = /\.(woff2|png|svg|webmanifest)$/.test(url.pathname);
  if (isStatic) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      });
    }));
    return;
  }
  e.respondWith(
    fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
    })
  );
});
