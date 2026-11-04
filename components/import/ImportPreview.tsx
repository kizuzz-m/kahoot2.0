"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { answerStyle } from "@/components/ui/answer-style";
import { Button } from "@/components/ui/Button";
import { api, stashDraft } from "@/lib/client-api";
import type { ImportResult } from "@/lib/import/types";
import { cn } from "@/lib/utils";

export function ImportPreview({ result, onReset }: { result: ImportResult; onReset: () => void }) {
  const router = useRouter();
  const [items, setItems] = useState(result.quizzes);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveOne(i: number) {
    const item = items[i];
    await api.createQuiz(item.quiz);
    setSavedIdx((s) => new Set(s).add(i));
  }

  async function saveAll() {
    setBusy(true);
    setError(null);
    try {
      for (let i = 0; i < items.length; i++) if (!savedIdx.has(i) && !items[i].errors.length) await saveOne(i);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const savable = items.filter((q, i) => !q.errors.length && !savedIdx.has(i)).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">
          Vorschau · {items.length} {items.length === 1 ? "Quiz" : "Quizze"} aus {result.source}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Andere Datei
          </Button>
          <Button size="sm" onClick={saveAll} disabled={busy || savable === 0}>
            {busy ? "Speichere …" : savable > 1 ? `Alle ${savable} speichern` : "Speichern"}
          </Button>
        </div>
      </div>
      {error && <p className="rounded-2xl border border-a1/40 bg-a1/10 px-4 py-3 text-sm text-a1">{error}</p>}

      {items.map((item, i) => (
        <article key={i} className="rounded-3xl border border-line bg-ink-2 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="field font-display max-w-lg flex-1 py-2 text-lg font-bold"
              value={item.quiz.title}
              aria-label="Titel"
              onChange={(e) =>
                setItems((list) => list.map((x, j) => (j === i ? { ...x, quiz: { ...x.quiz, title: e.target.value } } : x)))
              }
            />
            <span className="text-sm text-muted">{item.quiz.questions.length} Fragen</span>
            <div className="ml-auto flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  stashDraft(item.quiz);
                  router.push("/admin/create");
                }}
              >
                Im Editor öffnen
              </Button>
              {savedIdx.has(i) ? (
                <span className="self-center text-sm font-semibold text-a3">Gespeichert ✓</span>
              ) : (
                <Button
                  size="sm"
                  disabled={item.errors.length > 0 || busy}
                  onClick={() => saveOne(i).catch((err: Error) => setError(err.message))}
                >
                  Speichern
                </Button>
              )}
            </div>
          </div>

          {item.errors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-a1/40 bg-a1/10 px-4 py-3 text-sm text-a1">
              <p className="font-semibold">Fehler – bitte im Editor korrigieren:</p>
              <ul className="mt-1 list-inside list-disc">
                {item.errors.slice(0, 6).map((m) => (
                  <li key={m}>{m}</li>
                ))}
                {item.errors.length > 6 && <li>… und {item.errors.length - 6} weitere</li>}
              </ul>
            </div>
          )}
          {item.warnings.length > 0 && (
            <div className="mt-4 rounded-2xl border border-a2/40 bg-a2/10 px-4 py-3 text-sm text-a2">
              <p className="font-semibold">Hinweise:</p>
              <ul className="mt-1 list-inside list-disc">
                {item.warnings.slice(0, 6).map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {item.quiz.questions.slice(0, 6).map((q, qi) => (
              <li key={q.id} className="rounded-2xl bg-ink-3/60 p-4">
                <p className="text-xs font-semibold text-muted">
                  {qi + 1}. · {q.timeLimit}s · {q.points} Punkte
                </p>
                <p className="mt-1 font-semibold">{q.text || <em className="text-a1">Fragetext fehlt</em>}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {q.answers.map((a, ai) => (
                    <li
                      key={a.id}
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-xs font-medium",
                        a.correct ? "bg-a3 text-ink" : "bg-ink-2 text-paper/80",
                      )}
                    >
                      <span className={cn("mr-1 font-bold", !a.correct && answerStyle(ai).text)}>{answerStyle(ai).letter}</span>
                      {a.text}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {item.quiz.questions.length > 6 && (
            <p className="mt-3 text-sm text-muted">… und {item.quiz.questions.length - 6} weitere Fragen</p>
          )}
        </article>
      ))}
    </div>
  );
}
