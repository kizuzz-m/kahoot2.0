"use client";

import type { GameMessage } from "../game/protocol";
import { loadPublicConfig } from "../runtime-config";
import { LocalRealtimeChannel } from "./local-channel";
import { SupabaseRealtimeChannel } from "./supabase-channel";
import { Emitter, type ConnectionStatus, type RealtimeChannel } from "./types";

/**
 * Öffnet die Live-Verbindung für einen Spielraum – Supabase, falls im Worker konfiguriert,
 * sonst lokaler Relay. Die Konfiguration wird zur Laufzeit von /api/config geladen;
 * bis dahin werden Nachrichten gepuffert.
 */
export function openGameChannel(code: string): RealtimeChannel {
  return new DeferredChannel(code);
}

class DeferredChannel implements RealtimeChannel {
  private inner: RealtimeChannel | null = null;
  private messages = new Emitter<GameMessage>();
  private statuses = new Emitter<ConnectionStatus>();
  private status: ConnectionStatus = "connecting";
  private queue: GameMessage[] = [];
  private closed = false;

  constructor(code: string) {
    void loadPublicConfig().then((cfg) => {
      if (this.closed) return;
      const inner =
        cfg.supabaseUrl && cfg.supabaseAnonKey
          ? new SupabaseRealtimeChannel(code, cfg.supabaseUrl, cfg.supabaseAnonKey)
          : new LocalRealtimeChannel(code);
      this.inner = inner;
      inner.onMessage((m) => this.messages.emit(m));
      inner.onStatus((s) => {
        this.status = s;
        this.statuses.emit(s);
      });
      this.queue.splice(0).forEach((m) => inner.send(m));
    });
  }

  get kind() {
    return this.inner?.kind ?? "pending";
  }

  send(message: GameMessage) {
    if (this.closed) return;
    if (this.inner) return this.inner.send(message);
    this.queue.push(message);
    if (this.queue.length > 50) this.queue.shift();
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
    this.messages.clear();
    this.statuses.clear();
    this.inner?.close();
  }
}

export type { RealtimeChannel, ConnectionStatus } from "./types";
