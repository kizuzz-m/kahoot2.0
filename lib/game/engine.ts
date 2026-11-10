/**
 * Reine, seiteneffektfreie Spiel-Logik des Hosts.
 * Alle Funktionen geben einen neuen Zustand zurück – dadurch gut testbar (siehe tests/).
 */
import type { Question, Quiz } from "../types";
import type { Phase, PublicPlayer, PublicSnapshot, PlayerResult } from "./protocol";

export interface PlayerState {
  id: string;
  name: string;
  score: number;
  streak: number;
  lastGained: number;
  joinedAt: number;
}

export interface AnswerRecord {
  choices: number[];
  elapsedMs: number;
}

export interface HostState {
  sessionId: string;
  seq: number;
  code: string;
  quiz: Quiz;
  phase: Phase;
  questionIndex: number;
  /** Zeitpunkt, ab dem geantwortet werden kann (nach der Lesezeit) */
  questionStartedAt: number;
  questionEndsAt: number;
  players: Record<string, PlayerState>;
  kicked: string[];
  answers: Record<string, AnswerRecord>;
  results: Record<string, PlayerResult>;
}

export const MAX_NAME_LENGTH = 20;
/** Toleranz für Netzwerk-Latenz, nachdem die Zeit abgelaufen ist */
export const ANSWER_GRACE_MS = 800;
/** Kleine Bilder (URLs) dürfen an Spieler gesendet werden */
const MAX_PLAYER_IMAGE_LENGTH = 2048;

export function createHostState(code: string, quiz: Quiz, sessionId: string): HostState {
  return {
    sessionId,
    seq: 1,
    code,
    quiz,
    phase: "lobby",
    questionIndex: -1,
    questionStartedAt: 0,
    questionEndsAt: 0,
    players: {},
    kicked: [],
    answers: {},
    results: {},
  };
}

const bump = (s: HostState): HostState => ({ ...s, seq: s.seq + 1 });

export function currentQuestion(s: HostState): Question | null {
  return s.quiz.questions[s.questionIndex] ?? null;
}

export function correctIndices(q: Question): number[] {
  return q.answers.flatMap((a, i) => (a.correct ? [i] : []));
}

export function isMultiSelect(q: Question): boolean {
  return q.answers.filter((a) => a.correct).length > 1;
}

/** Richtig ist eine Antwort nur, wenn genau die richtigen Optionen gewählt wurden. */
export function isCorrectAnswer(q: Question, choices: number[]): boolean {
  const correct = correctIndices(q);
  const chosen = [...new Set(choices)].sort((a, b) => a - b);
  return chosen.length === correct.length && chosen.every((c, i) => c === correct[i]);
}

/**
 * Punkte: Schnelle Antworten geben mehr Punkte.
 * Sofort richtig = 100 %, kurz vor Ablauf richtig = 50 % der Maximalpunkte.
 */
export function calculatePoints(maxPoints: number, elapsedMs: number, timeLimitSec: number): number {
  if (maxPoints <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, elapsedMs / (timeLimitSec * 1000)));
  return Math.round(maxPoints * (1 - ratio / 2));
}

export type JoinResult = { ok: true; state: HostState } | { ok: false; reason: string };

export function sanitizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
}

export function addPlayer(s: HostState, playerId: string, rawName: string, now: number): JoinResult {
  if (s.kicked.includes(playerId)) return { ok: false, reason: "Du wurdest vom Host entfernt." };
  const name = sanitizeName(rawName);
  if (!name) return { ok: false, reason: "Bitte gib einen Namen ein." };
  const existing = s.players[playerId];
  if (existing) {
    // Wiederbeitritt (z. B. nach Neuladen) – Punkte bleiben erhalten
    if (existing.name === name) return { ok: true, state: s };
  }
  const taken = Object.values(s.players).some(
    (p) => p.id !== playerId && p.name.toLowerCase() === name.toLowerCase(),
  );
  if (taken) return { ok: false, reason: `Der Name „${name}“ ist schon vergeben.` };
  if (s.phase === "finished") return { ok: false, reason: "Dieses Spiel ist bereits beendet." };
  const player: PlayerState = existing
    ? { ...existing, name }
    : { id: playerId, name, score: 0, streak: 0, lastGained: 0, joinedAt: now };
  return { ok: true, state: bump({ ...s, players: { ...s.players, [playerId]: player } }) };
}

export function removePlayer(s: HostState, playerId: string, kick: boolean): HostState {
  if (!s.players[playerId]) return s;
  const players = { ...s.players };
  delete players[playerId];
  const answers = { ...s.answers };
  delete answers[playerId];
  return bump({ ...s, players, answers, kicked: kick ? [...s.kicked, playerId] : s.kicked });
}

/**
 * Lesezeit, bevor die Antworten erscheinen: 4–8 Sekunden je nach Textlänge.
 * Gemessen wird ab Ende der Lesezeit, langsames Lesen kostet also keine Punkte.
 */
export function readingTimeMs(q: Question | undefined): number {
  if (!q) return 0;
  return Math.min(8000, Math.max(4000, 2500 + q.text.length * 50));
}

export function startQuestion(s: HostState, index: number, now: number, readMs = 0): HostState {
  const q = s.quiz.questions[index];
  if (!q) return s;
  const players = Object.fromEntries(Object.entries(s.players).map(([id, p]) => [id, { ...p, lastGained: 0 }]));
  const opensAt = now + Math.max(0, readMs);
  return bump({
    ...s,
    phase: "question",
    questionIndex: index,
    questionStartedAt: opensAt,
    questionEndsAt: opensAt + q.timeLimit * 1000,
    players,
    answers: {},
    results: {},
  });
}

export function submitAnswer(s: HostState, playerId: string, questionIndex: number, choices: number[], now: number): HostState {
  const q = currentQuestion(s);
  if (!q || s.phase !== "question" || questionIndex !== s.questionIndex) return s;
  if (!s.players[playerId] || s.answers[playerId]) return s;
  if (now < s.questionStartedAt) return s; // noch Lesezeit
  if (now > s.questionEndsAt + ANSWER_GRACE_MS) return s;
  const valid = [...new Set(choices)].filter((c) => Number.isInteger(c) && c >= 0 && c < q.answers.length);
  if (!valid.length) return s;
  const elapsedMs = Math.max(0, Math.min(now - s.questionStartedAt, q.timeLimit * 1000));
  return bump({ ...s, answers: { ...s.answers, [playerId]: { choices: valid, elapsedMs } } });
}

export function allAnswered(s: HostState): boolean {
  const ids = Object.keys(s.players);
  return ids.length > 0 && ids.every((id) => s.answers[id]);
}

/** Beendet die Frage, wertet alle Antworten aus und zeigt die Lösung. */
export function revealAnswers(s: HostState, now: number): HostState {
  const q = currentQuestion(s);
  if (!q || s.phase !== "question") return s;
  const players: Record<string, PlayerState> = {};
  const results: Record<string, PlayerResult> = {};
  for (const p of Object.values(s.players)) {
    const a = s.answers[p.id];
    const correct = a ? isCorrectAnswer(q, a.choices) : false;
    const gained = correct ? calculatePoints(q.points, a!.elapsedMs, q.timeLimit) : 0;
    const streak = correct ? p.streak + 1 : 0;
    players[p.id] = { ...p, score: p.score + gained, lastGained: gained, streak };
    results[p.id] = { correct, gained, choices: a?.choices ?? [], streak };
  }
  return bump({ ...s, phase: "reveal", players, results, questionEndsAt: Math.min(s.questionEndsAt, now) });
}

export function isLastQuestion(s: HostState): boolean {
  return s.questionIndex >= s.quiz.questions.length - 1;
}

export function showLeaderboard(s: HostState): HostState {
  return bump({ ...s, phase: "leaderboard" });
}

export function finishGame(s: HostState): HostState {
  return bump({ ...s, phase: "finished" });
}

/** Rangliste – gleiche Punktzahl ergibt gleichen Rang. */
export function rankedPlayers(s: HostState): PublicPlayer[] {
  const sorted = Object.values(s.players).sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
  let lastScore = -1;
  let lastRank = 0;
  return sorted.map((p, i) => {
    const rank = p.score === lastScore ? lastRank : i + 1;
    lastScore = p.score;
    lastRank = rank;
    return { id: p.id, name: p.name, score: p.score, rank, lastGained: p.lastGained, streak: p.streak };
  });
}

export function buildSnapshot(s: HostState, now: number): PublicSnapshot {
  const q = currentQuestion(s);
  const inQuestion = s.phase === "question";
  const showQuestion = q && s.phase !== "lobby" && s.phase !== "finished";
  const counts = q ? q.answers.map((_, i) => Object.values(s.answers).filter((a) => a.choices.includes(i)).length) : [];
  const smallImage = q?.image && q.image.length <= MAX_PLAYER_IMAGE_LENGTH ? q.image : null;
  return {
    sessionId: s.sessionId,
    seq: s.seq,
    code: s.code,
    quizTitle: s.quiz.title,
    phase: s.phase,
    totalQuestions: s.quiz.questions.length,
    questionIndex: s.questionIndex,
    players: rankedPlayers(s),
    question: showQuestion
      ? {
          index: s.questionIndex,
          text: q.text,
          image: smallImage,
          hasImage: Boolean(q.image),
          answers: q.answers.map((a) => a.text),
          multi: isMultiSelect(q),
          timeLimit: q.timeLimit,
          points: q.points,
          remainingMs: inQuestion ? Math.max(0, s.questionEndsAt - now) : 0,
          readingMs: inQuestion ? Math.max(0, s.questionStartedAt - now) : 0,
        }
      : null,
    answeredIds: inQuestion ? Object.keys(s.answers) : [],
    reveal:
      q && (s.phase === "reveal" || s.phase === "leaderboard")
        ? { correct: correctIndices(q), counts, explanation: q.explanation?.trim() || null, results: s.results }
        : null,
    kicked: s.kicked,
  };
}
