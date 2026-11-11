/*
 * Inhalte der App "Gefühlt vs. echt"
 * ------------------------------------------------------------
 * Hier stehen alle Zahlen, Fragen und Quellen an einer Stelle.
 * Wenn ihr eine Zahl aktualisiert: Wert UND Quelle ändern.
 * Stand der Recherche: 9. November 2026.
 */
window.MHHBK_DATA = {

  /* Stationen des Laufzettels (Reihenfolge = Seitenzahl) */
  stations: [
    { slug: "du",          title: "Kurz zu dir" },
    { slug: "schaetzen",   title: "Schätz mal" },
    { slug: "zeitreise",   title: "Zeitreise" },
    { slug: "morgen",      title: "Ein Morgen ohne Deutsch" },
    { slug: "streitfrage", title: "Streitfrage" },
    { slug: "abwaegen",    title: "Chancen, Probleme, Verantwortung" },
    { slug: "loesung",     title: "Unsere Lösung" },
    { slug: "ergebnisse",  title: "Was das HHBK denkt" }
  ],

  /* ---------- Station 2: Schätzfragen ---------- */
  quiz: [
    {
      id: "de",
      question: "Wie viel Prozent der Menschen in Deutschland haben eine Einwanderungsgeschichte?",
      hint: "Gemeint ist: selbst eingewandert oder beide Eltern eingewandert.",
      unit: "%", min: 0, max: 100, step: 1, real: 26.3,
      stampSource: "Destatis 2025",
      explain: "26,3 % – das sind rund 21,8 Millionen Menschen. 19,8 % sind selbst eingewandert, 6,5 % sind in Deutschland geborene Kinder von zwei eingewanderten Eltern. Menschen mit Einwanderungsgeschichte sind im Schnitt 38 Jahre alt, alle anderen fast 48.",
      note: "Wer nur einen eingewanderten Elternteil hat, zählt hier nicht mit. Nach der älteren, weiteren Definition „Migrationshintergrund“ waren es 2024 30,4 %.",
      source: "Statistisches Bundesamt, Mikrozensus 2025, Pressemitteilung Nr. 128 vom 13. April 2026; bpb, Zahlen und Fakten: Migrationshintergrund"
    },
    {
      id: "muslime",
      question: "Wie viel Prozent der Menschen in Deutschland sind Muslime?",
      hint: "Alle Altersgruppen zusammen.",
      unit: "%", min: 0, max: 100, step: 1, real: 6.6,
      stampSource: "BAMF-Studie",
      explain: "Rund 6,6 % – etwa 5,5 Millionen Menschen. Fast die Hälfte von ihnen (47 %) hat die deutsche Staatsangehörigkeit. In der internationalen Ipsos-Studie „Perils of Perception“ schätzten Befragte in Deutschland den Anteil im Schnitt auf 21 % – mehr als dreimal so hoch.",
      note: "Die Zahl ist eine Hochrechnung des Bundesamts für Migration und Flüchtlinge (5,3 bis 5,6 Millionen, Stand 2019).",
      source: "BAMF, Forschungsbericht 38 „Muslimisches Leben in Deutschland 2020“; Ipsos, Perils of Perception 2018"
    },
    {
      id: "pflege",
      question: "Wie viel Prozent der Pflegekräfte in Deutschland haben keinen deutschen Pass?",
      hint: "Kranken- und Altenpflege zusammen.",
      unit: "%", min: 0, max: 100, step: 1, real: 20,
      stampSource: "Arbeitsagentur 2025",
      explain: "Rund 20 % – jede fünfte Pflegekraft hat eine ausländische Staatsangehörigkeit, insgesamt rund 353.000 Menschen. Zehn Jahre zuvor waren es etwa 7 %. Seit 2022 wächst die Zahl der Pflegekräfte nur noch durch ausländische Beschäftigte.",
      note: "Viele ausländische Pflegekräfte arbeiten auf Helferniveau, obwohl sie höher qualifiziert sind – ihre Abschlüsse werden oft nicht voll genutzt.",
      source: "Bundesagentur für Arbeit, Presseinfo Nr. 16 vom 8. Mai 2026 und „Arbeitsmarktsituation in Pflegeberufen“ (Mai 2026); bpb-Kurzdossier zu internationalen Pflegekräften"
    },
    {
      id: "ddorf",
      question: "Wie viel Prozent der Menschen in Düsseldorf haben einen Migrationshintergrund?",
      hint: "Unsere Stadt, alle Einwohnerinnen und Einwohner.",
      unit: "%", min: 0, max: 100, step: 1, real: 45.3,
      stampSource: "Stadt Düsseldorf",
      explain: "45,3 % – fast jede zweite Person in unserer Stadt (Stand Ende 2023). Ein Viertel (25,4 %) hat keinen deutschen Pass.",
      note: "Die Stadt zählt auch Kinder mit nur einem eingewanderten Elternteil mit. Der Wert ist deshalb nicht direkt mit Frage 1 vergleichbar.",
      source: "Landeshauptstadt Düsseldorf, Amt für Statistik und Wahlen: Demografiemonitoring 2014 bis 2023 (Statistische Informationen Nr. 321)"
    },
    {
      id: "schule",
      question: "Wie viel Prozent der Schülerinnen und Schüler in NRW haben eine Zuwanderungsgeschichte?",
      hint: "Alle allgemeinbildenden und beruflichen Schulen, Schuljahr 2025/26.",
      unit: "%", min: 0, max: 100, step: 1, real: 44.6,
      stampSource: "IT.NRW 2025/26",
      explain: "44,6 % – rund 1,1 Millionen Schülerinnen und Schüler. An beruflichen Schulen wie dem HHBK sind es 37,6 %. Fünf Jahre vorher lag der Anteil insgesamt noch bei 39,4 %.",
      note: "Zuwanderungsgeschichte heißt in der Schulstatistik zum Beispiel: selbst im Ausland geboren und zugewandert, ein Elternteil im Ausland geboren oder Deutsch ist nicht die Familiensprache.",
      source: "IT.NRW, Schulstatistik 2025/26 (berichtet von news4teachers, September 2026, und ms-aktuell)"
    },
    {
      id: "auswanderung",
      question: "1835 bis 1900: Wie viele Menschen sind aus Deutschland nach Übersee ausgewandert?",
      hint: "Vor allem nach Amerika. Schätz in Millionen.",
      unit: "Mio.", min: 0, max: 10, step: 0.1, real: 4.8,
      stampSource: "Unterricht M1",
      explain: "Rund 4,8 Millionen. Deutschland war lange ein Auswanderungsland. Push-Faktoren: Armut, Missernten, fehlende Arbeit. Pull-Faktoren: Land, Arbeit und Freiheit in Amerika. Gleichzeitig zogen von 1860 bis 1900 etwa 1,7 Millionen Menschen aus den preußischen Ostprovinzen in die wachsenden Industriestädte.",
      note: "Wer heute über Zuwanderung spricht, spricht auch über die eigene Familiengeschichte vieler Deutscher.",
      source: "Unterrichtsmaterial M1 „Deutschland – Entwicklung 1871–1918“ (Westermann-Geschichtskarte)"
    }
  ],

  /* ---------- Sprachen (Station 1 und Sprachpaten) ---------- */
  languages: [
    ["de", "Deutsch"], ["en", "Englisch"], ["tr", "Türkisch"], ["ar", "Arabisch"],
    ["ku", "Kurdisch"], ["pl", "Polnisch"], ["ru", "Russisch"], ["uk", "Ukrainisch"],
    ["el", "Griechisch"], ["it", "Italienisch"], ["es", "Spanisch"], ["fr", "Französisch"],
    ["fa", "Persisch / Dari"], ["ps", "Paschtu"], ["sq", "Albanisch"], ["sh", "Bosnisch / Kroatisch / Serbisch"],
    ["ro", "Rumänisch"], ["bg", "Bulgarisch"], ["pt", "Portugiesisch"], ["ja", "Japanisch"],
    ["zh", "Chinesisch"], ["vi", "Vietnamesisch"], ["hi", "Hindi"], ["ur", "Urdu"],
    ["ta", "Tamil"], ["ber", "Tamazight (Berberisch)"], ["ti", "Tigrinya"], ["so", "Somali"],
    ["nl", "Niederländisch"], ["hu", "Ungarisch"]
  ],
  languagesShown: 12, // so viele Chips sind sofort sichtbar, der Rest unter "Mehr Sprachen"

  /* ---------- Antwortoptionen ---------- */
  herkunft: [
    ["selbst", "Ja, ich bin selbst eingewandert"],
    ["eltern", "Ja, meine Eltern oder Großeltern sind eingewandert"],
    ["nein", "Nein"],
    ["keine_angabe", "Möchte ich nicht sagen"]
  ],
  barrieren: [
    ["sprache", "Sprache"],
    ["freundschaften", "Freundschaften finden"],
    ["mitschueler", "Umgang mit Mitschülerinnen und Mitschülern"],
    ["lehrkraefte", "Umgang mit Lehrkräften"],
    ["erwartungen", "Unterschiedliche Erwartungen und Werte"],
    ["missverstaendnisse", "Missverständnisse"],
    ["keine", "Ich habe keine solchen Hürden erlebt"]
  ],
  streitfrage: [
    ["dazu", "Gehört dazu"],
    ["eher_dazu", "Eher dazu"],
    ["unentschieden", "Unentschieden"],
    ["eher_nicht", "Eher nicht"],
    ["nicht_dazu", "Gehört nicht dazu"],
    ["keine_angabe", "Ich lege mich nicht fest"]
  ],
  sicht: [
    ["gar_nicht", "Gar nicht"],
    ["etwas", "Etwas"],
    ["deutlich", "Deutlich"]
  ],

  /* ---------- Station 4: Ein Morgen ohne Deutsch (fiktiv) ----------
   * Wörter in {geschweiften|B1} Klammern brauchen mindestens dieses Sprachniveau.
   * Alle anderen Wörter versteht man schon mit A1.
   */
  levels: ["A1", "A2", "B1", "B2", "C1"],
  levelNames: [
    "Anfang: einzelne Wörter und ganz einfache Sätze.",
    "Grundlagen: Alltagssätze, wenn langsam gesprochen wird.",
    "Mittelstufe: Du verstehst das Wichtigste im Unterricht.",
    "Fortgeschritten: Auch Schulsprache wird verständlich.",
    "Fast fließend: Jetzt verstehst du sogar den Slang in der Pause."
  ],
  moments: [
    {
      time: "7:52 Uhr",
      place: "Aushang am Eingang",
      kind: "notice",
      text: "Willkommen! Die {neuen|A2} Klassen {treffen|A2} sich heute {ausnahmsweise|B2} in Raum B 2.07. Bitte {Schülerausweis|B1} und {Stundenplan|A2} {bereithalten|B2}. Wer zu {spät|A2} kommt, {meldet|B1} sich im {Sekretariat|B1}.",
      prompt: "Was machst du?",
      choices: [
        {
          label: "Einfach der Gruppe hinterhergehen",
          concept: "Konformität",
          feedback: "Du passt dich an, um nicht aufzufallen. Das kann klappen – heute landest du aber in der falschen Klasse. Anpassen aus Angst vor Nachteilen nennen wir im Unterricht Konformität."
        },
        {
          label: "Jemanden ansprechen",
          concept: "Konformität",
          feedback: "Mutig! Die Antwort kommt schnell und voller Abkürzungen. Du nickst, obwohl du nichts verstanden hast – lieber nicken als auffallen. Auch das ist Konformität."
        },
        {
          label: "Den Aushang fotografieren und übersetzen",
          concept: "Normen",
          feedback: "Clever, aber es dauert. Du kommst zehn Minuten zu spät. Pünktlichkeit ist eine Norm – der erste Eindruck bei der Lehrkraft: unpünktlich."
        }
      ]
    },
    {
      time: "9:40 Uhr",
      place: "Im Unterricht",
      kind: "speech",
      speaker: "Lehrkraft",
      text: "Für Montag {bearbeitet|B1} ihr bitte M3, {Aufgabe|A2} 2a. Das {fließt|C1} in die {sonstige|C1} {Mitarbeit|B2} ein. Wer {Fragen|A2} hat, {meldet|B1} sich – {ansonsten|B2} bis Montag!",
      prompt: "Was machst du?",
      choices: [
        {
          label: "Vor der ganzen Klasse nachfragen",
          concept: "Negative Sanktionen",
          feedback: "Alle drehen sich zu dir um, jemand kichert. Schon ein kleines Lachen ist eine negative Sanktion: Beim nächsten Mal bleibst du lieber still."
        },
        {
          label: "Nach der Stunde allein zur Lehrkraft gehen",
          concept: "Integration als wechselseitiger Prozess",
          feedback: "Die Lehrkraft erklärt es dir langsam und schreibt dir die Aufgabe auf. Es kostet Überwindung – und zeigt, was Integration als wechselseitiger Prozess heißt: Beide Seiten bewegen sich."
        },
        {
          label: "Nichts sagen",
          concept: "Kulturelles Kapital (Bourdieu)",
          feedback: "Am Montag fehlt deine Aufgabe, die Note für die Mitarbeit sinkt – nicht wegen deines Könnens, sondern wegen der Sprache. Ohne das passende kulturelle Kapital ist der Start schwerer."
        }
      ]
    },
    {
      time: "11:15 Uhr",
      place: "In der Pause",
      kind: "chat",
      speaker: "Jemand aus deiner Klasse",
      text: "{Digga|C1}, kommst du mit in die {Mensa|B1}? Oder {chillst|C1} du hier {allein|A2}?",
      prompt: "Was machst du?",
      choices: [
        {
          label: "Lächeln und mitgehen",
          concept: "Anerkennung",
          feedback: "Du verstehst nur die Hälfte, aber du bist dabei. Anerkennung ist eines der stärksten Motive für unser Handeln – dazuzugehören fühlt sich gut an."
        },
        {
          label: "Sagen: „Sorry, ich verstehe noch nicht so gut Deutsch.“",
          concept: "Anerkennung",
          feedback: "Eine erklärt es dir langsamer, einer verliert das Interesse. Ehrlichkeit öffnet Türen – aber nur, wenn die anderen sie offen halten."
        },
        {
          label: "Allein bleiben",
          concept: "Habitus",
          feedback: "Sicher, aber einsam. „Gleich und gleich gesellt sich gern“ – ohne Anstoß von außen bleiben Gruppen meistens unter sich."
        }
      ]
    }
  ],

  /* ---------- Quellen (Seite "Über das Projekt") ---------- */
  sources: [
    ["Statistisches Bundesamt (Destatis): 21,8 Millionen Menschen in Deutschland mit Einwanderungsgeschichte im Jahr 2025. Pressemitteilung Nr. 128 vom 13. April 2026.", "https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/04/PD26_128_125.html"],
    ["Statistisches Bundesamt (Destatis): 332 500 Einbürgerungen im Jahr 2025. Pressemitteilung Nr. 186 vom 3. Juni 2026.", "https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_186_125.html"],
    ["Bundeszentrale für politische Bildung (bpb): Zahlen und Fakten – Bevölkerung mit Migrationshintergrund.", "https://www.bpb.de/nachschlagen/zahlen-und-fakten/soziale-situation-in-deutschland/61646/migrationshintergrund"],
    ["Bundesagentur für Arbeit: Tag der Pflege – Jede fünfte Pflegekraft hat ausländische Staatsangehörigkeit. Presseinfo Nr. 16 vom 8. Mai 2026.", "https://www.arbeitsagentur.de/presse/2026-16-tag-der-pflege-jede-fuenfte-pflegekraft-hat-auslaendische-staatsangehoerigkeit"],
    ["bpb: Die Bedeutung internationaler Pflegekräfte sowie Ärztinnen und Ärzte in Deutschland (Kurzdossier).", "https://www.bpb.de/themen/migration-integration/kurzdossiers/581372/die-bedeutung-internationaler-pflegekraefte-sowie-aerztinnen-und-aerzte-in-deutschland/"],
    ["BAMF: Muslimisches Leben in Deutschland 2020. Forschungsbericht 38, Studie im Auftrag der Deutschen Islam Konferenz.", "https://www.bamf.de/SharedDocs/Anlagen/DE/Forschung/Forschungsberichte/fb38-muslimisches-leben.pdf"],
    ["Ipsos: Perils of Perception 2018 – Deutsche schätzen soziale Realitäten häufig falsch ein.", "https://www.ipsos.com/de-de/node/485611"],
    ["Landeshauptstadt Düsseldorf, Amt für Statistik und Wahlen: Demografiemonitoring 2014 bis 2023.", "https://e-pflicht.ulb.hhu.de/download/pdf/428804"],
    ["news4teachers: Knapp die Hälfte der Schüler in Nordrhein-Westfalen hat eine Migrationsgeschichte (Daten: IT.NRW), September 2026.", "https://www.news4teachers.de/2026/09/knapp-die-haelfte-der-schueler-in-nordrhein-westfalen-hat-eine-migrationsgeschichte/"],
    ["bpb: Gastarbeiter (Lexikon) und Dossier „1961: Anwerbeabkommen mit der Türkei“.", "https://www.bpb.de/kurz-knapp/hintergrund-aktuell/342651/das-deutsch-tuerkische-anwerbeabkommen-von-1961/"],
    ["Institut für Arbeitsmarkt- und Berufsforschung (IAB): IAB-Kurzbericht 25/2021 zum Arbeitskräfteangebot – jährlich rund 400.000 Nettozuwanderung nötig (zitiert nach Deutsche Handwerks Zeitung).", "https://www.deutsche-handwerks-zeitung.de/?p=212632"],
    ["Bertelsmann Stiftung: Zuwanderung und Arbeitsmarkt – eine Analyse für Deutschland und die Bundesländer (2024).", "https://www.bertelsmann-stiftung.de/en/themen/aktuelle-meldungen/2024/november/ohne-zuwanderung-geht-die-zahl-der-arbeitskraefte-in-deutschland-bis-2040-deutlich-zurueck"],
    ["Christian Wulff: Rede zum Tag der Deutschen Einheit, Bremen, 3. Oktober 2010 (zitiert nach KNA/cibedo).", "https://cibedo.de/?p=13332"],
    ["Horst Seehofer im Interview mit der Bild-Zeitung, 16. März 2018 (zitiert nach evangelisch.de/epd), mit Einordnung von Hans Michael Heinig.", "https://www.evangelisch.de/inhalte/149162/16-03-2018/seehofer-loest-neue-debatte-ueber-islam-aus"],
    ["Grundgesetz für die Bundesrepublik Deutschland, Artikel 3 und 4.", "https://www.gesetze-im-internet.de/gg/"],
    ["Max Frisch: „Überfremdung I“, Vorwort zu „Siamo italiani“ (1965), zitiert nach Beatrice Sandberg.", "https://core.ac.uk/download/14514013.pdf"],
    ["Bundestag beschließt Ende der Einbürgerung nach drei Jahren, 8. Oktober 2025 (Bericht migrando.de).", "https://migrando.de/news/einbuergerung/turbo-einbuergerung-offiziell-abgeschafft-bundestag-stimmt-gegen-deutschen-pass-nach-drei-jahren/"],
    ["Gordon W. Allport: The Nature of Prejudice (1954) – Kontakthypothese.", ""],
    ["Unterrichtsmaterial GL (HHBK): „Migration – ein ewiges Streitthema?“, Konformität (Familie, Peergroup, Medien, Schule), Sozialisation & Identität I, Habitus, Bourdieu-Kapitalsorten, Zunftwesen, Durkheim (Transformation der Arbeitswelt), Bildungsungleichheit (El-Mafaalani), Gespaltene Gesellschaft (Mau), Kiribati, Kaiserreich M1–M2, Führerprinzip und Volksgemeinschaft.", ""]
  ]
};
