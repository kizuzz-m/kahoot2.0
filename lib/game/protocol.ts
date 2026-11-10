/**
 * Nachrichtenprotokoll zwischen Host und Spielern.
 *
 * Architektur: Der Host ist „autoritativ“. Er kennt das komplette Quiz inkl. richtiger
 * Antworten, berechnet Punkte und sendet den Spielern nur einen öffentlichen Snapshot
 * (ohne Lösungen, solange die Frage läuft).
 */

export type Phase = "lobby" | "question" | "reveal" | "leaderboard" | "finished";

export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  rank: number;
  /** Punkte der letzten Frage – für „+850“-Animationen */
  lastGained: number;
  streak: number;
}

export interface PublicQuestion {
  index: number;
  text: string;
  /** Nur kleine Bild-URLs werden mitgeschickt; große Uploads sieht man auf dem Host-Bildschirm. */
  image: string | null;
  hasImage: boolean;
  answers: string[];
  multi: boolean;
  timeLimit: number;
  points: number;
  /** Restzeit in ms bis Fragenende (inkl. Lesezeit) zum Zeitpunkt des Snapshots – unabhängig von Geräteuhren */
  remainingMs: number;
  /** Verbleibende Lesezeit in ms, bevor die Antworten freigegeben werden */
  readingMs: number;
}

export interface PlayerResult {
  correct: boolean;
  gained: number;
  choices: number[];
  streak: number;
}

export interface PublicReveal {
  correct: number[];
  counts: number[];
  explanation: string | null;
  results: Record<string, PlayerResult>;
}

export interface PublicSnapshot {
  sessionId: string;
  seq: number;
  code: string;
  quizTitle: string;
  phase: Phase;
  totalQuestions: number;
  questionIndex: number;
  players: PublicPlayer[];
  question: PublicQuestion | null;
  answeredIds: string[];
  reveal: PublicReveal | null;
  kicked: string[];
}

export type GameMessage =
  // Spieler → Host
  | { type: "join"; playerId: string; name: string }
  | { type: "hello"; playerId: string }
  | { type: "answer"; playerId: string; questionIndex: number; choices: number[] }
  | { type: "leave"; playerId: string }
  // Host → Spieler
  | { type: "snapshot"; snapshot: PublicSnapshot }
  | { type: "join-rejected"; playerId: string; reason: string }
  | { type: "closed" };
