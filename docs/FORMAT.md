# Quizwerk-Quizformat (Version 1)

Quizwerk importiert und exportiert Quizze als **JSON** oder **CSV**. Beide Formate sind hier vollständig beschrieben.
Vorlagen: [`public/vorlagen/quizwerk-beispiel.json`](../public/vorlagen/quizwerk-beispiel.json) und
[`public/vorlagen/quizwerk-vorlage.csv`](../public/vorlagen/quizwerk-vorlage.csv) (in der App unter „Quiz importieren“ herunterladbar).

---

## JSON

```json
{
  "format": "quizwerk",
  "version": 1,
  "title": "Mein Quiz",
  "description": "Optional",
  "questions": [
    {
      "question": "Was ist die Hauptstadt der Schweiz?",
      "image": "https://example.com/bern.jpg",
      "answers": [
        { "text": "Zürich", "correct": false },
        { "text": "Bern", "correct": true },
        { "text": "Genf", "correct": false },
        { "text": "Basel", "correct": false }
      ],
      "timeLimit": 20,
      "points": 1000,
      "explanation": "Bern ist die Bundesstadt."
    }
  ]
}
```

### Felder

| Feld | Typ | Pflicht | Regeln / Standard |
|---|---|---|---|
| `format` | `"quizwerk"` | nein | Kennzeichnet das Format. Andere Werte werden abgelehnt. |
| `version` | Zahl | nein | Aktuell `1`. |
| `title` | Text | ja* | 1–120 Zeichen. *Fehlt er, wird der Dateiname verwendet. |
| `description` | Text | nein | max. 500 Zeichen |
| `questions` | Liste | ja | 1–200 Fragen |
| `questions[].question` | Text | ja | 1–500 Zeichen |
| `questions[].image` | Text | nein | `http(s)://…`-URL oder `data:image/…`-URL |
| `questions[].answers` | Liste | ja | **2–6** Antworten |
| `answers[].text` | Text | ja | 1–200 Zeichen |
| `answers[].correct` | Boolean | ja | **mindestens eine** Antwort muss `true` sein. Mehrere `true` = Mehrfachauswahl |
| `questions[].timeLimit` | Zahl | nein | Sekunden, 5–240, Standard `20` |
| `questions[].points` | Zahl | nein | 0–5000, Standard `1000`. `0` = Frage ohne Wertung |
| `questions[].explanation` | Text | nein | Wird nach der Auflösung angezeigt, max. 1000 Zeichen |

Das einfache Format ohne `format`/`version` (wie im Beispiel der Aufgabenstellung) ist ebenfalls gültig.

### Mehrere Quizze in einer Datei

```json
{ "format": "quizwerk", "version": 1, "quizzes": [ { "title": "A", "questions": [] }, { "title": "B", "questions": [] } ] }
```

### Tolerierte Varianten

Damit Daten aus anderen Werkzeugen leichter übernommen werden können, akzeptiert der Import zusätzlich:

- `text`/`title` statt `question`, `options`/`choices` statt `answers`, `isCorrect` statt `correct`
- Antworten als einfache Strings plus `"correctAnswers": [0, 2]` (0-basierte Indizes) auf Fragenebene
- `time`/`duration` statt `timeLimit` (Werte > 1000 werden als Millisekunden interpretiert)
- eine reine Liste von Fragen als oberstes Element

Werte außerhalb der Grenzen werden angepasst und als **Hinweis** angezeigt; echte Fehler (z. B. keine richtige
Antwort) erscheinen als **Fehler** und müssen vor dem Speichern im Editor behoben werden.

---

## CSV

Eine Frage pro Zeile. Trennzeichen `,` `;` oder Tab werden automatisch erkannt (Excel-Exporte mit `;` funktionieren).
Kopfzeilen sind deutsch oder englisch möglich, Groß-/Kleinschreibung ist egal.

| Spalte | Alternativ | Pflicht | Inhalt |
|---|---|---|---|
| `frage` | `question` | ja | Fragetext |
| `antwort1` … `antwort6` | `answer1` … `answer6` | mind. 2 | Antworttexte; leere Zellen werden ignoriert |
| `richtig` | `correct` | ja | Nummer (1-basiert), Buchstabe (`A`–`F`) oder Antworttext. Mehrere mit `\|`, z. B. `1\|3` |
| `zeit` | `timeLimit` | nein | Sekunden (Standard 20) |
| `punkte` | `points` | nein | Standard 1000 |
| `bild` | `image` | nein | Bild-URL |
| `erklaerung` | `explanation` | nein | Erklärung |
| `titel` | `title` | nein | Quiztitel – der erste gefüllte Wert zählt, sonst Dateiname |

```csv
titel;frage;antwort1;antwort2;antwort3;antwort4;richtig;zeit;punkte;erklaerung
Mein Quiz;Was ist die Hauptstadt der Schweiz?;Zürich;Bern;Genf;Basel;2;20;1000;Bern ist die Bundesstadt.
;Welche Zahlen sind Primzahlen?;2;9;11;15;1|3;30;2000;
```

---

## Externe Plattformen

Quizwerk lädt **keine** Inhalte per Scraping oder durch Umgehen von Schnittstellen. Für Plattformen ohne offizielle
Import-API zeigt die App einen Hinweis und verweist auf den manuellen Weg über JSON/CSV. Offizielle, frei nutzbare
APIs (aktuell: Open Trivia Database, CC BY-SA 4.0) können als `RemoteSource` eingebunden werden – siehe README.
