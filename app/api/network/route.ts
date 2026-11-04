import os from "node:os";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Liefert die IPv4-Adressen des Rechners im lokalen Netzwerk.
 * Damit kann der Host-Bildschirm einen QR-Code erzeugen, der auch von
 * Smartphones im selben WLAN erreichbar ist, obwohl der Host über „localhost“ geöffnet wurde.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((i): i is os.NetworkInterfaceInfo => Boolean(i && i.family === "IPv4" && !i.internal))
    .map((i) => i.address)
    // private Bereiche zuerst
    .sort((a, b) => Number(/^(192\.168|10\.)/.test(b)) - Number(/^(192\.168|10\.)/.test(a)));
  return NextResponse.json({ addresses });
}
