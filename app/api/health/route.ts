import { NextResponse } from "next/server";
import { getRepository } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseRealtime = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return NextResponse.json({
    ok: true,
    storage: getRepository().kind,
    realtime: supabaseRealtime ? "supabase" : "local-relay",
  });
}
