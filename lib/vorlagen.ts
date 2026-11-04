/**
 * Inhalt der Vorlagen aus public/vorlagen/ für die Seite /format.
 * Als Modul statt per fs eingelesen, damit die Seite auch ohne Dateisystem (Cloudflare Workers) läuft.
 * tests/vorlagen.test.ts prüft, dass beide Varianten identisch bleiben.
 */
export const BEISPIEL_JSON = `{
  "format": "quizwerk",
  "version": 1,
  "title": "Mein Quiz",
  "description": "Beispiel im Quizwerk-Format",
  "questions": [
    {
      "question": "Was ist die Hauptstadt der Schweiz?",
      "answers": [
        { "text": "Zürich", "correct": false },
        { "text": "Bern", "correct": true },
        { "text": "Genf", "correct": false },
        { "text": "Basel", "correct": false }
      ],
      "timeLimit": 20,
      "points": 1000,
      "explanation": "Bern ist die Bundesstadt der Schweiz."
    },
    {
      "question": "Welche Zahlen sind Primzahlen?",
      "answers": [
        { "text": "2", "correct": true },
        { "text": "9", "correct": false },
        { "text": "11", "correct": true },
        { "text": "15", "correct": false },
        { "text": "17", "correct": true }
      ],
      "timeLimit": 30,
      "points": 2000
    },
    {
      "question": "Die Erde ist der dritte Planet von der Sonne aus.",
      "answers": [
        { "text": "Richtig", "correct": true },
        { "text": "Falsch", "correct": false }
      ],
      "timeLimit": 10,
      "points": 500
    }
  ]
}
`;

export const VORLAGE_CSV = `titel;frage;antwort1;antwort2;antwort3;antwort4;antwort5;antwort6;richtig;zeit;punkte;bild;erklaerung
Mein CSV-Quiz;Was ist die Hauptstadt der Schweiz?;Zürich;Bern;Genf;Basel;;;2;20;1000;;Bern ist die Bundesstadt.
;Welche Zahlen sind Primzahlen?;2;9;11;15;17;;1|3|5;30;2000;;
;Die Erde ist der dritte Planet von der Sonne aus.;Richtig;Falsch;;;;;A;10;500;;
`;
