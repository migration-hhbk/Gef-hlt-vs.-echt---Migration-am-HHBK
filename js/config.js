/*
 * Einstellungen der App
 * ------------------------------------------------------------
 * apiUrl: Hier kommt die Web-App-URL aus Google Apps Script hinein
 *         (endet auf /exec). Anleitung: README.md, Schritt 3.
 *         Solange apiUrl leer ist, läuft die App ohne Datenbank:
 *         Alles funktioniert, nur Live-Ergebnisse und Anmeldungen fehlen.
 */
window.MHHBK_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbz9oavxUCo03Srmcxv24oMHk6i7bUKVEyjwGrHdts8iTnRoE8Kxs_KspRhtBm54o2zNHA/exec",
  siteUrl: "https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/", // eure Website: Teilen-Links zeigen immer hierhin
  qrUrl: "https://scan.page/pkVd2p", // euer QR-Code (Flyer, Plakat, „Über das Projekt“) – Ziel im scan.page-Konto: siteUrl + ?flyer
  contact: "migration.hhbk@gmail.com",
  team: "Bavin, Abdalaziz und Eren",
  klasse: "AIA31",
  minN: 5 // Ergebnisse einer Gruppe erscheinen erst ab so vielen Antworten
};
