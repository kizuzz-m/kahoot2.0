import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { formatIssues } from "./schema";
import { NotFoundError } from "./storage/types";

/** Einheitliche Fehlerantworten für alle API-Routen. */
export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Ungültige Daten", issues: formatIssues(err) }, { status: 400 });
  }
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
  console.error("[api]", err);
  const message =
    err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "Unbekannter Fehler";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function notFound(message = "Nicht gefunden") {
  return NextResponse.json({ error: message }, { status: 404 });
}
