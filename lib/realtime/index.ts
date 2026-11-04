"use client";

import { isSupabaseConfigured } from "../config";
import { LocalRealtimeChannel } from "./local-channel";
import { SupabaseRealtimeChannel } from "./supabase-channel";
import type { RealtimeChannel } from "./types";

/** Öffnet die Live-Verbindung für einen Spielraum – Supabase, falls konfiguriert, sonst lokaler Relay. */
export function openGameChannel(code: string): RealtimeChannel {
  return isSupabaseConfigured ? new SupabaseRealtimeChannel(code) : new LocalRealtimeChannel(code);
}

export type { RealtimeChannel, ConnectionStatus } from "./types";
