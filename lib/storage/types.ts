import type { Game, GameStatus, PlayerRecord, Quiz, QuizInput, QuizSummary } from "../types";

/**
 * Speicher-Abstraktion. Es gibt zwei Implementierungen:
 *  - SupabaseRepository (Postgres via Supabase)
 *  - FileRepository (JSON-Datei, ideal für lokale Entwicklung ohne Konto)
 * Weitere Backends (z. B. Prisma, Firebase) implementieren einfach dieses Interface.
 */
export interface Repository {
  readonly kind: "supabase" | "file";
  listQuizzes(): Promise<QuizSummary[]>;
  getQuiz(id: string): Promise<Quiz | null>;
  createQuiz(input: QuizInput): Promise<Quiz>;
  updateQuiz(id: string, input: QuizInput): Promise<Quiz | null>;
  deleteQuiz(id: string): Promise<boolean>;

  createGame(quizId: string): Promise<Game>;
  getGame(code: string): Promise<Game | null>;
  updateGameStatus(code: string, status: GameStatus): Promise<Game | null>;
  saveResults(code: string, players: PlayerRecord[]): Promise<void>;
  getResults(code: string): Promise<PlayerRecord[]>;
}

export class NotFoundError extends Error {}
