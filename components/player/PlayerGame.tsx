"use client";

import { useEffect, useState } from "react";
import { answerStyle } from "@/components/ui/answer-style";
import { Button, LinkButton } from "@/components/ui/Button";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { LogoMark } from "@/components/ui/Logo";
import { api } from "@/lib/client-api";
import { MAX_NAME_LENGTH } from "@/lib/game/engine";
import type { PublicSnapshot } from "@/lib/game/protocol";
import { usePlayerGame } from "@/lib/game/usePlayerGame";
import { cn } from "@/lib/utils";
import { PlayerAnswer } from "./PlayerAnswer";

export function PlayerGame({ code }: { code: string }) {
  const { identity, stage, rejectReason, snapshot, connection, hostLost, deadline, opensAt, myAnswer, actions } =
    usePlayerGame(code);
  const [gameCheck, setGameCheck] = useState<{ ok: boolean; title?: string; message?: string } | null>(null);

  useEffect(() => {
    api.getGame(code).then(
      (g) =>
        setGameCheck(
          g.status === "finished" ? { ok: false, message: "Dieses Spiel ist bereits beendet." } : { ok: true, title: g.quizTitle },
        ),
      (err: Error) => setGameCheck({ ok: false, message: err.message }),
    );
  }, [code]);

  const me = snapshot?.players.find((p) => p.id === identity?.id);

  let body: React.ReactNode;
  if (gameCheck && !gameCheck.ok && stage !== "joined") {
    body = (
      <Centered emoji="🔍" title="Spiel nicht gefunden" text={gameCheck.message}>
        <LinkButton href="/" className="mt-6">
          Anderen Code eingeben
        </LinkButton>
      </Centered>
    );
  } else if (stage === "name" || stage === "rejected") {
    body = (
      <NameForm
        title={gameCheck?.title}
        initial={identity?.name ?? ""}
        error={stage === "rejected" ? rejectReason : null}
        onSubmit={actions.join}
      />
    );
  } else if (stage === "kicked") {
    body = (
      <Centered emoji="👋" title="Du wurdest entfernt" text="Der Host hat dich aus dem Spiel entfernt.">
        <LinkButton href="/" className="mt-6">
          Zur Startseite
        </LinkButton>
      </Centered>
    );
  } else if (stage === "joining" || !snapshot) {
    body = <Centered emoji="📡" title="Verbinde mit dem Spiel …" text="Einen Moment, gleich bist du dabei." pulse />;
  } else {
    body = <JoinedView snapshot={snapshot} playerId={identity!.id} deadline={deadline} opensAt={opensAt} myAnswer={myAnswer} onAnswer={actions.answer} />;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 pb-6">
      <header className="flex items-center gap-3 py-3">
        <LogoMark className="h-8 w-8" />
        {identity && stage === "joined" ? (
          <span className="truncate font-semibold">{identity.name}</span>
        ) : (
          <span className="text-sm text-muted">Spiel {code}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {me && <span className="font-display rounded-full bg-ink-3 px-3 py-1 font-bold tabular-nums">{me.score}</span>}
          <ConnectionBadge status={connection} />
        </div>
      </header>
      {hostLost && stage === "joined" && snapshot?.phase !== "finished" && (
        <div className="mb-3 rounded-2xl border border-a2/40 bg-a2/10 px-4 py-2 text-sm text-a2" role="status">
          Keine Verbindung zum Host – warte auf Rückkehr …
        </div>
      )}
      <div className="flex flex-1 flex-col">{body}</div>
    </main>
  );
}

function Centered({
  emoji,
  title,
  text,
  pulse,
  children,
}: {
  emoji: string;
  title: string;
  text?: string;
  pulse?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid flex-1 place-items-center text-center animate-pop">
      <div>
        <p className={cn("text-6xl", pulse && "animate-pulse")}>{emoji}</p>
        <p className="font-display mt-4 text-3xl font-extrabold">{title}</p>
        {text && <p className="mx-auto mt-2 max-w-sm text-paper/70">{text}</p>}
        {children}
      </div>
    </div>
  );
}

function NameForm({
  title,
  initial,
  error,
  onSubmit,
}: {
  title?: string;
  initial: string;
  error: string | null;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  return (
    <form
      className="flex flex-1 flex-col justify-center gap-4 animate-rise"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
    >
      {title && <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted">{title}</p>}
      <label htmlFor="player-name" className="font-display text-center text-4xl font-extrabold">
        Wie heißt du?
      </label>
      <input
        id="player-name"
        className="field font-display text-center text-2xl font-bold"
        placeholder="Dein Spielname"
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        autoComplete="nickname"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p className="text-center font-medium text-a1">{error}</p>}
      <Button type="submit" size="lg" disabled={!name.trim()}>
        Los geht’s!
      </Button>
    </form>
  );
}

function JoinedView({
  snapshot: s,
  playerId,
  deadline,
  opensAt,
  myAnswer,
  onAnswer,
}: {
  snapshot: PublicSnapshot;
  playerId: string;
  deadline: number | null;
  opensAt: number | null;
  myAnswer: { questionIndex: number; choices: number[] } | null;
  onAnswer: (choices: number[]) => void;
}) {
  const me = s.players.find((p) => p.id === playerId);

  if (s.phase === "lobby") {
    return (
      <Centered
        emoji="🎉"
        title={`Du bist dabei${me ? `, ${me.name}` : ""}!`}
        text={`Siehst du deinen Namen auf dem Bildschirm? Warte, bis der Host startet. (${s.players.length} im Spiel)`}
      />
    );
  }

  if (s.phase === "question" && s.question) {
    if (myAnswer) {
      const acknowledged = s.answeredIds.includes(playerId);
      return (
        <Centered
          emoji="🚀"
          title="Antwort gesendet!"
          text={acknowledged ? "Warte auf die anderen …" : "Wird übertragen …"}
        >
          <div className="mt-5 flex justify-center gap-2">
            {myAnswer.choices.map((c) => (
              <span key={c} className={cn("font-display grid h-12 w-12 place-items-center rounded-2xl text-xl font-extrabold text-ink", answerStyle(c).bg)}>
                {answerStyle(c).letter}
              </span>
            ))}
          </div>
        </Centered>
      );
    }
    return <PlayerAnswer key={s.questionIndex} question={s.question} deadline={deadline} opensAt={opensAt} onAnswer={onAnswer} />;
  }

  if ((s.phase === "reveal" || s.phase === "leaderboard") && s.reveal) {
    const r = s.reveal.results[playerId];
    const correct = r?.correct ?? false;
    const answered = (r?.choices.length ?? 0) > 0;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <div
          className={cn(
            "w-full rounded-[32px] px-6 py-10 animate-pop",
            correct ? "bg-a3 text-ink" : "bg-a1 text-ink",
          )}
        >
          <p className="text-6xl">{correct ? "✓" : answered ? "✗" : "⏰"}</p>
          <p className="font-display mt-2 text-4xl font-extrabold">
            {correct ? "Richtig!" : answered ? "Leider falsch" : "Keine Antwort"}
          </p>
          {correct && (
            <p className="font-display mt-2 text-2xl font-bold tabular-nums">+{r?.gained ?? 0} Punkte</p>
          )}
          {r && r.streak >= 2 && <p className="mt-2 font-semibold">🔥 {r.streak} richtige in Folge</p>}
        </div>
        {!correct && s.question && (
          <p className="text-paper/80">
            Richtig war:{" "}
            <strong>{s.reveal.correct.map((i) => `${answerStyle(i).letter} – ${s.question!.answers[i]}`).join(", ")}</strong>
          </p>
        )}
        {s.reveal.explanation && (
          <p className="w-full rounded-2xl border border-a3/30 bg-a3/10 px-4 py-3 text-left">💡 {s.reveal.explanation}</p>
        )}
        {me && (
          <p className="font-display text-2xl font-bold">
            Platz {me.rank} <span className="text-muted">von {s.players.length}</span> · {me.score} Punkte
          </p>
        )}
      </div>
    );
  }

  if (s.phase === "finished") {
    const top = s.players.slice(0, 3);
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center animate-pop">
        <p className="text-7xl">{me?.rank === 1 ? "🏆" : me?.rank === 2 ? "🥈" : me?.rank === 3 ? "🥉" : "🎉"}</p>
        <div>
          <p className="font-display text-4xl font-extrabold">{me ? `Platz ${me.rank}` : "Spiel beendet"}</p>
          {me && <p className="mt-1 text-xl text-paper/80 tabular-nums">{me.score} Punkte</p>}
        </div>
        <ol className="w-full max-w-sm space-y-2">
          {top.map((p) => (
            <li
              key={p.id}
              className={cn("flex items-center gap-3 rounded-2xl bg-ink-2 px-4 py-2.5", p.id === playerId && "ring-2 ring-brand")}
            >
              <span className="w-6 font-bold text-muted">{p.rank}.</span>
              <span className="flex-1 truncate text-left font-semibold">{p.name}</span>
              <span className="font-bold tabular-nums">{p.score}</span>
            </li>
          ))}
        </ol>
        <LinkButton href="/" variant="secondary">
          Zur Startseite
        </LinkButton>
      </div>
    );
  }

  return <Centered emoji="⏳" title="Gleich geht’s weiter …" />;
}
