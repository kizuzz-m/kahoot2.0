import type { GameMessage } from "../game/protocol";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

/**
 * Transport-Abstraktion für die Live-Verbindung eines Spielraums.
 * Implementierungen: Supabase Realtime (Broadcast) und lokaler WebSocket-Relay.
 */
export interface RealtimeChannel {
  readonly kind: "supabase" | "local";
  send(message: GameMessage): void;
  onMessage(handler: (message: GameMessage) => void): () => void;
  onStatus(handler: (status: ConnectionStatus) => void): () => void;
  close(): void;
}

/** Kleiner Helfer für Event-Listener-Listen. */
export class Emitter<T> {
  private handlers = new Set<(v: T) => void>();
  on(h: (v: T) => void) {
    this.handlers.add(h);
    return () => {
      this.handlers.delete(h);
    };
  }
  emit(v: T) {
    for (const h of this.handlers) {
      try {
        h(v);
      } catch (err) {
        console.error("[realtime] handler error", err);
      }
    }
  }
  clear() {
    this.handlers.clear();
  }
}
