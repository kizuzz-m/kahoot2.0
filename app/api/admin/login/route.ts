import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE, checkPassword, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ password: z.string().max(200) });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !(await checkPassword(parsed.data.password))) {
    // Kurze Pause bremst automatisches Durchprobieren.
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Falsches Passwort" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await sessionToken(parsed.data.password), {
    httpOnly: true,
    secure: new URL(req.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
