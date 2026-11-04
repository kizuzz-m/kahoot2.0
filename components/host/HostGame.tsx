"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { LogoMark } from "@/components/ui/Logo";
import { api } from "@/lib/client-api";
import { useHostGame } from "@/lib/game/useHostGame";
import { HostLeaderboard } from "./HostLeaderboard";
import { HostLobby } from "./HostLobby";
import { HostPodium } from "./HostPodium";
import { HostQuestion } from "./HostQuestion";

export function HostGame({ code }: { code: string }) {
  const router = useRouter();
  const { load, state, connection, now, actions } = useHostGame(code);
  const [restarting, setRestarting] = useState(false);

  if (load.status === "error") {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="font-display text-3xl font-bold">Spiel konnte nicht geladen werden</p>
          <p className="mt-2 text-muted">{load.message}</p>
          <LinkButton href="/admin" className="mt-6">
            Zur Übersicht
          </LinkButton>
        </div>
      </main>
    );
  }
  if (!state) return <main className="grid min-h-dvh place-items-center text-muted">Lade Spiel …</main>;

  async function playAgain() {
    if (!state) return;
    setRestarting(true);
    try {
      actions.clearSession();
      const game = await api.createGame(state.quiz.id);
      router.push(`/admin/host/${game.code}`);
    } catch {
      setRestarting(false);
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  const playerCount = Object.keys(state.players).length;

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 border-b border-line/60 px-5 py-3 sm:px-8">
        <LogoMark className="h-8 w-8" />
        <span className="hidden font-semibold sm:inline">{state.quiz.title}</span>
        {state.phase !== "lobby" && (
          <span className="rounded-full bg-ink-3 px-3 py-1 text-sm font-bold tracking-wider tabular-nums">
            Code {state.code}
          </span>
        )}
        <span className="text-sm text-muted">👥 {playerCount}</span>
        <div className="ml-auto flex items-center gap-2">
          <ConnectionBadge status={connection} />
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} title="Vollbild">
            ⛶
          </Button>
          {state.phase !== "finished" && state.phase !== "lobby" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => confirm("Spiel jetzt beenden und Endstand zeigen?") && actions.finishEarly()}
            >
              Beenden
            </Button>
          )}
          {state.phase === "lobby" && (
            <LinkButton href="/admin" variant="ghost" size="sm">
              Abbrechen
            </LinkButton>
          )}
        </div>
      </header>

      {state.phase === "lobby" && <HostLobby state={state} onStart={actions.start} onKick={actions.kick} />}
      {(state.phase === "question" || state.phase === "reveal") && (
        <HostQuestion state={state} now={now} onSkip={actions.skip} onNext={actions.next} />
      )}
      {state.phase === "leaderboard" && <HostLeaderboard state={state} onNext={actions.next} />}
      {state.phase === "finished" && <HostPodium state={state} onPlayAgain={restarting ? () => undefined : playAgain} />}
    </main>
  );
}
