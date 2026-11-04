/**
 * Öffentliche Konfiguration (Client + Server).
 * Ohne Supabase-Variablen läuft Quizwerk komplett lokal:
 *  - Daten in .data/db.json (über die Next.js-API-Routen)
 *  - Live-Verbindung über den mitgelieferten WebSocket-Relay (relay/server.mjs)
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Optional: feste URL des lokalen Relays, z. B. ws://192.168.1.20:3001 */
export const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL ?? "";
export const RELAY_PORT = process.env.NEXT_PUBLIC_RELAY_PORT ?? "3001";

/** Optional: öffentliche Basis-URL für QR-Codes, z. B. http://192.168.1.20:3000 */
export const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "";
