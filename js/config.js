/*
 * Einstellungen der App
 * ------------------------------------------------------------
 * apiUrl: Hier kommt die Web-App-URL aus Google Apps Script hinein
 *         (endet auf /exec). Anleitung: README.md, Schritt 3.
 *         Solange apiUrl leer ist, läuft die App ohne Datenbank:
 *         Alles funktioniert, nur Live-Ergebnisse und Anmeldungen fehlen.
 */
window.MHHBK_CONFIG = {
  apiUrl: "",
  siteUrl: "https://migration-hhbk.github.io/",
  contact: "migration.hhbk@gmail.com",
  team: "Bavin, Abdalaziz und Eren",
  klasse: "AIA31",
  minN: 5 // Ergebnisse einer Gruppe erscheinen erst ab so vielen Antworten
};
