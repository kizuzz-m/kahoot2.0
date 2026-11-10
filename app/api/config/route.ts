import { NextResponse } from "next/server";
import { getPublicConfig } from "@/lib/server-config";

export const dynamic = "force-dynamic";

/** Laufzeit-Konfiguration für den Browser (kommt aus den Worker-Variablen, nicht aus dem Build). */
export async function GET() {
  return NextResponse.json(getPublicConfig(), {
    headers: { "Cache-Control": "no-store" },
  });
}
