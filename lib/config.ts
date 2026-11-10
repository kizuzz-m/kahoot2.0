/**
 * Öffentliche Build-Konfiguration – nur für den lokalen Betrieb ohne Supabase.
 * Supabase-URL/-Keys und die Basis-URL kommen NICHT von hier, sondern zur Laufzeit
 * aus dem Worker (siehe lib/server-config.ts und /api/config).
 */

/** Optional: feste URL des lokalen Relays, z. B. ws://192.168.1.20:3001 */
export const RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL ?? "";
export const RELAY_PORT = process.env.NEXT_PUBLIC_RELAY_PORT ?? "3001";
