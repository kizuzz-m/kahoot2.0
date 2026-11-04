"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openGameChannel, type ConnectionStatus, type RealtimeChannel } from "../realtime";
import type { Quiz } from "../types";
import { uid } from "../utils";
import {
  addPlayer,
  allAnswered,
  buildSnapshot,
  createHostState,
  finishGame,
  isLastQuestion,
  rankedPlayers,
  removePlayer,
  revealAnswers,
  showLeaderboard,
  startQuestion,
  submitAnswer,
  type HostState,
} from "./engine";
import type { GameMessage } from "./protocol";

const HEARTBEAT_MS = 3000;
const BROADCAST_THROTTLE_MS = 120;
const storageKey = (code: string) => `quizwerk:host:${code}`;

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

function saveState(s: HostState) {
  try {
    // Quiz wird nicht gespeichert (kann große Bilder enthalten) – er wird beim Laden neu geholt.
    const { quiz, ...rest } = s;
    sessionStorage.setItem(storageKey(s.code), JSON.stringify({ ...rest, quizId: quiz.id }));
  } catch {
    /* Speicher voll oder deaktiviert – nicht kritisch */
  }
}

function restoreState(code: string, quiz: Quiz): HostState | null {
  try {
    const raw = sessionStorage.getItem(storageKey(code));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Omit<HostState, "quiz"> & { quizId: string };
    if (parsed.quizId !== quiz.id) return null;
    const { quizId: _ignored, ...rest } = parsed;
    void _ignored;
    return { ...rest, quiz, seq: rest.seq + 1 };
  } catch {
    return null;
  }
}

/**
 * Host-Seite eines Spiels: verwaltet den autoritativen Zustand, wertet Antworten aus
 * und verteilt Snapshots an alle Spieler.
 */
export function useHostGame(code: string) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [state, setState] = useState<HostState | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [now, setNow] = useState(() => Date.now());

  const stateRef = useRef<HostState | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const broadcastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsSaved = useRef(false);

  const broadcastNow = useCallback(() => {
    const s = stateRef.current;
    const ch = channelRef.current;
    if (!s || !ch) return;
    ch.send({ type: "snapshot", snapshot: buildSnapshot(s, Date.now()) });
  }, []);

  const scheduleBroadcast = useCallback(() => {
    if (broadcastTimer.current) return;
    broadcastTimer.current = setTimeout(() => {
      broadcastTimer.current = null;
      broadcastNow();
    }, BROADCAST_THROTTLE_MS);
  }, [broadcastNow]);

  const update = useCallback(
    (fn: (s: HostState) => HostState) => {
      const prev = stateRef.current;
      if (!prev) return;
      const next = fn(prev);
      if (next === prev) return;
      stateRef.current = next;
      setState(next);
      saveState(next);
      // Phasenwechsel sofort senden, kleinere Änderungen gebündelt
      if (next.phase !== prev.phase || next.questionIndex !== prev.questionIndex) broadcastNow();
      else scheduleBroadcast();
    },
    [broadcastNow, scheduleBroadcast],
  );

  /* 1) Spiel und Quiz laden */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const gameRes = await fetch(`/api/games/${code}`);
        if (!gameRes.ok) throw new Error("Spiel nicht gefunden. Starte das Quiz erneut aus der Übersicht.");
        const game = (await gameRes.json()) as { quizId: string };
        const quizRes = await fetch(`/api/quizzes/${game.quizId}`);
        if (!quizRes.ok) throw new Error("Das Quiz zu diesem Spiel existiert nicht mehr.");
        const quiz = (await quizRes.json()) as Quiz;
        if (cancelled) return;
        const initial = restoreState(code, quiz) ?? createHostState(code, quiz, uid());
        stateRef.current = initial;
        setState(initial);
        saveState(initial);
        setLoad({ status: "ready" });
      } catch (err) {
        if (!cancelled) setLoad({ status: "error", message: err instanceof Error ? err.message : String(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  /* 2) Live-Verbindung */
  const ready = load.status === "ready";
  useEffect(() => {
    if (!ready) return;
    const ch = openGameChannel(code);
    channelRef.current = ch;

    const offStatus = ch.onStatus((s) => {
      setConnection(s);
      if (s === "connected") broadcastNow();
    });

    const offMsg = ch.onMessage((msg: GameMessage) => {
      const t = Date.now();
      switch (msg.type) {
        case "join": {
          const s = stateRef.current;
          if (!s) return;
          const res = addPlayer(s, msg.playerId, msg.name, t);
          if (res.ok) {
            if (res.state === s) broadcastNow();
            else update(() => res.state);
          } else {
            ch.send({ type: "join-rejected", playerId: msg.playerId, reason: res.reason });
          }
          break;
        }
        case "hello":
          scheduleBroadcast();
          break;
        case "answer": {
          const s = stateRef.current;
          if (s?.answers[msg.playerId]) {
            scheduleBroadcast(); // Bestätigung erneut senden
            return;
          }
          update((cur) => submitAnswer(cur, msg.playerId, msg.questionIndex, msg.choices, t));
          break;
        }
        case "leave":
          update((cur) => (cur.phase === "lobby" ? removePlayer(cur, msg.playerId, false) : cur));
          break;
      }
    });

    const heartbeat = setInterval(broadcastNow, HEARTBEAT_MS);
    return () => {
      clearInterval(heartbeat);
      offStatus();
      offMsg();
      ch.close();
      channelRef.current = null;
    };
  }, [ready, code, broadcastNow, scheduleBroadcast, update]);

  /* 3) Timer: Frage automatisch beenden, wenn Zeit um ist oder alle geantwortet haben */
  const phase = state?.phase;
  useEffect(() => {
    if (phase !== "question") return;
    let allAnsweredSince = 0;
    const iv = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const s = stateRef.current;
      if (!s || s.phase !== "question") return;
      if (allAnswered(s)) {
        allAnsweredSince ||= t;
        if (t - allAnsweredSince > 700) update((cur) => revealAnswers(cur, Date.now()));
      } else if (t >= s.questionEndsAt + 300) {
        update((cur) => revealAnswers(cur, Date.now()));
      }
    }, 150);
    return () => clearInterval(iv);
  }, [phase, update]);

  /* 4) Ergebnisse speichern, wenn das Spiel endet */
  useEffect(() => {
    if (phase !== "finished" || resultsSaved.current || !stateRef.current) return;
    resultsSaved.current = true;
    const players = rankedPlayers(stateRef.current).map(({ id, name, score, rank }) => ({ id, name, score, rank }));
    void fetch(`/api/games/${code}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players }),
    }).catch(() => undefined);
  }, [phase, code]);

  /* Aktionen */
  const start = useCallback(() => {
    update((s) => startQuestion(s, 0, Date.now()));
    void fetch(`/api/games/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "running" }),
    }).catch(() => undefined);
  }, [update, code]);

  const skip = useCallback(() => update((s) => revealAnswers(s, Date.now())), [update]);

  const next = useCallback(() => {
    update((s) => {
      if (s.phase === "reveal") return isLastQuestion(s) ? finishGame(s) : showLeaderboard(s);
      if (s.phase === "leaderboard") return startQuestion(s, s.questionIndex + 1, Date.now());
      return s;
    });
  }, [update]);

  const finishEarly = useCallback(() => update((s) => finishGame(s)), [update]);
  const kick = useCallback((playerId: string) => update((s) => removePlayer(s, playerId, true)), [update]);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey(code));
    } catch {
      /* egal */
    }
  }, [code]);

  return {
    load,
    state,
    connection,
    channelKind: channelRef.current?.kind,
    now,
    actions: { start, skip, next, finishEarly, kick, clearSession },
  };
}
