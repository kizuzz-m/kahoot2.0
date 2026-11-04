"use client";

import { Button } from "@/components/ui/Button";
import { answerStyle } from "@/components/ui/answer-style";
import { rankedPlayers, type HostState } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

export function HostLeaderboard({ state, onNext }: { state: HostState; onNext: () => void }) {
  const ranking = rankedPlayers(state);
  const top = ranking.slice(0, 8);
  const max = Math.max(1, ranking[0]?.score ?? 1);
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-muted">
            Nach Frage {state.questionIndex + 1} von {state.quiz.questions.length}
          </p>
          <h1 className="font-display text-5xl font-extrabold">Rangliste</h1>
        </div>
        <Button size="lg" onClick={onNext}>
          Nächste Frage →
        </Button>
      </div>
      <ol className="mt-8 flex flex-col gap-3">
        {top.map((p, i) => (
          <li
            key={p.id}
            className="relative flex items-center gap-4 overflow-hidden rounded-3xl bg-ink-2 px-5 py-4 animate-rise"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div
              className={cn("absolute inset-y-0 left-0 opacity-25 transition-[width] duration-1000", answerStyle(i).bg)}
              style={{ width: `${(p.score / max) * 100}%` }}
              aria-hidden
            />
            <span className="font-display relative w-10 text-3xl font-extrabold text-muted tabular-nums">{p.rank}</span>
            <span className="font-display relative flex-1 truncate text-2xl font-bold">
              {p.name}
              {p.streak >= 3 && <span className="ml-2 text-lg" title={`${p.streak} richtige in Folge`}>🔥{p.streak}</span>}
            </span>
            {p.lastGained > 0 && (
              <span className="relative rounded-full bg-a3/20 px-3 py-1 text-sm font-bold text-a3 tabular-nums">
                +{p.lastGained}
              </span>
            )}
            <span className="font-display relative text-3xl font-extrabold tabular-nums">{p.score}</span>
          </li>
        ))}
      </ol>
      {ranking.length > top.length && (
        <p className="mt-4 text-center text-muted">… und {ranking.length - top.length} weitere</p>
      )}
    </div>
  );
}
