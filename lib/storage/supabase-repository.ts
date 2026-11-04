import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Game, GameStatus, PlayerRecord, Quiz, QuizInput, QuizSummary } from "../types";
import { generateGameCode } from "../utils";
import { NotFoundError, type Repository } from "./types";

/* Zeilentypen der Tabellen aus supabase/schema.sql */
interface QuizRow {
  id: string;
  title: string;
  description: string | null;
  questions: Quiz["questions"];
  created_at: string;
  updated_at: string;
}
interface GameRow {
  id: string;
  code: string;
  quiz_id: string;
  status: GameStatus;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

const toQuiz = (r: QuizRow): Quiz => ({
  id: r.id,
  title: r.title,
  description: r.description ?? undefined,
  questions: r.questions,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toGame = (r: GameRow): Game => ({
  id: r.id,
  code: r.code,
  quizId: r.quiz_id,
  status: r.status,
  createdAt: r.created_at,
  startedAt: r.started_at ?? undefined,
  finishedAt: r.finished_at ?? undefined,
});

export class SupabaseRepository implements Repository {
  readonly kind = "supabase" as const;
  private db: SupabaseClient;

  constructor(url: string, key: string) {
    this.db = createClient(url, key, { auth: { persistSession: false } });
  }

  async listQuizzes(): Promise<QuizSummary[]> {
    const { data, error } = await this.db
      .from("quizzes")
      .select("id,title,description,questions,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ?? undefined,
      questionCount: Array.isArray(r.questions) ? r.questions.length : 0,
      updatedAt: r.updated_at,
    }));
  }

  async getQuiz(id: string) {
    const { data, error } = await this.db.from("quizzes").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? toQuiz(data as QuizRow) : null;
  }

  async createQuiz(input: QuizInput) {
    const { data, error } = await this.db
      .from("quizzes")
      .insert({ title: input.title, description: input.description ?? null, questions: input.questions })
      .select("*")
      .single();
    if (error) throw error;
    return toQuiz(data as QuizRow);
  }

  async updateQuiz(id: string, input: QuizInput) {
    const { data, error } = await this.db
      .from("quizzes")
      .update({
        title: input.title,
        description: input.description ?? null,
        questions: input.questions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? toQuiz(data as QuizRow) : null;
  }

  async deleteQuiz(id: string) {
    const { error, count } = await this.db.from("quizzes").delete({ count: "exact" }).eq("id", id);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  async createGame(quizId: string) {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) throw new NotFoundError("Quiz nicht gefunden");
    // Beendete Spiele mit demselben Code geben den Code frei (siehe Partial-Unique-Index im Schema).
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = generateGameCode();
      const { data, error } = await this.db
        .from("games")
        .insert({ code, quiz_id: quizId, status: "lobby" })
        .select("*")
        .single();
      if (!error) return toGame(data as GameRow);
      if (error.code !== "23505") throw error; // 23505 = unique violation → neuer Versuch
    }
    throw new Error("Konnte keinen freien Spielcode erzeugen");
  }

  async getGame(code: string) {
    const { data, error } = await this.db
      .from("games")
      .select("*")
      .eq("code", code)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ? toGame(data as GameRow) : null;
  }

  async updateGameStatus(code: string, status: GameStatus) {
    const game = await this.getGame(code);
    if (!game) return null;
    const patch: Record<string, unknown> = { status };
    if (status === "running" && !game.startedAt) patch.started_at = new Date().toISOString();
    if (status === "finished") patch.finished_at = new Date().toISOString();
    const { data, error } = await this.db.from("games").update(patch).eq("id", game.id).select("*").single();
    if (error) throw error;
    return toGame(data as GameRow);
  }

  async saveResults(code: string, players: PlayerRecord[]) {
    const game = await this.getGame(code);
    if (!game) throw new NotFoundError("Spiel nicht gefunden");
    await this.db.from("players").delete().eq("game_id", game.id);
    if (!players.length) return;
    const { error } = await this.db.from("players").insert(
      players.map((p) => ({ game_id: game.id, player_key: p.id, name: p.name, score: p.score, rank: p.rank })),
    );
    if (error) throw error;
  }

  async getResults(code: string) {
    const game = await this.getGame(code);
    if (!game) return [];
    const { data, error } = await this.db
      .from("players")
      .select("player_key,name,score,rank")
      .eq("game_id", game.id)
      .order("rank");
    if (error) throw error;
    return (data ?? []).map((r) => ({ id: r.player_key, name: r.name, score: r.score, rank: r.rank }));
  }
}
