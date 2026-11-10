"use client";

/** Laufzeit-Konfiguration aus /api/config (Worker-Variablen) – einmal pro Seitenaufruf geladen. */
export type PublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  baseUrl: string;
};

const EMPTY: PublicConfig = { supabaseUrl: "", supabaseAnonKey: "", baseUrl: "" };

let pending: Promise<PublicConfig> | null = null;

export function loadPublicConfig(): Promise<PublicConfig> {
  if (!pending) {
    pending = fetch("/api/config", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<PublicConfig>) : EMPTY))
      .catch(() => {
        pending = null; // beim nächsten Versuch erneut laden
        return EMPTY;
      });
  }
  return pending;
}
