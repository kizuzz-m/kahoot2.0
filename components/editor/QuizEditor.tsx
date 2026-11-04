"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { api, ApiError } from "@/lib/client-api";
import { formatIssues, questionSchema, quizInputSchema } from "@/lib/schema";
import type { Question, QuizInput } from "@/lib/types";
import { uid } from "@/lib/utils";
import { QuestionForm } from "./QuestionForm";
import { QuestionList } from "./QuestionList";

export function newQuestion(): Question {
  return {
    id: uid(),
    text: "",
    answers: [
      { id: uid(), text: "", correct: true },
      { id: uid(), text: "", correct: false },
      { id: uid(), text: "", correct: false },
      { id: uid(), text: "", correct: false },
    ],
    timeLimit: 20,
    points: 1000,
  };
}

/** Bereinigt Eingaben vor dem Speichern (leere optionale Felder entfernen, Texte trimmen). */
function clean(quiz: QuizInput): QuizInput {
  return {
    title: quiz.title.trim(),
    description: quiz.description?.trim() || undefined,
    questions: quiz.questions.map((q) => ({
      ...q,
      text: q.text.trim(),
      explanation: q.explanation?.trim() || undefined,
      image: q.image || undefined,
      answers: q.answers.map((a) => ({ ...a, text: a.text.trim() })),
    })),
  };
}

export function QuizEditor({ quizId, initial }: { quizId?: string; initial?: QuizInput }) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizInput>(() => initial ?? { title: "", questions: [newQuestion()] });
  const [selectedId, setSelectedId] = useState<string | null>(quiz.questions[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [showIssues, setShowIssues] = useState(false);

  const update = (fn: (q: QuizInput) => QuizInput) => {
    setQuiz(fn);
    setDirty(true);
    setSaved(false);
  };

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const questionIssues = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const q of quiz.questions) {
      const r = questionSchema.safeParse(clean({ title: "x", questions: [q] }).questions[0]);
      if (!r.success) map.set(q.id, [...new Set(formatIssues(r.error))]);
    }
    return map;
  }, [quiz.questions]);

  const selectedIndex = quiz.questions.findIndex((q) => q.id === selectedId);
  const selected = quiz.questions[selectedIndex] ?? null;

  function addQuestion(after = quiz.questions.length - 1, base?: Question) {
    const q = base ? { ...base, id: uid(), answers: base.answers.map((a) => ({ ...a, id: uid() })) } : newQuestion();
    update((cur) => {
      const list = [...cur.questions];
      list.splice(after + 1, 0, q);
      return { ...cur, questions: list };
    });
    setSelectedId(q.id);
  }

  function deleteQuestion(id: string) {
    const idx = quiz.questions.findIndex((q) => q.id === id);
    update((cur) => ({ ...cur, questions: cur.questions.filter((q) => q.id !== id) }));
    const next = quiz.questions[idx + 1] ?? quiz.questions[idx - 1];
    setSelectedId(next?.id ?? null);
  }

  async function save(thenPlay = false) {
    const data = clean(quiz);
    const result = quizInputSchema.safeParse(data);
    if (!result.success) {
      setIssues(formatIssues(result.error));
      setShowIssues(true);
      const firstBad = quiz.questions.find((q) => questionIssues.has(q.id));
      if (firstBad) setSelectedId(firstBad.id);
      return;
    }
    setIssues([]);
    setSaving(true);
    try {
      const savedQuiz = quizId ? await api.updateQuiz(quizId, result.data) : await api.createQuiz(result.data);
      setDirty(false);
      setSaved(true);
      if (thenPlay) {
        const game = await api.createGame(savedQuiz.id);
        router.push(`/admin/host/${game.code}`);
      } else if (!quizId) {
        router.replace(`/admin/edit/${savedQuiz.id}`);
      }
    } catch (err) {
      setIssues(err instanceof ApiError && err.issues.length ? err.issues : [err instanceof Error ? err.message : String(err)]);
      setShowIssues(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Logo href="/admin" />
          <input
            className="field font-display max-w-md flex-1 py-2 text-lg font-bold"
            placeholder="Titel des Quiz"
            value={quiz.title}
            maxLength={120}
            onChange={(e) => update((q) => ({ ...q, title: e.target.value }))}
            aria-label="Titel des Quiz"
          />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline" aria-live="polite">
              {saving ? "Speichere …" : saved ? "Gespeichert ✓" : dirty ? "Ungespeicherte Änderungen" : ""}
            </span>
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
              Schließen
            </Button>
            <Button variant="secondary" size="sm" onClick={() => save(false)} disabled={saving}>
              Speichern
            </Button>
            <Button size="sm" onClick={() => save(true)} disabled={saving}>
              Speichern & spielen
            </Button>
          </div>
        </div>
      </header>

      {showIssues && issues.length > 0 && (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-a1/40 bg-a1/10 px-4 py-3 text-sm text-a1" role="alert">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Bitte korrigiere vor dem Speichern:</p>
                <ul className="mt-1 list-inside list-disc">
                  {issues.slice(0, 8).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                  {issues.length > 8 && <li>… und {issues.length - 8} weitere</li>}
                </ul>
              </div>
              <button onClick={() => setShowIssues(false)} aria-label="Hinweis schließen" className="text-lg">
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1">
          <label className="mb-4 block">
            <span className="mb-2 block text-sm font-semibold text-muted">Beschreibung (optional)</span>
            <textarea
              className="field min-h-16 resize-y text-sm"
              value={quiz.description ?? ""}
              maxLength={500}
              placeholder="Worum geht es?"
              onChange={(e) => update((q) => ({ ...q, description: e.target.value }))}
            />
          </label>
          <p className="mb-2 text-sm font-semibold text-muted">
            Fragen <span className="font-normal">· ziehen zum Sortieren</span>
          </p>
          <QuestionList
            questions={quiz.questions}
            selectedId={selectedId}
            invalidIds={new Set(questionIssues.keys())}
            onSelect={setSelectedId}
            onReorder={(from, to) => update((q) => ({ ...q, questions: arrayMove(q.questions, from, to) }))}
            onAdd={() => addQuestion(selectedIndex >= 0 ? selectedIndex : quiz.questions.length - 1)}
          />
        </aside>

        <section className="rounded-3xl border border-line bg-ink-2/60 p-5 sm:p-8">
          {selected ? (
            <QuestionForm
              key={selected.id}
              question={selected}
              index={selectedIndex}
              total={quiz.questions.length}
              issues={showIssues ? (questionIssues.get(selected.id) ?? []) : []}
              onChange={(nq) => update((q) => ({ ...q, questions: q.questions.map((x) => (x.id === nq.id ? nq : x)) }))}
              onDuplicate={() => addQuestion(selectedIndex, selected)}
              onDelete={() => deleteQuestion(selected.id)}
            />
          ) : (
            <div className="py-16 text-center">
              <p className="text-muted">Noch keine Fragen.</p>
              <Button className="mt-4" onClick={() => addQuestion()}>
                Erste Frage hinzufügen
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
