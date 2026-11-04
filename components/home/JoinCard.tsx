"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client-api";
import { normalizeCode } from "@/lib/utils";

export function JoinCard() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = normalizeCode(code);
    if (c.length !== 6) return setError("Der Spielcode hat 6 Ziffern.");
    setBusy(true);
    setError(null);
    try {
      const game = await api.getGame(c);
      if (game.status === "finished") throw new Error("Dieses Spiel ist bereits beendet.");
      router.push(`/play/${c}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spiel nicht gefunden");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-6 shadow-2xl shadow-black/30 sm:p-8">
      <label htmlFor="game-code" className="font-display block text-center text-2xl font-bold">
        Spiel beitreten
      </label>
      <input
        id="game-code"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        placeholder="000 000"
        value={code.length > 3 ? `${code.slice(0, 3)} ${code.slice(3)}` : code}
        onChange={(e) => {
          setCode(normalizeCode(e.target.value));
          setError(null);
        }}
        className="field font-display mt-6 h-16 text-center text-4xl font-extrabold tracking-[0.15em] tabular-nums"
        aria-label="Spielcode"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "join-error" : undefined}
      />
      {error && (
        <p id="join-error" className="mt-2 text-center text-sm font-medium text-a1">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="mt-4 w-full" disabled={busy || code.length !== 6}>
        {busy ? "Suche Spiel …" : "Beitreten"}
      </Button>
    </form>
  );
}
