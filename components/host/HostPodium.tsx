"use client";

import { Button, LinkButton } from "@/components/ui/Button";
import { rankedPlayers, type HostState } from "@/lib/game/engine";
import { cn } from "@/lib/utils";

export function HostPodium({ state, onPlayAgain }: { state: HostState; onPlayAgain: () => void }) {
  const ranking = rankedPlayers(state);
  const [first, second, third] = ranking;
  const podium = [
    { p: second, place: 2, height: "h-40", color: "bg-a4", delay: "300ms" },
    { p: first, place: 1, height: "h-56", color: "bg-a2", delay: "700ms" },
    { p: third, place: 3, height: "h-28", color: "bg-a1", delay: "0ms" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-5 py-8 sm:px-8">
      <p className="text-sm font-bold uppercase tracking-widest text-muted">{state.quiz.title}</p>
      <h1 className="font-display text-5xl font-extrabold sm:text-6xl">Endstand 🎉</h1>

      <div className="mt-12 flex w-full max-w-3xl items-end justify-center gap-3 sm:gap-5">
        {podium.map(({ p, place, height, color, delay }) => (
          <div key={place} className="flex flex-1 flex-col items-center animate-rise" style={{ animationDelay: delay }}>
            {p ? (
              <>
                <p className="font-display mb-1 max-w-full truncate text-center text-xl font-extrabold sm:text-2xl">{p.name}</p>
                <p className="mb-3 text-sm text-muted tabular-nums">{p.score} Punkte</p>
              </>
            ) : (
              <p className="mb-3 text-muted">–</p>
            )}
            <div className={cn("font-display grid w-full place-items-center rounded-t-3xl text-6xl font-extrabold text-ink", height, color)}>
              {place}
            </div>
          </div>
        ))}
      </div>

      {ranking.length > 3 && (
        <ol className="mt-10 grid w-full max-w-3xl gap-2 sm:grid-cols-2">
          {ranking.slice(3).map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-ink-2 px-4 py-2.5">
              <span className="w-8 font-bold text-muted tabular-nums">{p.rank}.</span>
              <span className="flex-1 truncate font-semibold">{p.name}</span>
              <span className="font-bold tabular-nums">{p.score}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={onPlayAgain}>
          Nochmal spielen
        </Button>
        <LinkButton href="/admin" variant="secondary" size="lg">
          Zur Übersicht
        </LinkButton>
      </div>
    </div>
  );
}
