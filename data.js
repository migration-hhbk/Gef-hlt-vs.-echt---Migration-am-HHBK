/*
 * Inhalte der App "Gefühlt vs. echt"
 * ------------------------------------------------------------
 * Hier stehen alle Zahlen, Fragen und Quellen an einer Stelle.
 * Wenn ihr eine Zahl aktualisiert: Wert UND Quelle ändern.
 * Stand der Recherche: 9. November 2026.
 */
window.MHHBK_DATA = {

  /* Stationen des Passes (Reihenfolge = Seitenzahl). min = ungefähre Dauer in Minuten.
   * Zusammen mit dem Einreise-Stempel ergibt das 9 Stempel – genau wie auf dem Flyer. */
  stations: [
    { slug: "du",          title: "Kurz zu dir", min: 0.5 },
    { slug: "schaetzen",   title: "Schätz mal", min: 2 },
    { slug: "zeitreise",   title: "Zeitreise", min: 1 },
    { slug: "morgen",      title: "Ein Morgen ohne Deutsch", min: 1 },
    { slug: "streitfrage", title: "Streitfrage", min: 1 },
    { slug: "abwaegen",    title: "Chancen, Probleme, Verantwortung", min: 1 },
    { slug: "loesung",     title: "Unsere Lösung", min: 1 },
    { slug: "ergebnisse",  title: "Was das HHBK denkt", min: 0.5 }
  ],

  /* Stempel im Pass. word = Hauptwort auf dem Stempel, small = kleine Zeile darüber. */
  stamps: {
    einreise:    { color: "#5B3C9F", shape: "rect",  rot: -7 },
    du:          { word: "Vorgestellt", color: "#1C7FA3", shape: "round", rot: -9 },
    schaetzen:   { word: "Geschätzt",   color: "#5B3C9F", shape: "rect",  rot: 6 },
    zeitreise:   { word: "Zeitreise",   color: "#8A4B2A", shape: "round", rot: 11 },
    morgen:      { word: "Überstanden", color: "#2B704F", shape: "rect",  rot: -5 },
    streitfrage: { word: "Bezogen", small: "Stellung", color: "#A33434", shape: "round", rot: -13 },
    abwaegen:    { word: "Abgewogen",   color: "#6B1E2E", shape: "rect",  rot: 8 },
    loesung:     { word: "Gefunden", small: "Lösung", color: "#2B5C8A", shape: "round", rot: -6 },
    ergebnisse:  { word: "Mitgeredet",  color: "#7A5A12", shape: "round", rot: 9 }
  },

  /* ---------- Station 2: Schätzfragen ---------- */
  quiz: [
    {
      id: "de",
      question: "Wie viel Prozent der Menschen in Deutschland haben eine Einwanderungsgeschichte?",
      hint: "Gemeint ist: selbst eingewandert oder beide Eltern eingewandert.",
      unit: "%", min: 0, max: 100, step: 1, real: 26.3,
      stampSource: "Destatis 2025", term: "demografie",
      explain: "26,3 % – das sind rund 21,8 Millionen Menschen. 19,8 % sind selbst eingewandert, 6,5 % sind in Deutschland geborene Kinder von zwei eingewanderten Eltern. Menschen mit Einwanderungsgeschichte sind im Schnitt 38 Jahre alt, alle anderen fast 48.",
      note: "Wer nur einen eingewanderten Elternteil hat, zählt hier nicht mit. Nach der älteren, weiteren Definition „Migrationshintergrund“ waren es 2024 30,4 %.",
      source: "Statistisches Bundesamt, Mikrozensus 2025, Pressemitteilung Nr. 128 vom 13. April 2026; bpb, Zahlen und Fakten: Migrationshintergrund"
    },
    {
      id: "muslime",
      question: "Wie viel Prozent der Menschen in Deutschland sind Muslime?",
      hint: "Alle Altersgruppen zusammen.",
      unit: "%", min: 0, max: 100, step: 1, real: 6.6,
      stampSource: "BAMF-Studie", term: "sozialisation",
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
      stampSource: "Unterricht M1", term: "push_pull",
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
          concept: "Konformität", term: "konformitaet",
          feedback: "Du passt dich an, um nicht aufzufallen. Das kann klappen – heute landest du aber in der falschen Klasse. Anpassen aus Angst vor Nachteilen nennen wir im Unterricht Konformität."
        },
        {
          label: "Jemanden ansprechen",
          concept: "Konformität", term: "konformitaet",
          feedback: "Mutig! Die Antwort kommt schnell und voller Abkürzungen. Du nickst, obwohl du nichts verstanden hast – lieber nicken als auffallen. Auch das ist Konformität."
        },
        {
          label: "Den Aushang fotografieren und übersetzen",
          concept: "Normen", term: "normen",
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
          concept: "Negative Sanktionen", term: "sanktionen",
          feedback: "Alle drehen sich zu dir um, jemand kichert. Schon ein kleines Lachen ist eine negative Sanktion: Beim nächsten Mal bleibst du lieber still."
        },
        {
          label: "Nach der Stunde allein zur Lehrkraft gehen",
          concept: "Integration als wechselseitiger Prozess", term: "integration",
          feedback: "Die Lehrkraft erklärt es dir langsam und schreibt dir die Aufgabe auf. Es kostet Überwindung – und zeigt, was Integration als wechselseitiger Prozess heißt: Beide Seiten bewegen sich."
        },
        {
          label: "Nichts sagen",
          concept: "Kulturelles Kapital (Bourdieu)", term: "kapital",
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
          concept: "Anerkennung", term: "anerkennung",
          feedback: "Du verstehst nur die Hälfte, aber du bist dabei. Anerkennung ist eines der stärksten Motive für unser Handeln – dazuzugehören fühlt sich gut an."
        },
        {
          label: "Sagen: „Sorry, ich verstehe noch nicht so gut Deutsch.“",
          concept: "Anerkennung", term: "anerkennung",
          feedback: "Eine erklärt es dir langsamer, einer verliert das Interesse. Ehrlichkeit öffnet Türen – aber nur, wenn die anderen sie offen halten."
        },
        {
          label: "Allein bleiben",
          concept: "Habitus", term: "habitus",
          feedback: "Sicher, aber einsam. „Gleich und gleich gesellt sich gern“ – ohne Anstoß von außen bleiben Gruppen meistens unter sich."
        }
      ]
    }
  ],

  /* ---------- Fachbegriffe für die Sammlung im Pass ----------
   * Alle Begriffe stammen aus unseren GL-Unterrichtseinheiten.
   * where = Station, an der man den Begriff am sichersten findet.
   */
  terms: {
    soziale_schliessung: { name: "Soziale Schließung", where: "zeitreise",
      def: "Eine Gruppe sichert ihre Vorteile, indem sie andere ausschließt – zum Beispiel über Herkunft, Namen oder Abschlüsse." },
    push_pull: { name: "Push- und Pull-Faktoren", where: "zeitreise",
      def: "Push-Faktoren drängen Menschen aus ihrem Land, etwa Armut oder Krieg. Pull-Faktoren ziehen sie an einen Ort, etwa Arbeit oder Sicherheit." },
    binnenwanderung: { name: "Binnenwanderung und Urbanisierung", where: "zeitreise",
      def: "Menschen ziehen innerhalb eines Landes um, meist vom Land in die Stadt. Die Städte wachsen – wie Düsseldorf im Kaiserreich." },
    volksgemeinschaft: { name: "Volksgemeinschaft", where: "zeitreise",
      def: "Propagandabegriff der Nationalsozialisten: Zugehörigkeit wurde über Ausschluss bestimmt. Wer nicht dazugehören sollte, wurde entrechtet und verfolgt." },
    pluralismus: { name: "Pluralismus", where: "zeitreise",
      def: "Verschiedene Meinungen, Interessen und Lebensweisen dürfen nebeneinander bestehen und offen miteinander streiten." },
    demografie: { name: "Demografischer Wandel", where: "abwaegen",
      def: "Die Bevölkerung wird älter, und es gibt weniger junge Menschen, die arbeiten. Zuwanderung bremst diese Entwicklung." },
    konformitaet: { name: "Konformität", where: "morgen",
      def: "Sich an die Erwartungen einer Gruppe anpassen – oft, um nicht aufzufallen oder Nachteile zu vermeiden." },
    normen: { name: "Normen", where: "morgen",
      def: "Regeln, was in einer Gruppe als richtig gilt – geschrieben oder ungeschrieben, zum Beispiel Pünktlichkeit." },
    sanktionen: { name: "Positive und negative Sanktionen", where: "morgen",
      def: "Belohnung oder Bestrafung, mit der eine Gruppe Verhalten lenkt. Schon ein Auslachen ist eine negative Sanktion." },
    integration: { name: "Integration", where: "morgen",
      def: "Teilhabe an Bildung, Arbeit, Wohnen und Politik. Ein wechselseitiger Prozess: Beide Seiten bewegen sich." },
    kapital: { name: "Kapitalsorten (Bourdieu)", where: "morgen",
      def: "Ökonomisches Kapital (Geld), kulturelles Kapital (Bildung, Sprache, Abschlüsse) und soziales Kapital (Beziehungen) bestimmen, welche Chancen jemand hat." },
    anerkennung: { name: "Anerkennung", where: "morgen",
      def: "Von anderen wertgeschätzt werden. Der Wunsch danach ist eines der stärksten Motive für unser Handeln." },
    habitus: { name: "Habitus", where: "morgen",
      def: "Die verinnerlichte Art zu denken, zu sprechen und sich zu verhalten. Deshalb gilt oft: „Gleich und gleich gesellt sich gern.“" },
    triggerpunkte: { name: "Triggerpunkte", where: "streitfrage",
      def: "Stellen in einer Debatte, an denen Gefühle hochkochen und der Streit eskaliert – beschrieben vom Soziologen Steffen Mau." },
    sozialisation: { name: "Medien als Sozialisationsinstanz", where: "schaetzen",
      def: "Neben Familie, Schule und Freundeskreis prägen auch Medien, was wir für normal und wahr halten – auch unser Bild von Migration." },
    solidaritaet: { name: "Organische Solidarität (Durkheim)", where: "abwaegen",
      def: "In einer arbeitsteiligen Gesellschaft hält gerade die Verschiedenheit zusammen, weil alle auf die Fähigkeiten der anderen angewiesen sind." },
    bildungsungleichheit: { name: "Bildungsungleichheit", where: "abwaegen",
      def: "Bildungserfolg hängt in Deutschland stark von der Herkunft ab – ein Thema des Soziologen Aladin El-Mafaalani." },
    kontakthypothese: { name: "Kontakthypothese (Allport)", where: "loesung",
      def: "Kontakt zwischen Gruppen baut Vorurteile ab – wenn er auf Augenhöhe passiert, ein gemeinsames Ziel hat und unterstützt wird." }
  },

  /* ---------- Station 6: Einordnungsspiel ----------
   * team = unsere Einordnung: chance, problem oder beides. Es gibt kein Richtig oder Falsch.
   */
  sortCards: [
    { id: "schaetzung", team: "problem", term: "triggerpunkte",
      text: "Befragte in Deutschland schätzen den Anteil der Muslime im Schnitt mehr als dreimal so hoch, wie er ist.",
      why: "Wer falsche Zahlen im Kopf hat, streitet über ein anderes Land. An solchen Triggerpunkten kochen Gefühle hoch, und Fakten kommen kaum noch durch.",
      source: "Ipsos 2018; BAMF 2021" },
    { id: "pflege", team: "chance", term: "solidaritaet",
      text: "Jede fünfte Pflegekraft in Deutschland hat keinen deutschen Pass.",
      why: "Ohne sie liefe die Pflege nicht: Seit 2022 wächst sie nur noch durch ausländische Beschäftigte. Arbeitsteilung macht uns voneinander abhängig – Durkheim nennt das organische Solidarität.",
      source: "Bundesagentur für Arbeit 2026" },
    { id: "neue", team: "beides", term: "integration",
      text: "Viele Neue am HHBK sprechen noch wenig Deutsch.",
      why: "Ein Problem, wenn niemand hilft – dann verlieren sie schnell den Anschluss. Eine Chance, weil sie Sprachen mitbringen. Was daraus wird, liegt auch an uns: Integration ist ein wechselseitiger Prozess.",
      source: "Eigene Umfrage am HHBK, November 2026: 13 von 26 nennen Kommunikation und Sprache als Barriere" },
    { id: "abschluesse", team: "problem", term: "kapital",
      text: "Viele Abschlüsse aus dem Ausland werden in Deutschland erst spät oder gar nicht anerkannt.",
      why: "Kulturelles Kapital verliert an der Grenze seinen Wert (Bourdieu). Viele arbeiten deshalb unter ihrer Qualifikation. Hier trägt vor allem der Staat Verantwortung.",
      source: "bpb-Kurzdossier Pflege; Arbeitsblatt Migration" },
    { id: "arbeit", team: "chance", term: "demografie",
      text: "Ohne Zuwanderung sinkt die Zahl der Arbeitskräfte bis 2040 um rund 10 %.",
      why: "Zuwanderung bremst den demografischen Wandel: Menschen mit Einwanderungsgeschichte sind im Schnitt neun Jahre jünger als der Rest der Bevölkerung.",
      source: "Bertelsmann Stiftung/IAB 2024; Destatis 2026" },
    { id: "schule", team: "beides", term: "bildungsungleichheit",
      text: "44,6 % der Schülerinnen und Schüler in NRW haben eine Zuwanderungsgeschichte.",
      why: "Erst mal ist das eine Tatsache. Ob sie zur Chance oder zum Problem wird, hängt davon ab, was Schulen daraus machen – zum Beispiel, ob die Herkunft über den Bildungserfolg entscheidet.",
      source: "IT.NRW, Schuljahr 2025/26" }
  ],
  sortLabels: { chance: "Chance", problem: "Problem", beides: "Beides" },

  /* ---------- Bauchgefühl-Profil nach dem Schätzspiel ----------
   * max = höchste durchschnittliche Abweichung in Prozentpunkten (nur Prozentfragen).
   */
  gutTiers: [
    { max: 4, name: "Statistik-Auge", text: "Du liegst fast überall richtig. Respekt." },
    { max: 8, name: "Guter Riecher", text: "Meistens nah dran – nur ein paar Ausreißer." },
    { max: 14, name: "Bauch mit Ausreißern", text: "Bei manchen Zahlen lag dein Gefühl deutlich daneben. Genau darum geht es in diesem Projekt." },
    { max: 1000, name: "Typisch Bauchgefühl", text: "Damit bist du nicht allein: Den Anteil der Muslime in Deutschland schätzten Befragte in einer Ipsos-Studie im Schnitt mehr als dreimal so hoch, wie er ist." }
  ],

  /* ---------- Sprachpaten: Willkommen in vielen Sprachen ----------
   * Bitte von Muttersprachlerinnen und Muttersprachlern prüfen lassen, bevor ihr Zeilen ergänzt.
   */
  welcome: [
    ["de", "Willkommen"], ["tr", "Hoş geldin"], ["ar", "أهلاً وسهلاً", "rtl"], ["ckb", "بەخێربێیت", "rtl"],
    ["kmr", "Bi xêr hatî"], ["pl", "Witaj"], ["uk", "Ласкаво просимо"], ["ru", "Добро пожаловать"],
    ["sq", "Mirë se vjen"], ["bs", "Dobrodošli"], ["ro", "Bine ai venit"], ["el", "Καλώς ήρθες"],
    ["fa", "خوش آمدید", "rtl"], ["fr", "Bienvenue"], ["it", "Benvenuti"], ["es", "Bienvenidos"],
    ["pt", "Bem-vindos"], ["en", "Welcome"], ["bg", "Добре дошли"], ["vi", "Chào mừng"],
    ["hi", "स्वागत है"], ["zh", "欢迎"], ["nl", "Welkom"]
  ],

  /* ---------- Unsere eigene Umfrage (Google Forms) ----------
   * „Migration und Integration in Deutschland“, 9. bis 12. November 2026, 27 Antworten.
   * Nur zusammengefasste Zahlen – die Rohdaten (mit Zeitstempeln und Freitext) bleiben bei uns.
   * Skalenfragen: 1 bis 5. ends = Beschriftung der Enden (bitte mit dem Fragebogen abgleichen).
   * Zitate: anonym, ohne Namen, sprachlich leicht geglättet.
   */
  umfrage: {
    titel: "Migration und Integration in Deutschland",
    zeitraum: "9. bis 12. November 2026",
    werkzeug: "Google Forms",
    gruppen: { g1: "Gruppe 1: selbst eingewandert", g2: "Gruppe 2: Erfahrungen mit Eingewanderten" },
    ends: {
      akzeptanz: ["gar nicht", "voll und ganz"],
      anpassung: ["leicht", "sehr schwierig"],
      sprache: ["gar nicht", "sehr stark"],
      kultur: ["gar nicht", "sehr stark"],
      geholfen: ["nie", "oft"]
    },
    daten: {"n": 27, "g1": 13, "g2": 14, "akzeptanz": {"alle": {"n": 26, "dist": [2, 2, 6, 7, 9], "mean": 3.73}, "g1": {"n": 12, "dist": [0, 1, 4, 3, 4], "mean": 3.83}, "g2": {"n": 14, "dist": [2, 1, 2, 4, 5], "mean": 3.64}}, "anpassung": {"alle": {"n": 19, "dist": [4, 2, 7, 4, 2], "mean": 2.89}, "g1": {"n": 12, "dist": [1, 1, 5, 4, 1], "mean": 3.25}, "g2": {"n": 7, "dist": [3, 1, 2, 0, 1], "mean": 2.29}}, "sprache": {"alle": {"n": 21, "dist": [9, 5, 1, 2, 4], "mean": 2.38}, "g1": {"n": 12, "dist": [4, 3, 1, 2, 2], "mean": 2.58}, "g2": {"n": 9, "dist": [5, 2, 0, 0, 2], "mean": 2.11}}, "kultur": {"alle": {"n": 22, "dist": [3, 7, 6, 3, 3], "mean": 2.82}, "g1": {"n": 12, "dist": [3, 5, 3, 1, 0], "mean": 2.17}, "g2": {"n": 10, "dist": [0, 2, 3, 2, 3], "mean": 3.6}}, "geholfen": {"alle": {"n": 19, "dist": [0, 2, 7, 7, 3], "mean": 3.58}, "g1": {"n": 5, "dist": [0, 1, 1, 3, 0], "mean": 3.4}, "g2": {"n": 14, "dist": [0, 1, 6, 4, 3], "mean": 3.64}}, "vorurteile": {"alle": {"n": 16, "counts": {"Ja": 9, "Nein": 7}}, "g1": {"n": 3, "counts": {"Ja": 2, "Nein": 1}}, "g2": {"n": 13, "counts": {"Ja": 7, "Nein": 6}}}, "erfahrung": {"alle": {"n": 20, "counts": {"Positiv": 14, "Negativ": 6}}, "g1": {"n": 6, "counts": {"Positiv": 6, "Negativ": 0}}, "g2": {"n": 14, "counts": {"Positiv": 8, "Negativ": 6}}}, "freunde": {"alle": {"n": 21, "counts": {"Ja": 12, "Unsicher": 6, "Nein": 3}}, "g1": {"n": 7, "counts": {"Ja": 4, "Unsicher": 0, "Nein": 3}}, "g2": {"n": 14, "counts": {"Ja": 8, "Unsicher": 6, "Nein": 0}}}, "barrieren": {"labels": ["Kommunikation und Sprache", "Kulturelle Erwartungen und Werte", "Missverständnisse wegen kultureller Unterschiede", "Umgang mit Mitschülern", "Umgang mit Lehrkräften", "Freundschaften und soziale Kontakte", "Keine Barrieren erlebt"], "alle": {"n": 26, "counts": [13, 11, 7, 7, 6, 6, 4]}, "g1": {"n": 12, "counts": [8, 6, 3, 3, 3, 5, 2]}, "g2": {"n": 14, "counts": [5, 5, 4, 4, 3, 1, 2]}}},
    zitate: [
      { g: 1, term: "soziale_schliessung", text: "Schwierig, weil man sich gut auf Deutsch ausdrücken will und Angst hat, dass die anderen einen auslachen. Dazu kommt der Zeitdruck: Wenn man im ersten Schuljahr einmal von einer Gruppe ausgeschlossen wird, ist es schwer, mit ihr noch befreundet zu werden – die haben dann schon ein Bild von dir." },
      { g: 1, term: null, text: "Ich bin kurz vor der Pandemie eingewandert und hatte in den ersten zwei Jahren große Schwierigkeiten, mich an die Sprache und die Lebensweise zu gewöhnen. Ich glaube, das hat mein Zugehörigkeitsgefühl beeinträchtigt." },
      { g: 1, term: null, text: "Rassismus und Sprache – ich war mit Menschen zusammen, die mich sehr verurteilt haben und wegen meiner Sprache nicht mit mir reden wollten." },
      { g: 1, term: null, text: "Viele sind schockiert, wenn ich sage, dass ich eingewandert bin, weil ich nicht so aussehe. Manche verhalten sich danach plötzlich anders." },
      { g: 2, term: "sozialisation", text: "Leider zeigen viele in meinem Umfeld, wie leicht Medien und Nachrichten ein falsches, negatives Bild von Immigranten erzeugen können." },
      { g: 2, term: "sozialisation", text: "Ich habe wirklich wenige Vorurteile – dank meiner Mutter und kritischem Denken." }
    ]
  },

  /* ---------- Quellen (Seite "Über das Projekt") ---------- */
  sources: [
    ["Eigene Umfrage der Klasse AIA31: „Migration und Integration in Deutschland“, Google Forms, 9. bis 12. November 2026, 27 Antworten von Schülerinnen und Schülern des HHBK. Anonym, nicht repräsentativ.", ""],
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
