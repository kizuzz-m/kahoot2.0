"use client";

import { answerStyle } from "@/components/ui/answer-style";
import { Button } from "@/components/ui/Button";
import { LIMITS, POINT_OPTIONS, TIME_OPTIONS, type Question } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { ImageInput } from "./ImageInput";

interface Props {
  question: Question;
  index: number;
  total: number;
  issues: string[];
  onChange: (q: Question) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function QuestionForm({ question: q, index, total, issues, onChange, onDuplicate, onDelete }: Props) {
  const set = <K extends keyof Question>(key: K, value: Question[K]) => onChange({ ...q, [key]: value });
  const correctCount = q.answers.filter((a) => a.correct).length;

  const timeOptions = TIME_OPTIONS.includes(q.timeLimit) ? TIME_OPTIONS : [...TIME_OPTIONS, q.timeLimit].sort((a, b) => a - b);
  const pointOptions = POINT_OPTIONS.includes(q.points) ? POINT_OPTIONS : [...POINT_OPTIONS, q.points].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">
          Frage {index + 1} <span className="text-muted">/ {total}</span>
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDuplicate}>
            Duplizieren
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={total <= 1}>
            Löschen
          </Button>
        </div>
      </div>

      <div>
        <label htmlFor={`qtext-${q.id}`} className="mb-2 block text-sm font-semibold text-muted">
          Fragetext
        </label>
        <textarea
          id={`qtext-${q.id}`}
          className="field font-display min-h-24 resize-y text-2xl font-semibold"
          placeholder="Stelle deine Frage …"
          value={q.text}
          maxLength={500}
          onChange={(e) => set("text", e.target.value)}
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold text-muted">Bild (optional)</span>
        <ImageInput value={q.image} onChange={(v) => set("image", v)} />
      </div>

      <fieldset>
        <legend className="mb-2 flex w-full items-center justify-between text-sm font-semibold text-muted">
          <span>
            Antworten <span className="font-normal">({q.answers.length}/{LIMITS.maxAnswers})</span>
          </span>
          <span className="font-normal">
            {correctCount > 1 ? `${correctCount} richtige Antworten – Mehrfachauswahl` : "Markiere die richtige(n) Antwort(en)"}
          </span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {q.answers.map((a, i) => {
            const style = answerStyle(i);
            return (
              <div
                key={a.id}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border-2 bg-ink-2 p-2 transition-colors",
                  a.correct ? "border-a3" : "border-line",
                )}
              >
                <span className={cn("font-display grid h-10 w-10 shrink-0 place-items-center rounded-xl font-extrabold text-ink", style.bg)}>
                  {style.letter}
                </span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 font-medium outline-none placeholder:text-muted/60"
                  placeholder={`Antwort ${i + 1}`}
                  value={a.text}
                  maxLength={200}
                  aria-label={`Antwort ${style.letter}`}
                  onChange={(e) =>
                    set(
                      "answers",
                      q.answers.map((x) => (x.id === a.id ? { ...x, text: e.target.value } : x)),
                    )
                  }
                />
                <button
                  type="button"
                  role="switch"
                  aria-checked={a.correct}
                  aria-label={`Antwort ${style.letter} ist richtig`}
                  title={a.correct ? "Richtig" : "Als richtig markieren"}
                  onClick={() =>
                    set(
                      "answers",
                      q.answers.map((x) => (x.id === a.id ? { ...x, correct: !x.correct } : x)),
                    )
                  }
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-lg font-bold transition",
                    a.correct ? "border-a3 bg-a3 text-ink" : "border-line text-transparent hover:border-a3/60 hover:text-a3/60",
                  )}
                >
                  ✓
                </button>
                <button
                  type="button"
                  aria-label={`Antwort ${style.letter} entfernen`}
                  disabled={q.answers.length <= LIMITS.minAnswers}
                  onClick={() => set("answers", q.answers.filter((x) => x.id !== a.id))}
                  className="grid h-9 w-7 shrink-0 place-items-center rounded-lg text-muted hover:text-a1 disabled:opacity-20"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
        {q.answers.length < LIMITS.maxAnswers && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => set("answers", [...q.answers, { id: uid(), text: "", correct: false }])}
          >
            + Antwort hinzufügen
          </Button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-muted">Zeitlimit</span>
          <select className="field" value={q.timeLimit} onChange={(e) => set("timeLimit", Number(e.target.value))}>
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t < 60 ? `${t} Sekunden` : `${t / 60} Minute${t > 60 ? "n" : ""}`}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-muted">Punkte</span>
          <select className="field" value={q.points} onChange={(e) => set("points", Number(e.target.value))}>
            {pointOptions.map((p) => (
              <option key={p} value={p}>
                {p === 0 ? "Keine Punkte (Umfrage/Aufwärmen)" : p === 1000 ? "1000 (Standard)" : p === 2000 ? "2000 (doppelt)" : String(p)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-muted">Erklärung nach der Antwort (optional)</span>
        <textarea
          className="field min-h-20 resize-y"
          placeholder="Wird nach der Auflösung auf allen Geräten angezeigt."
          value={q.explanation ?? ""}
          maxLength={1000}
          onChange={(e) => set("explanation", e.target.value || undefined)}
        />
      </label>

      {issues.length > 0 && (
        <ul className="rounded-2xl border border-a1/40 bg-a1/10 px-4 py-3 text-sm text-a1">
          {issues.map((m) => (
            <li key={m}>• {m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
