# Gefühlt vs. echt – Migration am HHBK

**Was wissen wir am HHBK wirklich über Migration – und was glauben wir nur?**

Eine Web-App von Bavin, Abdalaziz und Eren (Klasse AIA31, Heinrich-Hertz-Berufskolleg Düsseldorf) für das Fach Gesellschaftslehre mit Geschichte.
Adresse: **https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/**

Die App ist wie ein Reisepass aufgebaut – passend zum Flyer:

- **Deckblatt** (Passeinband) mit Leitfrage.
- **8 Stationen** (Visa-Seiten): Kurz zu dir, Schätz mal, Zeitreise, Ein Morgen ohne Deutsch, Streitfrage, Chancen/Probleme/Verantwortung, Unsere Lösung, Was das HHBK denkt. Für jede Station gibt es einen Stempel.
- **Mein Pass:** 9 Stempel (Einreise + 8 Stationen), gesammelte Fachbegriffe aus dem Unterricht, Bauchgefühl-Profil. Wer über den QR-Code des Flyers kommt, hat den Einreise-Stempel „Flyer gelesen“ schon drin – genau wie auf dem Flyer gedruckt.
- **Sprachpaten:** eigene Seite mit direkter Anmeldung für beide Seiten (wer helfen will und wer Unterstützung möchte). Kurzlink: eure Adresse mit **/sprachpaten** am Ende

Die Antworten landen anonym in einer Google-Tabelle. Nach außen zeigt die App nur Zusammenfassungen. Stempel und Begriffe liegen nur im Browser der Nutzerin oder des Nutzers.

---

## Was ist in diesem Ordner?

| Datei / Ordner | Wofür |
|---|---|
| `index.html` | Alle Seiten und Texte der App |
| `css/style.css` | Das Aussehen (Farben, Schriften, Abstände) |
| `js/data.js` | **Alle Zahlen, Quizfragen und Quellen** – hier ändert ihr Inhalte |
| `js/config.js` | **Hier kommt die Adresse der Datenbank hinein** (Schritt 3) |
| `js/app.js`, `js/charts.js` | Die Programmlogik und die Diagramme |
| `apps-script/Code.gs` | Der Code für die Datenbank (wird in Google kopiert, Schritt 2) |
| `sw.js`, `manifest.webmanifest` | Machen die App auf dem Handy installierbar |
| `fonts/`, `img/` | Schriften (mit Lizenz), Icons, QR-Code, Vorschaubild |
| `sprachpaten/` | Kurzlink: leitet https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/sprachpaten direkt zur Sprachpaten-Seite |
| `flyer.html` | Druckvorlage für den Flyer (zwei A5-Flyer pro A4-Blatt) |

---

## QR-Code und Umfrage (wichtig vor dem Drucken)

- **Eure Adresse:** https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/ – der Teilen-Knopf teilt immer diese Adresse (`siteUrl` in `js/config.js`), auch wenn die App woanders geöffnet wurde. Bei einer neuen Adresse: `siteUrl` hier und `og:url`/`og:image` in `index.html` ändern.
- **QR-Code:** Flyer, Plakat und „Über das Projekt“ zeigen euren Code **scan.page/pkVd2p** (genau euer Muster). Wohin er führt, stellt ihr im scan.page-Konto ein. Ziel dort: `https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/?flyer` – dann bekommt man in der App den Einreise-Stempel „Flyer gelesen“.
- **Vor dem Drucken:** Den QR-Code einmal mit dem Handy scannen. Er muss auf eure Seite führen, nicht auf eine andere. Achtung: Viele QR-Dienste schalten Weiterleitungs-Codes nach der kostenlosen Testphase ab. Prüft in eurem scan.page-Konto, ob der Code dauerhaft läuft.
- **Umfrage:** Die Ergebnisse eurer Google-Forms-Umfrage (27 Antworten, 9. bis 12. November 2026) stehen zusammengefasst in `js/data.js` unter `umfrage`. Die App zeigt sie in Station 8 und nutzt sie als Beleg bei „Unsere Lösung“ und auf der Sprachpaten-Seite. Rohdaten mit Zeitstempeln und Freitext gehören **nicht** auf GitHub.

---

## Update: Die App ist schon online? (Version 2 hochladen, ca. 3 Minuten)

1. Im Repository `Gef-hlt-vs.-echt---Migration-am-HHBK` auf **Add file** → **Upload files**.
2. Aus dem neuen Paket hineinziehen: `index.html`, `sw.js`, `manifest.webmanifest`, `README.md`, `flyer.html` und die Ordner `css`, `js`, `img`, `sprachpaten`.
   **Wichtig:** Habt ihr in `js/config.js` schon eure Datenbank-Adresse (`apiUrl`) eingetragen? Dann diese eine Datei **nicht** mit hochladen – sonst ist die Adresse wieder leer. Falls es doch passiert: Adresse einfach wieder eintragen (Schritt 3), es gehen keine Daten verloren.
3. **Commit changes**. Nach 1 bis 2 Minuten die App öffnen und **zweimal neu laden**.
4. Die Datenbank (Google-Tabelle und Apps Script) bleibt unverändert – es müssen keine Spalten angepasst werden.

---

## Schritt 1: App auf GitHub hochladen (ca. 5 Minuten)

1. Auf **github.com** einloggen und die Organisation **migration-hhbk** öffnen (`github.com/migration-hhbk`).
2. Auf **Repositories** → **New repository** klicken.
3. Bei **Repository name** den Projektnamen eintragen (bei euch: `Gef-hlt-vs.-echt---Migration-am-HHBK`).
   (GitHub macht daraus die Adresse https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/)
4. **Public** auswählen. Keine README, keine .gitignore, keine Lizenz anhaken. → **Create repository**.
5. Auf der leeren Seite auf den Link **„uploading an existing file“** klicken.
6. Den **Inhalt** dieses Ordners (nicht den Ordner selbst!) in das Feld ziehen: also `index.html`, `README.md`, `flyer.html`, `sw.js`, `manifest.webmanifest`, `.nojekyll` und die Ordner `css`, `js`, `fonts`, `img`, `apps-script`, `sprachpaten`.
   - Tipp: Ordner per Drag & Drop funktionieren in Chrome, Edge und Firefox.
   - `.nojekyll` ist eine versteckte Datei. Wenn sie nicht mit hochgeladen wird, ist das nicht schlimm.
   - Den Ordner `sprachpaten` nicht vergessen – sonst funktioniert der Kurzlink auf dem Flyer nicht.
7. Unten auf **Commit changes** klicken und warten, bis alles hochgeladen ist.
8. Oben auf **Settings** → links **Pages**.
   Bei **Build and deployment**: Source = **Deploy from a branch**, Branch = **main**, Ordner = **/ (root)** → **Save**.
9. Nach 1 bis 3 Minuten ist die App unter **https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/** online.

Ohne Schritt 2 und 3 funktioniert schon alles – nur die Live-Ergebnisse und die Sprachpaten-Anmeldung sind noch aus.

---

## Schritt 2: Datenbank anlegen (ca. 10 Minuten)

Alles mit dem Projektkonto **migration.hhbk@gmail.com** machen.

1. Im Browser **sheets.new** öffnen. Eine leere Google-Tabelle entsteht. Oben links den Namen ändern in: `Gefühlt vs. echt – Daten`.
2. Im Menü **Erweiterungen** → **Apps Script**. Ein neuer Tab öffnet sich.
3. Oben links den Projektnamen anklicken und `Gefühlt vs echt API` nennen.
4. In der Datei `Code.gs` den vorhandenen Text komplett löschen. Dann den **gesamten Inhalt** von `apps-script/Code.gs` aus diesem Ordner hineinkopieren. Mit dem Disketten-Symbol **speichern**.
5. Oben in der Auswahlliste neben „Debuggen“ die Funktion **setup** auswählen → **Ausführen**.
6. Google fragt nach Berechtigungen:
   **Berechtigungen prüfen** → Konto migration.hhbk@gmail.com wählen → **Erweitert** → **Zu Gefühlt vs echt API (unsicher) wechseln** → **Zulassen**.
   Die Warnung erscheint, weil Google eigene Skripte nicht prüft. Das ist bei selbst geschriebenen Skripten normal – das Skript greift nur auf diese eine Tabelle zu.
7. Unten im Protokoll steht „Ausführung abgeschlossen“. In der Tabelle gibt es jetzt die Blätter **Antworten** und **Sprachpaten**.
8. Rechts oben **Bereitstellen** → **Neue Bereitstellung**.
   - Beim Zahnrad neben „Typ auswählen“ → **Web-App**.
   - Beschreibung: `Version 1`
   - Ausführen als: **Ich (migration.hhbk@gmail.com)**
   - Zugriff: **Jeder**
   - → **Bereitstellen** und, falls gefragt, noch einmal Zugriff erlauben.
9. Die **Web-App-URL** kopieren. Sie sieht so aus: `https://script.google.com/macros/s/AKfy…/exec`
10. Test: Die URL im Browser öffnen und hinten `?action=ping` anhängen. Wenn `{"ok":true, …}` erscheint, läuft die Datenbank.

---

## Schritt 3: App mit der Datenbank verbinden (ca. 2 Minuten)

1. Auf GitHub im Repository `Gef-hlt-vs.-echt---Migration-am-HHBK` die Datei **js/config.js** öffnen.
2. Rechts oben auf den **Stift** (Edit) klicken.
3. Die kopierte URL zwischen die Anführungszeichen bei `apiUrl` einfügen:
   ```js
   apiUrl: "https://script.google.com/macros/s/AKfy…/exec",
   ```
4. **Commit changes** klicken.
5. 1 bis 2 Minuten warten. Dann die App öffnen und **zweimal neu laden** (beim ersten Laden kann noch die alte Version aus dem Speicher kommen).

---

## Schritt 4: Testen vor der Präsentation

- [ ] Auf dem Handy den Rundgang einmal komplett machen – am Ende muss oben „Pass 9/9“ stehen.
- [ ] Den QR-Code auf dem Flyer scannen: In „Mein Pass“ steht dann der Einreise-Stempel „Flyer gelesen“.
- [ ] Eure Adresse mit `/sprachpaten` am Ende eintippen: Die Sprachpaten-Seite öffnet sich direkt.
- [ ] Station 8: „27 Stimmen aus dem HHBK“ erscheint mit Schätzfrage, sechs Karten und Zitaten.
- [ ] In der Google-Tabelle erscheint eine neue Zeile im Blatt **Antworten**.
- [ ] Ab 5 Teilnahmen erscheinen auf Seite 8 die Live-Ergebnisse.
- [ ] Sprachpaten-Anmeldung testen → Zeile im Blatt **Sprachpaten**.
- [ ] App installieren:
  - **iPhone:** in Safari öffnen → Teilen-Symbol → **Zum Home-Bildschirm**.
  - **Android:** in Chrome öffnen → Menü (⋮) → **App installieren** oder **Zum Startbildschirm hinzufügen**.
- [ ] **Vor dem echten Start die Testdaten löschen:** In beiden Blättern alle Zeilen ab Zeile 2 markieren → Rechtsklick → **Zeilen löschen**. Die erste Zeile (Überschriften) bleibt stehen!

Für die Präsentation: Seite 8 („Was das HHBK denkt“) aktualisiert sich alle 30 Sekunden von selbst. Ihr könnt also live zeigen, wie neue Antworten aus der Klasse hereinkommen.

---

## Inhalte ändern

- **Zahlen, Quizfragen, Quellen:** `js/data.js`. Bei jeder Zahl immer auch die Quelle anpassen.
- **Texte der Seiten:** `index.html`.
- **Fachbegriffe, Einordnungsspiel, Stempel, Willkommens-Band:** ebenfalls `js/data.js` (`terms`, `sortCards`, `stamps`, `welcome`). Neue Sprachen im Willkommens-Band bitte vorher von Muttersprachlerinnen oder Muttersprachlern prüfen lassen.
- **Wenn ihr eine Quizantwort ändert**, muss der echte Wert auch in `apps-script/Code.gs` bei `QUIZ` geändert werden (für die durchschnittliche Abweichung).
- **Nach einer Änderung am Apps-Script-Code:** **Bereitstellen** → **Bereitstellungen verwalten** → Stift → Version: **Neue Version** → **Bereitstellen**. Die URL bleibt gleich.
- Auf GitHub ändert ihr Dateien direkt im Browser (Stift-Symbol) und speichert mit **Commit changes**.

---

## Datenschutz – darauf achten

- Die Google-Tabelle **nie** öffentlich teilen. Nur Teammitglieder als Bearbeiter hinzufügen (**Freigeben** → E-Mail-Adresse eintragen).
- Die Umfrage speichert keine Namen, E-Mail- oder IP-Adressen – nur Antworten und eine Zufallsnummer pro Sitzung.
- Die App zeigt Ergebnisse erst ab 5 Antworten pro Gruppe. Sprachen mit weniger als 3 Nennungen werden zusammengefasst, damit niemand erkennbar ist.
- Sprachpaten-Anmeldungen enthalten Vornamen. Wer seine Anmeldung löschen möchte, schreibt an migration.hhbk@gmail.com – dann die Zeile löschen. Spätestens am Ende des Schuljahres alle Anmeldungen löschen, die nicht mehr gebraucht werden.
- Freitext („andere Sprache“) wird gespeichert, aber nie in der App angezeigt.

## Übergabe an die SV

Wenn das Projekt weiterlaufen soll: In GitHub unter **People** die SV als Owner einladen und im Google-Konto Passwort, Telefonnummer und Wiederherstellungs-E-Mail auf die SV ändern.

So läuft das Sprachpaten-Netz für die SV:
- Aus dem Blatt „Sprachpaten“ Paare nach Sprache und Klasse bilden und beiden über die Klasse Bescheid geben.
- Für jede Sprache eine Gruppe einrichten (am besten Instagram, weil dort Nutzernamen statt Telefonnummern sichtbar sind) und selbst Admin bleiben.
- Nummern oder Insta-Namen nicht in die Tabelle schreiben – die tauschen die Paare selbst aus.
- Nach acht Wochen die Akzeptanz-Frage erneut stellen und mit dem Ausgangswert vergleichen.

---

## Häufige Probleme

| Problem | Lösung |
|---|---|
| Seite zeigt „404“ | Adresse genau https://migration-hhbk.github.io/Gef-hlt-vs.-echt---Migration-am-HHBK/ ? Pages in den Settings eingeschaltet? 3 Minuten warten. |
| Live-Ergebnisse erscheinen nicht | Steht die URL richtig in `js/config.js` und endet sie auf `/exec`? Zugriff bei der Bereitstellung auf **Jeder**? Die App zweimal neu laden. |
| „Die Ergebnisse konnten nicht geladen werden“ | `…/exec?action=ping` im Browser testen. Kommt eine Google-Anmeldeseite, ist der Zugriff nicht auf **Jeder** gestellt. |
| Änderungen am Skript wirken nicht | Neue Version bereitstellen (siehe „Inhalte ändern“). |
| App zeigt noch die alte Version | App schließen und neu öffnen oder zweimal neu laden. |

---

## Technik in Kürze (für Rückfragen in der Präsentation)

- **Frontend:** HTML, CSS und JavaScript ohne Framework, gehostet kostenlos auf GitHub Pages.
- **Datenbank:** Google-Tabelle, angesprochen über eine Google-Apps-Script-Web-App (`doPost` speichert, `doGet` liefert nur Zusammenfassungen).
- **Sicherheit:** Alle Eingaben werden auf dem Server geprüft (erlaubte Werte, Zahlenbereiche, Länge). Formeln in der Tabelle werden verhindert, Spam-Programme laufen in eine unsichtbare Falle.
- **Datenschutz:** Anonyme Zufalls-ID, Mindestgruppengröße 5, Schriften liegen auf dem eigenen Server (keine Verbindung zu Google Fonts), keine Tracker.
- **Installierbar (PWA):** Ein Service Worker speichert die App, sodass sie auch ohne Internet startet.
- **Spielerisch, aber ehrlich:** Stempelpass (der erste Stempel ist schon drin), eine Frage nach der anderen, Belohnung nach jeder Station, Zahlen zur Teilnahme nur, wenn sie stimmen (ab 5). Keine erfundenen Zähler, keine künstliche Verknappung. Wer „Bewegung reduzieren“ eingestellt hat, sieht keine Animationen.

## Quellen und Lizenzen

Alle Quellen stehen in der App unter „Über das Projekt“ und in `js/data.js`.
Schriften: Archivo, Atkinson Hyperlegible Next und Shantell Sans – SIL Open Font License 1.1 (Lizenztexte im Ordner `fonts/`).
