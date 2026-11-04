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
      router.push(`/host/${game.code}`);
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
    <section aria-labelledby="library-heading" className="mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="library-heading" className="font-display text-3xl font-extrabold sm:text-4xl">
            Deine Quizze
          </h2>
          <p className="mt-1 text-muted">Wähle ein Quiz und starte ein Live-Spiel.</p>
        </div>
        {quizzes && quizzes.length > 0 && (
          <LinkButton href="/create" variant="secondary" size="sm">
            + Neues Quiz
          </LinkButton>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-a1/40 bg-a1/10 px-4 py-3 text-sm text-a1" role="alert">
          {error}
        </div>
      )}

      {quizzes === null ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-ink-2" />
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="mt-8 rounded-3xl border-2 border-dashed border-line p-10 text-center">
          <p className="font-display text-2xl font-bold">Noch keine Quizze gespeichert</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Erstelle dein erstes Quiz, importiere eine Datei oder lege das Beispielquiz an, um alles auszuprobieren.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={addSample}>Beispielquiz anlegen</Button>
            <LinkButton href="/create" variant="secondary">
              Quiz erstellen
            </LinkButton>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q, i) => (
            <li
              key={q.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-ink-2 animate-rise"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={cn("h-2", answerStyle(i).bg)} />
              <div className="flex flex-1 flex-col p-5">
                <Link href={`/edit/${q.id}`} className="font-display text-xl font-bold leading-tight hover:underline">
                  {q.title}
                </Link>
                {q.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{q.description}</p>}
                <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">
                  {q.questionCount} {q.questionCount === 1 ? "Frage" : "Fragen"} · {formatDate(q.updatedAt)}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <Button size="sm" onClick={() => play(q.id)} disabled={busyId === q.id}>
                    {busyId === q.id ? "Starte …" : "▶ Live spielen"}
                  </Button>
                  <LinkButton href={`/edit/${q.id}`} variant="secondary" size="sm">
                    Bearbeiten
                  </LinkButton>
                  <Button variant="ghost" size="sm" onClick={() => exportQuiz(q.id)} title="Als JSON exportieren">
                    Export
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(q)} className="ml-auto text-a1 hover:text-a1">
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
