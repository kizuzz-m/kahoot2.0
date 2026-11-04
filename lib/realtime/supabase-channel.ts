"use client";

import { createClient, type RealtimeChannel as SbChannel, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";
import type { GameMessage } from "../game/protocol";
import { Emitter, type ConnectionStatus, type RealtimeChannel } from "./types";

let client: SupabaseClient | null = null;
function getClient() {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}

const EVENT = "qw";

/** Live-Verbindung über Supabase Realtime Broadcast. */
export class SupabaseRealtimeChannel implements RealtimeChannel {
  readonly kind = "supabase" as const;
  private channel: SbChannel;
  private messages = new Emitter<GameMessage>();
  private statuses = new Emitter<ConnectionStatus>();
  private status: ConnectionStatus = "connecting";
  private queue: GameMessage[] = [];
  private closed = false;

  constructor(code: string) {
    this.channel = getClient().channel(`quizwerk:${code}`, {
      config: { broadcast: { self: false, ack: false } },
    });
    this.channel.on("broadcast", { event: EVENT }, ({ payload }) => {
      this.messages.emit(payload as GameMessage);
    });
    this.channel.subscribe((state) => {
      if (this.closed) return;
      if (state === "SUBSCRIBED") {
        this.setStatus("connected");
        const pending = this.queue.splice(0);
        pending.forEach((m) => this.send(m));
      } else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
        this.setStatus("disconnected");
      }
    });
  }

  private setStatus(s: ConnectionStatus) {
    this.status = s;
    this.statuses.emit(s);
  }

  send(message: GameMessage) {
    if (this.closed) return;
    if (this.status !== "connected") {
      this.queue.push(message);
      if (this.queue.length > 50) this.queue.shift();
      return;
    }
    void this.channel.send({ type: "broadcast", event: EVENT, payload: message });
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
    void getClient().removeChannel(this.channel);
  }
}
