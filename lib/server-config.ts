import "server-only";

/**
 * Serverseitige Konfiguration – wird bei jedem Aufruf aus der Laufzeit-Umgebung gelesen
 * (Cloudflare Worker: Variables & Secrets; lokal: .dev.vars bzw. Umgebung).
 *
 * Bewusst OHNE NEXT_PUBLIC_-Präfix: Next.js baut solche Werte beim Build fest ins Bundle ein.
 * Diese hier landen nie im Build, sondern kommen erst zur Laufzeit aus dem Worker.
 */
export function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY ?? "";
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function getPublicBaseUrl(): string {
  return process.env.PUBLIC_BASE_URL ?? "";
}

export function isSupabaseRealtimeConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Werte, die der Browser für die Live-Verbindung braucht (über /api/config). */
export type PublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  baseUrl: string;
};

export function getPublicConfig(): PublicConfig {
  const realtime = isSupabaseRealtimeConfigured();
  return {
    supabaseUrl: realtime ? getSupabaseUrl() : "",
    supabaseAnonKey: realtime ? getSupabaseAnonKey() : "",
    baseUrl: getPublicBaseUrl(),
  };
}
