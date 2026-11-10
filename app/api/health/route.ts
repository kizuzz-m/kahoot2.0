import { NextResponse } from "next/server";
import { getRepository } from "@/lib/storage";
import { isSupabaseRealtimeConfigured } from "@/lib/server-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseRealtime = isSupabaseRealtimeConfigured();
  return NextResponse.json({
    ok: true,
    storage: getRepository().kind,
    realtime: supabaseRealtime ? "supabase" : "local-relay",
  });
}
