"use client";

import { RELAY_PORT, RELAY_URL } from "../config";
import type { GameMessage } from "../game/protocol";
import { Emitter, type ConnectionStatus, type RealtimeChannel } from "./types";

function relayUrl(code: string): string {
  const base =
    RELAY_URL ||
    `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${RELAY_PORT}`;
  return `${base.replace(/\/$/, "")}/?room=${encodeURIComponent(code)}`;
}

/**
 * Live-Verbindung über den lokalen Relay (relay/server.mjs).
 * Verbindet sich automatisch neu (mit Backoff), Nachrichten werden solange gepuffert.
 */
export class LocalRealtimeChannel implements RealtimeChannel {
  readonly kind = "local" as const;
  private ws: WebSocket | null = null;
  private messages = new Emitter<GameMessage>();
  private statuses = new Emitter<ConnectionStatus>();
  private status: ConnectionStatus = "connecting";
  private queue: string[] = [];
  private closed = false;
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private code: string) {
    this.connect();
  }

  private connect() {
    if (this.closed) return;
    this.setStatus("connecting");
    const ws = new WebSocket(relayUrl(this.code));
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.setStatus("connected");
      const pending = this.queue.splice(0);
      pending.forEach((m) => ws.send(m));
    };
    ws.onmessage = (ev) => {
      try {
        this.messages.emit(JSON.parse(String(ev.data)) as GameMessage);
      } catch {
        /* ungültige Nachricht ignorieren */
      }
    };
    ws.onclose = () => {
      if (this.closed) return;
      this.setStatus("disconnected");
      const delay = Math.min(8000, 500 * 2 ** this.retry++);
      this.timer = setTimeout(() => this.connect(), delay);
    };
    ws.onerror = () => ws.close();
  }

  private setStatus(s: ConnectionStatus) {
    if (this.status === s) return;
    this.status = s;
    this.statuses.emit(s);
  }

  send(message: GameMessage) {
    if (this.closed) return;
    const data = JSON.stringify(message);
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data);
    else {
      this.queue.push(data);
      if (this.queue.length > 50) this.queue.shift();
    }
  }

  onMessage(handler: (m: GameMessage) => void) {
    return this.messages.on(handler);
  }

  onStatus(handler: (s: ConnectionStatus) => void) {
    handler(this.status);
    return this.statuses.on(handler);
  }

  close() {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    this.messages.clear();
    this.statuses.clear();
    this.ws?.close();
  }
}
