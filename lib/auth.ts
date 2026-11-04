import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Einfacher Passwortschutz für den Admin-Bereich.
 * Ist ADMIN_PASSWORD nicht gesetzt (z. B. lokal), ist der Admin-Bereich offen.
 * Das Cookie enthält nur ein HMAC des Passworts, nie das Passwort selbst.
 */
export const ADMIN_COOKIE = "qw_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function isAuthEnabled(): boolean {
  return adminPassword().length > 0;
}

export async function sessionToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("quizwerk-admin-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Prüft ein eingegebenes Passwort (Vergleich über die HMACs, damit die Laufzeit nichts verrät). */
export async function checkPassword(input: string): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  return safeEqual(await sessionToken(input), await sessionToken(adminPassword()));
}

export async function isAdmin(): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(value) && safeEqual(value!, await sessionToken(adminPassword()));
}

/** Für API-Routen: liefert eine 401-Antwort, wenn nicht angemeldet, sonst null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  return (await isAdmin()) ? null : NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
}
