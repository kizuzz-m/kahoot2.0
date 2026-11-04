import "server-only";
import { FileRepository } from "./file-repository";
import { SupabaseRepository } from "./supabase-repository";
import type { Repository } from "./types";

let instance: Repository | null = null;

/**
 * Wählt das Speicher-Backend:
 *  - Supabase, wenn NEXT_PUBLIC_SUPABASE_URL und ein Key gesetzt sind
 *    (bevorzugt SUPABASE_SERVICE_ROLE_KEY – bleibt serverseitig)
 *  - sonst die lokale JSON-Datei
 */
export function getRepository(): Repository {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && key ? new SupabaseRepository(url, key) : new FileRepository();
  return instance;
}

export { NotFoundError } from "./types";
