"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { answerStyle } from "@/components/ui/answer-style";
import type { HostState } from "@/lib/game/engine";
import { cn } from "@/lib/utils";
import { useJoinUrl } from "./useJoinUrl";

export function HostLobby({ state, onStart, onKick }: { state: HostState; onStart: () => void; onKick: (id: string) => void }) {
  const { url, display, isLocalOnly } = useJoinUrl(state.code);
  const players = Object.values(state.players).sort((a, b) => a.joinedAt - b.joinedAt);
  const code = `${state.code.slice(0, 3)} ${state.code.slice(3)}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-6 sm:px-8">
      <div className="grid items-stretch gap-6 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center rounded-[32px] border border-line bg-ink-2 p-6 sm:p-10">
          <p className="text-lg text-paper/75">
            Beitreten auf <strong className="text-paper">{display || "…"}</strong> oder QR-Code scannen
          </p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-muted">Spielcode</p>
          <p className="font-display text-7xl font-extrabold tracking-wider text-brand tabular-nums sm:text-8xl lg:text-9xl">
            {code}
          </p>
          <p className="mt-4 text-paper/60">{state.quiz.title} · {state.quiz.questions.length} Fragen</p>
          {isLocalOnly && (
            <p className="mt-4 rounded-2xl border border-a2/40 bg-a2/10 px-4 py-3 text-sm text-a2">
              Diese Seite läuft über „localhost“ und es wurde keine Netzwerk-Adresse gefunden. Andere Geräte können so nicht
              beitreten – siehe README, Abschnitt „Im WLAN spielen“.
            </p>
          )}
        </div>
        <div className="grid place-items-center rounded-[32px] bg-paper p-6">
          {url ? (
            <QRCodeSVG value={url} size={260} level="M" bgColor="#f6f3ec" fgColor="#0c1424" marginSize={0} />
          ) : (
            <div className="h-[260px] w-[260px] animate-pulse rounded-xl bg-ink/10" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-bold">
            {players.length} {players.length === 1 ? "Spieler" : "Spieler:innen"}
          </h2>
          <Button size="lg" onClick={onStart} disabled={players.length === 0}>
            Quiz starten →
          </Button>
        </div>
        {players.length === 0 ? (
          <p className="mt-10 text-center text-xl text-muted">Warte auf Mitspieler … 📱</p>
        ) : (
          <ul className="mt-6 flex flex-wrap gap-3">
            {players.map((p, i) => (
              <li key={p.id} className="animate-pop">
                <button
                  onClick={() => onKick(p.id)}
                  title="Klicken, um zu entfernen"
                  className={cn(
                    "group font-display rounded-2xl px-5 py-3 text-xl font-bold text-ink transition hover:line-through hover:opacity-70",
                    answerStyle(i).bg,
                  )}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {players.length > 0 && <p className="mt-4 text-sm text-muted">Tipp: Auf einen Namen klicken, um die Person zu entfernen.</p>}
      </div>
    </div>
  );
}
