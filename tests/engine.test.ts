import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addPlayer,
  allAnswered,
  buildSnapshot,
  calculatePoints,
  createHostState,
  isCorrectAnswer,
  rankedPlayers,
  revealAnswers,
  startQuestion,
  submitAnswer,
} from "../lib/game/engine.ts";
import type { Quiz } from "../lib/types.ts";

const quiz: Quiz = {
  id: "q1",
  title: "Test",
  createdAt: "",
  updatedAt: "",
  questions: [
    {
      id: "a",
      text: "Hauptstadt der Schweiz?",
      timeLimit: 20,
      points: 1000,
      answers: [
        { id: "1", text: "Zürich", correct: false },
        { id: "2", text: "Bern", correct: true },
      ],
    },
    {
      id: "b",
      text: "Primzahlen?",
      timeLimit: 10,
      points: 1000,
      answers: [
        { id: "1", text: "2", correct: true },
        { id: "2", text: "4", correct: false },
        { id: "3", text: "5", correct: true },
      ],
    },
  ],
};

test("Punkte sinken linear auf 50 %", () => {
  assert.equal(calculatePoints(1000, 0, 20), 1000);
  assert.equal(calculatePoints(1000, 10_000, 20), 750);
  assert.equal(calculatePoints(1000, 20_000, 20), 500);
  assert.equal(calculatePoints(0, 0, 20), 0);
});

test("Mehrfachauswahl verlangt exakt die richtigen Antworten", () => {
  const q = quiz.questions[1];
  assert.equal(isCorrectAnswer(q, [0, 2]), true);
  assert.equal(isCorrectAnswer(q, [2, 0, 0]), true);
  assert.equal(isCorrectAnswer(q, [0]), false);
  assert.equal(isCorrectAnswer(q, [0, 1, 2]), false);
});

test("Kompletter Spielablauf", () => {
  let s = createHostState("123456", quiz, "sess");
  const j1 = addPlayer(s, "p1", "Anna", 1);
  assert.ok(j1.ok);
  s = j1.state;
  const j2 = addPlayer(s, "p2", "anna", 2);
  assert.equal(j2.ok, false, "Doppelte Namen werden abgelehnt");
  const j3 = addPlayer(s, "p2", "Ben", 2);
  assert.ok(j3.ok);
  s = j3.state;

  s = startQuestion(s, 0, 1000);
  const snap = buildSnapshot(s, 1000);
  assert.equal(snap.reveal, null, "Lösung wird während der Frage nicht verraten");
  assert.deepEqual(snap.question?.answers, ["Zürich", "Bern"]);
  assert.equal(snap.question?.remainingMs, 20_000);

  s = submitAnswer(s, "p1", 0, [1], 1000); // sofort richtig
  s = submitAnswer(s, "p1", 0, [0], 1500); // zweite Antwort ignoriert
  assert.equal(allAnswered(s), false);
  s = submitAnswer(s, "p2", 0, [0], 5000); // falsch
  assert.equal(allAnswered(s), true);

  s = revealAnswers(s, 6000);
  assert.equal(s.players.p1.score, 1000);
  assert.equal(s.players.p2.score, 0);
  assert.equal(s.players.p1.streak, 1);
  const revealSnap = buildSnapshot(s, 6000);
  assert.deepEqual(revealSnap.reveal?.correct, [1]);
  assert.deepEqual(revealSnap.reveal?.counts, [1, 1]);

  const ranking = rankedPlayers(s);
  assert.equal(ranking[0].name, "Anna");
  assert.equal(ranking[0].rank, 1);
});

test("Zu späte Antworten werden verworfen", () => {
  let s = createHostState("123456", quiz, "sess");
  const r = addPlayer(s, "p1", "Anna", 1);
  assert.ok(r.ok);
  s = startQuestion(r.state, 1, 0);
  s = submitAnswer(s, "p1", 1, [0, 2], 12_000);
  assert.equal(Object.keys(s.answers).length, 0);
});
