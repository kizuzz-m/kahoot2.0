"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { answerStyle } from "@/components/ui/answer-style";
import { api } from "@/lib/client-api";
import { toQuizwerkJson } from "@/lib/export";
import { sampleQuiz } from "@/lib/sample";
import type { QuizSummary } from "@/lib/types";
import { cn, downloadText, formatDate, slugify } from "@/lib/utils";

export function QuizLibrary() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setQuizzes(await api.listQuizzes());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setQuizzes([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function play(id: string) {
    setBusyId(id);
    try {
      const game = await api.createGame(id);
      router.push(`/admin/host/${game.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusyId(null);
    }
  }

  async function remove(q: QuizSummary) {
    if (!confirm(`„${q.title}“ wirklich löschen?`)) return;
    try {
      await api.deleteQuiz(q.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function exportQuiz(id: string) {
    const quiz = await api.getQuiz(id);
    downloadText(`${slugify(quiz.title)}.quizwerk.json`, JSON.stringify(toQuizwerkJson(quiz), null, 2));
  }

  async function addSample() {
    try {
      await api.createQuiz(sampleQuiz());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section aria-label="Gespeicherte Quizze">
      {error && (
        <div className="mb-6 rounded-xl border border-a1/30 bg-a1/10 px-4 py-3 text-sm text-a1" role="alert">
          {error}
        </div>
      )}

      {quizzes === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-44 animate-pulse" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="font-display text-xl font-bold">Noch keine Quizze</p>
          <p className="mx-auto mt-1.5 max-w-md text-muted">
            Erstelle dein erstes Quiz, importiere eine Datei oder lege das Beispielquiz an.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LinkButton href="/admin/create">Quiz erstellen</LinkButton>
            <LinkButton href="/admin/import" variant="secondary">
              Importieren
            </LinkButton>
            <Button variant="ghost" onClick={addSample}>
              Beispielquiz anlegen
            </Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q, i) => (
            <li
              key={q.id}
              className="card flex flex-col p-5 transition hover:border-[#3a4d75] animate-rise"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", answerStyle(i).bg)} aria-hidden />
                <div className="min-w-0">
                  <Link
                    href={`/admin/edit/${q.id}`}
                    className="font-display block text-lg font-bold leading-snug hover:text-brand"
                  >
                    {q.title}
                  </Link>
                  {q.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{q.description}</p>}
                  <p className="mt-2 text-xs text-muted">
                    {q.questionCount} {q.questionCount === 1 ? "Frage" : "Fragen"} · {formatDate(q.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-1.5 pt-5">
                <Button size="sm" onClick={() => play(q.id)} disabled={busyId === q.id}>
                  {busyId === q.id ? "Starte …" : "▶ Hosten"}
                </Button>
                <LinkButton href={`/admin/edit/${q.id}`} variant="secondary" size="sm">
                  Bearbeiten
                </LinkButton>
                <div className="ml-auto flex">
                  <Button variant="ghost" size="sm" onClick={() => exportQuiz(q.id)} title="Als JSON exportieren">
                    Export
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => remove(q)} title="Quiz löschen">
                    Löschen
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
