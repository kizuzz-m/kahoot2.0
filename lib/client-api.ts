"use client";

import type { Game, Quiz, QuizInput, QuizSummary } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public issues: string[] = [],
    public status = 0,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Server nicht erreichbar. Läuft `npm run dev`?");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? `Fehler ${res.status}`, body.issues ?? [], res.status);
  return body as T;
}

export const api = {
  listQuizzes: () => request<QuizSummary[]>("/api/quizzes"),
  getQuiz: (id: string) => request<Quiz>(`/api/quizzes/${id}`),
  createQuiz: (input: QuizInput) => request<Quiz>("/api/quizzes", { method: "POST", body: JSON.stringify(input) }),
  updateQuiz: (id: string, input: QuizInput) =>
    request<Quiz>(`/api/quizzes/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  deleteQuiz: (id: string) => request<{ ok: true }>(`/api/quizzes/${id}`, { method: "DELETE" }),
  createGame: (quizId: string) => request<Game>("/api/games", { method: "POST", body: JSON.stringify({ quizId }) }),
  getGame: (code: string) => request<Game & { quizTitle: string }>(`/api/games/${code}`),
};

/** Übergabe eines Entwurfs (z. B. aus dem Import) an den Editor. */
const DRAFT_KEY = "quizwerk:draft";
export function stashDraft(input: QuizInput) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(input));
}
export function takeDraft(): QuizInput | null {
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(DRAFT_KEY);
  try {
    return JSON.parse(raw) as QuizInput;
  } catch {
    return null;
  }
}
