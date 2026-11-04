import { promises as fs } from "node:fs";
import path from "node:path";
import type { Game, GameStatus, PlayerRecord, Quiz, QuizInput, QuizSummary } from "../types";
import { generateGameCode, uid } from "../utils";
import { NotFoundError, type Repository } from "./types";

interface DbShape {
  quizzes: Quiz[];
  games: Game[];
  results: Record<string, PlayerRecord[]>;
}

const DATA_DIR = process.env.QUIZWERK_DATA_DIR ?? path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/** Serialisiert Schreibzugriffe, damit parallele Requests sich nicht überschreiben. */
let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    return { quizzes: parsed.quizzes ?? [], games: parsed.games ?? [], results: parsed.results ?? {} };
  } catch {
    return { quizzes: [], games: [], results: {} };
  }
}

async function write(db: DbShape) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

function mutate<T>(fn: (db: DbShape) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const result = await fn(db);
    await write(db);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function summarize(q: Quiz): QuizSummary {
  return { id: q.id, title: q.title, description: q.description, questionCount: q.questions.length, updatedAt: q.updatedAt };
}

export class FileRepository implements Repository {
  readonly kind = "file" as const;

  async listQuizzes() {
    const db = await read();
    return db.quizzes.map(summarize).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getQuiz(id: string) {
    const db = await read();
    return db.quizzes.find((q) => q.id === id) ?? null;
  }

  createQuiz(input: QuizInput) {
    return mutate((db) => {
      const now = new Date().toISOString();
      const quiz: Quiz = { ...input, id: uid(), createdAt: now, updatedAt: now };
      db.quizzes.push(quiz);
      return quiz;
    });
  }

  updateQuiz(id: string, input: QuizInput) {
    return mutate((db) => {
      const idx = db.quizzes.findIndex((q) => q.id === id);
      if (idx < 0) return null;
      const updated: Quiz = { ...db.quizzes[idx], ...input, id, updatedAt: new Date().toISOString() };
      db.quizzes[idx] = updated;
      return updated;
    });
  }

  deleteQuiz(id: string) {
    return mutate((db) => {
      const before = db.quizzes.length;
      db.quizzes = db.quizzes.filter((q) => q.id !== id);
      return db.quizzes.length < before;
    });
  }

  createGame(quizId: string) {
    return mutate((db) => {
      if (!db.quizzes.some((q) => q.id === quizId)) throw new NotFoundError("Quiz nicht gefunden");
      // Alte, beendete Spiele (> 24 h) aufräumen
      const cutoff = Date.now() - 24 * 3600 * 1000;
      db.games = db.games.filter((g) => new Date(g.createdAt).getTime() > cutoff || g.status !== "finished");
      const active = new Set(db.games.filter((g) => g.status !== "finished").map((g) => g.code));
      let code = generateGameCode();
      while (active.has(code)) code = generateGameCode();
      // beendete Spiele mit gleichem Code entfernen
      db.games = db.games.filter((g) => g.code !== code);
      const game: Game = { id: uid(), code, quizId, status: "lobby", createdAt: new Date().toISOString() };
      db.games.push(game);
      return game;
    });
  }

  async getGame(code: string) {
    const db = await read();
    return db.games.find((g) => g.code === code) ?? null;
  }

  updateGameStatus(code: string, status: GameStatus) {
    return mutate((db) => {
      const game = db.games.find((g) => g.code === code);
      if (!game) return null;
      game.status = status;
      if (status === "running" && !game.startedAt) game.startedAt = new Date().toISOString();
      if (status === "finished") game.finishedAt = new Date().toISOString();
      return game;
    });
  }

  saveResults(code: string, players: PlayerRecord[]) {
    return mutate((db) => {
      const game = db.games.find((g) => g.code === code);
      if (!game) throw new NotFoundError("Spiel nicht gefunden");
      db.results[game.id] = players;
    });
  }

  async getResults(code: string) {
    const db = await read();
    const game = db.games.find((g) => g.code === code);
    return game ? (db.results[game.id] ?? []) : [];
  }
}
