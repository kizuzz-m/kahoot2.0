"use client";

import { useEffect, useState } from "react";
import { answerStyle } from "@/components/ui/answer-style";
import { Button } from "@/components/ui/Button";
import type { PublicQuestion } from "@/lib/game/protocol";
import { cn } from "@/lib/utils";

/** Antwort-Ansicht auf dem Smartphone. */
export function PlayerAnswer({
  question,
  deadline,
  opensAt,
  onAnswer,
}: {
  question: PublicQuestion;
  deadline: number | null;
  opensAt: number | null;
  onAnswer: (choices: number[]) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(iv);
  }, []);

  const readingLeft = opensAt ? Math.max(0, opensAt - now) : 0;
  const totalMs = question.timeLimit * 1000;
  const remaining = deadline ? Math.min(totalMs, Math.max(0, deadline - now)) : 0;
  const ratio = totalMs ? remaining / totalMs : 0;
  const timeUp = deadline !== null && remaining <= 0;

  if (readingLeft > 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center animate-pop">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Lies die Frage</p>
        <p className="font-display text-2xl font-bold leading-snug sm:text-3xl">{question.text}</p>
        {question.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={question.image} alt="" className="max-h-40 rounded-2xl object-contain" />
        ) : question.hasImage ? (
          <p className="text-sm text-muted">🖼 Schau dir das Bild auf dem großen Bildschirm an</p>
        ) : null}
        <div className="font-display grid h-16 w-16 place-items-center rounded-full border-2 border-brand text-2xl font-extrabold text-brand tabular-nums">
          {Math.ceil(readingLeft / 1000)}
        </div>
        <p className="text-sm text-muted">Gleich erscheinen die Antworten.</p>
      </div>
    );
  }

  if (timeUp) {
    return (
      <div className="grid flex-1 place-items-center text-center animate-pop">
        <div>
          <p className="text-6xl">⏰</p>
          <p className="font-display mt-4 text-3xl font-extrabold">Zeit abgelaufen</p>
          <p className="mt-2 text-muted">Gleich kommt die Auflösung.</p>
        </div>
      </div>
    );
  }

  const toggle = (i: number) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  const many = question.answers.length > 4;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="h-2.5 overflow-hidden rounded-full bg-ink-3" aria-hidden>
        <div
          className={cn("h-full rounded-full transition-[width] duration-200 ease-linear", ratio < 0.25 ? "bg-a1" : "bg-brand")}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-xl font-bold leading-snug sm:text-2xl">{question.text}</p>
        <span className="font-display shrink-0 text-2xl font-extrabold tabular-nums" aria-label="Verbleibende Sekunden">
          {Math.ceil(remaining / 1000)}
        </span>
      </div>
      {question.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.image} alt="" className="mx-auto max-h-40 rounded-2xl object-contain" />
      ) : question.hasImage ? (
        <p className="text-sm text-muted">🖼 Bild auf dem Hauptbildschirm</p>
      ) : null}
      {question.multi && (
        <p className="rounded-xl bg-a4/15 px-3 py-2 text-sm font-semibold text-a4">
          Mehrere Antworten sind richtig – wähle alle aus und tippe auf „Antwort senden“.
        </p>
      )}

      <div className={cn("grid flex-1 gap-3", many ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
        {question.answers.map((text, i) => {
          const s = answerStyle(i);
          const isSel = selected.includes(i);
          return (
            <button
              key={i}
              onClick={() => (question.multi ? toggle(i) : onAnswer([i]))}
              aria-pressed={question.multi ? isSel : undefined}
              className={cn(
                "flex min-h-16 items-center gap-3 rounded-3xl px-4 py-3 text-left text-ink shadow-[0_5px_0_0_rgb(0_0_0/0.35)] transition active:translate-y-1 active:shadow-none",
                s.bg,
                question.multi && !isSel && selected.length > 0 && "opacity-60",
                isSel && "ring-4 ring-paper",
              )}
            >
              <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ink/15 text-xl font-extrabold">
                {isSel ? "✓" : s.letter}
              </span>
              <span className="font-display text-lg font-bold leading-tight">{text}</span>
            </button>
          );
        })}
      </div>

      {question.multi && (
        <Button size="lg" disabled={!selected.length} onClick={() => onAnswer(selected)} className="w-full">
          Antwort senden ({selected.length})
        </Button>
      )}
    </div>
  );
}
