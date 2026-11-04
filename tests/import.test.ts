import { test } from "node:test";
import assert from "node:assert/strict";
import { checkExternalUrl, importContent } from "../lib/import/registry";

test("JSON-Beispiel aus der Aufgabenstellung", async () => {
  const content = JSON.stringify({
    title: "Mein Quiz",
    questions: [
      {
        question: "Was ist die Hauptstadt der Schweiz?",
        answers: [
          { text: "Zürich", correct: false },
          { text: "Bern", correct: true },
          { text: "Genf", correct: false },
          { text: "Basel", correct: false },
        ],
        timeLimit: 20,
        points: 1000,
      },
    ],
  });
  const res = await importContent({ content, fileName: "quiz.json" });
  assert.equal(res.quizzes.length, 1);
  const [{ quiz, errors }] = res.quizzes;
  assert.deepEqual(errors, []);
  assert.equal(quiz.title, "Mein Quiz");
  assert.equal(quiz.questions[0].answers[1].correct, true);
});

test("Quizwerk-Format mit mehreren Quizzen", async () => {
  const content = JSON.stringify({
    format: "quizwerk",
    version: 1,
    quizzes: [
      { title: "A", questions: [{ question: "1+1?", answers: [{ text: "2", correct: true }, { text: "3", correct: false }] }] },
      { title: "B", questions: [{ question: "2+2?", answers: ["4", "5"], correctAnswers: [0] }] },
    ],
  });
  const res = await importContent({ content });
  assert.equal(res.quizzes.length, 2);
  assert.ok(res.quizzes.every((q) => q.errors.length === 0));
  assert.equal(res.quizzes[1].quiz.questions[0].answers[0].correct, true);
});

test("CSV mit Semikolon, Mehrfachantworten und Buchstaben", async () => {
  const content = [
    "frage;antwort1;antwort2;antwort3;richtig;zeit;punkte;erklaerung",
    "Welche sind Primzahlen?;2;4;5;1|3;30;1000;2 und 5",
    "Hauptstadt der Schweiz?;Zürich;Bern;Genf;B;;;",
  ].join("\n");
  const res = await importContent({ content, fileName: "Mathe_Quiz.csv" });
  const [{ quiz, errors }] = res.quizzes;
  assert.deepEqual(errors, []);
  assert.equal(quiz.title, "Mathe Quiz");
  assert.deepEqual(quiz.questions[0].answers.map((a) => a.correct), [true, false, true]);
  assert.equal(quiz.questions[0].timeLimit, 30);
  assert.deepEqual(quiz.questions[1].answers.map((a) => a.correct), [false, true, false]);
  assert.equal(quiz.questions[1].timeLimit, 20);
});

test("Fehlende richtige Antwort wird als Fehler gemeldet", async () => {
  const content = JSON.stringify({ title: "X", questions: [{ question: "?", answers: [{ text: "a" }, { text: "b" }] }] });
  const res = await importContent({ content });
  assert.ok(res.quizzes[0].errors.some((e) => e.includes("richtig")));
});

test("Externe Plattform-Links liefern einen Hinweis statt Scraping", () => {
  assert.equal(checkExternalUrl("https://create.kahoot.it/details/abc")?.id, "kahoot");
  assert.equal(checkExternalUrl("https://example.com/quiz")?.id, "unknown");
});
