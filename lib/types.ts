/** Zentrales Datenmodell von Quizwerk. */

export interface Answer {
  id: string;
  text: string;
  correct: boolean;
}

export interface Question {
  id: string;
  text: string;
  /** http(s)-URL oder data-URL (beim Upload automatisch verkleinert) */
  image?: string;
  answers: Answer[];
  /** Sekunden */
  timeLimit: number;
  /** Maximal erreichbare Punkte (0 = Frage ohne Wertung) */
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

/** Quiz ohne serverseitige Felder – so wird es erstellt/aktualisiert. */
export type QuizInput = Pick<Quiz, "title" | "description" | "questions">;

export interface QuizSummary {
  id: string;
  title: string;
  description?: string;
  questionCount: number;
  updatedAt: string;
}

export type GameStatus = "lobby" | "running" | "finished";

export interface Game {
  id: string;
  code: string;
  quizId: string;
  status: GameStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface PlayerRecord {
  id: string;
  name: string;
  score: number;
  rank: number;
}

export const LIMITS = {
  minAnswers: 2,
  maxAnswers: 6,
  minTime: 5,
  maxTime: 240,
  maxPoints: 5000,
  maxQuestions: 200,
} as const;

export const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240];
export const POINT_OPTIONS = [0, 500, 1000, 2000];
