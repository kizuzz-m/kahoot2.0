import "server-only";
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "../server-config";
import { FileRepository } from "./file-repository";
import { SupabaseRepository } from "./supabase-repository";
import type { Repository } from "./types";

let instance: Repository | null = null;

/**
 * Wählt das Speicher-Backend:
 *  - Supabase, wenn SUPABASE_URL und ein Key gesetzt sind (zur Laufzeit aus dem Worker)
 *    (bevorzugt SUPABASE_SERVICE_ROLE_KEY – bleibt serverseitig)
 *  - sonst die lokale JSON-Datei
 */
export function getRepository(): Repository {
  if (instance) return instance;
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey() || getSupabaseAnonKey();
  instance = url && key ? new SupabaseRepository(url, key) : new FileRepository();
  return instance;
}

export { NotFoundError } from "./types";
