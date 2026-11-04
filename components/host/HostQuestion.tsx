"use client";

import { answerStyle } from "@/components/ui/answer-style";
import { Button } from "@/components/ui/Button";
import { TimerRing } from "@/components/ui/TimerRing";
import { correctIndices, isLastQuestion, isMultiSelect, type HostState } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

/** Frage- und Auflösungsansicht für den großen Bildschirm. */
export function HostQuestion({
  state,
  now,
  onSkip,
  onNext,
}: {
  state: HostState;
  now: number;
  onSkip: () => void;
  onNext: () => void;
}) {
  const q = state.quiz.questions[state.questionIndex];
  if (!q) return null;
  const revealed = state.phase === "reveal";
  const correct = new Set(correctIndices(q));
  const answeredCount = Object.keys(state.answers).length;
  const playerCount = Object.keys(state.players).length;
  const counts = q.answers.map((_, i) => Object.values(state.answers).filter((a) => a.choices.includes(i)).length);
  const maxCount = Math.max(1, ...counts);
  const remaining = Math.max(0, state.questionEndsAt - now);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-5 py-5 sm:px-8">
      <div className="rounded-[28px] bg-paper px-6 py-6 text-center text-ink shadow-xl sm:px-10">
        <p className="text-sm font-bold uppercase tracking-widest text-ink/50">
          Frage {state.questionIndex + 1} von {state.quiz.questions.length}
          {isMultiSelect(q) && " · Mehrere Antworten richtig"}
          {q.points === 0 && " · ohne Wertung"}
          {q.points >= 2000 && " · doppelte Punkte"}
        </p>
        <h1 className="font-display mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">{q.text}</h1>
      </div>

      <div className="grid flex-1 items-center gap-5 md:grid-cols-[140px_1fr_140px]">
        <div className="flex justify-center md:justify-start">
          {!revealed ? (
            <TimerRing remainingMs={remaining} totalMs={q.timeLimit * 1000} size={128} />
          ) : (
            <div className="font-display text-center text-xl font-bold text-a3">Auflösung</div>
          )}
        </div>
        <div className="flex min-h-[200px] items-center justify-center">
          {q.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.image} alt="" className="max-h-[38vh] rounded-3xl object-contain shadow-2xl" />
          ) : revealed && q.explanation ? (
            <p className="max-w-2xl rounded-3xl border border-a3/40 bg-a3/10 px-6 py-5 text-center text-xl animate-pop">
              💡 {q.explanation}
            </p>
          ) : !revealed ? (
            <div className="font-display text-center text-2xl text-muted">Antworte auf deinem Gerät!</div>
          ) : null}
        </div>
        <div className="flex flex-col items-center gap-3 md:items-end">
          <div className="text-center md:text-right">
            <p className="font-display text-5xl font-extrabold tabular-nums">{answeredCount}</p>
            <p className="text-sm text-muted">von {playerCount} Antworten</p>
          </div>
          {revealed ? (
            <Button size="lg" onClick={onNext}>
              {isLastQuestion(state) ? "Endergebnis" : "Weiter"}
            </Button>
          ) : (
            <Button variant="secondary" onClick={onSkip}>
              Überspringen
            </Button>
          )}
        </div>
      </div>

      {revealed && q.explanation && q.image && (
        <p className="mx-auto max-w-3xl rounded-3xl border border-a3/40 bg-a3/10 px-6 py-4 text-center text-lg animate-pop">
          💡 {q.explanation}
        </p>
      )}

      <div className={cn("grid gap-3 sm:gap-4", q.answers.length <= 2 ? "sm:grid-cols-2" : q.answers.length <= 4 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
        {q.answers.map((a, i) => {
          const s = answerStyle(i);
          const isRight = correct.has(i);
          return (
            <div
              key={a.id}
              className={cn(
                "relative flex min-h-20 items-center gap-4 overflow-hidden rounded-3xl px-5 py-4 text-ink transition-all duration-500",
                s.bg,
                revealed && !isRight && "opacity-30 saturate-50",
                revealed && isRight && "ring-4 ring-paper animate-pop",
              )}
            >
              {revealed && (
                <div
                  className="absolute inset-y-0 left-0 bg-ink/15 transition-[width] duration-700"
                  style={{ width: `${(counts[i] / maxCount) * 100}%` }}
                  aria-hidden
                />
              )}
              <span className="font-display relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink/15 text-2xl font-extrabold">
                {s.letter}
              </span>
              <span className="font-display relative flex-1 text-xl font-bold leading-snug sm:text-2xl">{a.text}</span>
              {revealed && (
                <span className="font-display relative text-2xl font-extrabold tabular-nums">
                  {isRight ? "✓ " : ""}
                  {counts[i]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
