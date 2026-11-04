"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { openGameChannel, type ConnectionStatus, type RealtimeChannel } from "../realtime";
import { uid } from "../utils";
import type { GameMessage, PublicSnapshot } from "./protocol";

export type PlayerStage = "name" | "joining" | "joined" | "rejected" | "kicked";

const HOST_TIMEOUT_MS = 12000;
const RETRY_MS = 1800;
const storageKey = (code: string) => `quizwerk:player:${code}`;

interface Identity {
  id: string;
  name: string;
}

function loadIdentity(code: string): Identity | null {
  try {
    const raw = localStorage.getItem(storageKey(code));
    return raw ? (JSON.parse(raw) as Identity) : null;
  } catch {
    return null;
  }
}

function saveIdentity(code: string, identity: Identity) {
  try {
    localStorage.setItem(storageKey(code), JSON.stringify(identity));
  } catch {
    /* egal */
  }
}

/** Spieler-Seite: tritt bei, empfängt Snapshots und sendet Antworten. */
export function usePlayerGame(code: string) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [stage, setStage] = useState<PlayerStage>("name");
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [hostLost, setHostLost] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [myAnswer, setMyAnswer] = useState<{ questionIndex: number; choices: number[] } | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const identityRef = useRef<Identity | null>(null);
  const snapshotRef = useRef<PublicSnapshot | null>(null);
  const stageRef = useRef<PlayerStage>("name");
  const lastHostMsg = useRef(Date.now());
  const answerRef = useRef<typeof myAnswer>(null);

  const setStageBoth = (s: PlayerStage) => {
    stageRef.current = s;
    setStage(s);
  };

  /* Gespeicherte Identität laden → automatischer Wiederbeitritt nach Neuladen */
  useEffect(() => {
    const saved = loadIdentity(code);
    if (saved) {
      identityRef.current = saved;
      setIdentity(saved);
      setStageBoth("joining");
    }
  }, [code]);

  /* Live-Verbindung */
  useEffect(() => {
    const ch = openGameChannel(code);
    channelRef.current = ch;

    const offStatus = ch.onStatus((s) => {
      setConnection(s);
      if (s === "connected") {
        const id = identityRef.current;
        if (id && stageRef.current === "joining") ch.send({ type: "join", playerId: id.id, name: id.name });
        else if (id) ch.send({ type: "hello", playerId: id.id });
      }
    });

    const offMsg = ch.onMessage((msg: GameMessage) => {
      const me = identityRef.current;
      if (msg.type === "snapshot") {
        lastHostMsg.current = Date.now();
        setHostLost(false);
        const prev = snapshotRef.current;
        const snap = msg.snapshot;
        if (prev && prev.sessionId === snap.sessionId && snap.seq < prev.seq) return; // veraltet
        snapshotRef.current = snap;
        setSnapshot(snap);

        if (snap.phase === "question" && snap.question) {
          const candidate = Date.now() + snap.question.remainingMs;
          const isNew = !prev || prev.phase !== "question" || prev.questionIndex !== snap.questionIndex;
          setDeadline((d) => (isNew || d === null ? candidate : Math.min(d, candidate)));
        } else {
          setDeadline(null);
        }

        if (me) {
          if (snap.kicked.includes(me.id)) {
            setStageBoth("kicked");
            try {
              localStorage.removeItem(storageKey(code));
            } catch {
              /* egal */
            }
          } else if (snap.players.some((p) => p.id === me.id)) {
            if (stageRef.current === "joining") setStageBoth("joined");
          } else if (stageRef.current === "joined") {
            // Host kennt uns nicht mehr (z. B. neue Sitzung) → erneut beitreten
            setStageBoth("joining");
            ch.send({ type: "join", playerId: me.id, name: me.name });
          }
        }
      } else if (msg.type === "join-rejected" && me && msg.playerId === me.id) {
        setRejectReason(msg.reason);
        setStageBoth("rejected");
      }
    });

    const watchdog = setInterval(() => {
      setHostLost(Date.now() - lastHostMsg.current > HOST_TIMEOUT_MS);
    }, 2000);

    return () => {
      clearInterval(watchdog);
      offStatus();
      offMsg();
      ch.close();
      channelRef.current = null;
    };
  }, [code]);

  /* Beitritt so lange wiederholen, bis der Host uns in der Spielerliste führt */
  useEffect(() => {
    if (stage !== "joining") return;
    const send = () => {
      const id = identityRef.current;
      if (id) channelRef.current?.send({ type: "join", playerId: id.id, name: id.name });
    };
    send();
    const iv = setInterval(send, RETRY_MS);
    return () => clearInterval(iv);
  }, [stage]);

  /* Antwort erneut senden, bis der Host sie bestätigt (answeredIds) */
  useEffect(() => {
    if (!myAnswer || !identity) return;
    let tries = 0;
    const iv = setInterval(() => {
      const snap = snapshotRef.current;
      if (!snap || snap.phase !== "question" || snap.questionIndex !== myAnswer.questionIndex) return clearInterval(iv);
      if (snap.answeredIds.includes(identity.id) || tries++ > 5) return clearInterval(iv);
      channelRef.current?.send({ type: "answer", playerId: identity.id, ...myAnswer });
    }, 1200);
    return () => clearInterval(iv);
  }, [myAnswer, identity]);

  const join = useCallback(
    (name: string) => {
      const id: Identity = { id: identityRef.current?.id ?? uid(), name: name.trim() };
      identityRef.current = id;
      setIdentity(id);
      saveIdentity(code, id);
      setRejectReason(null);
      setStageBoth("joining");
    },
    [code],
  );

  const resetName = useCallback(() => {
    setRejectReason(null);
    setStageBoth("name");
  }, []);

  const answer = useCallback((choices: number[]) => {
    const snap = snapshotRef.current;
    const id = identityRef.current;
    if (!snap || !id || snap.phase !== "question") return;
    if (answerRef.current?.questionIndex === snap.questionIndex) return;
    const a = { questionIndex: snap.questionIndex, choices };
    answerRef.current = a;
    setMyAnswer(a);
    channelRef.current?.send({ type: "answer", playerId: id.id, ...a });
  }, []);

  const leave = useCallback(() => {
    const id = identityRef.current;
    if (id) channelRef.current?.send({ type: "leave", playerId: id.id });
    try {
      localStorage.removeItem(storageKey(code));
    } catch {
      /* egal */
    }
  }, [code]);

  const answeredCurrent =
    snapshot && myAnswer && snapshot.questionIndex === myAnswer.questionIndex ? myAnswer : null;

  return {
    identity,
    stage,
    rejectReason,
    snapshot,
    connection,
    hostLost,
    deadline,
    myAnswer: answeredCurrent,
    actions: { join, answer, resetName, leave },
  };
}
