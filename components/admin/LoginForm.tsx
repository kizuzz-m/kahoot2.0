"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    if (res?.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setError(res ? "Falsches Passwort." : "Server nicht erreichbar.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="card p-6 shadow-2xl shadow-black/30 sm:p-8">
      <h1 className="font-display text-center text-2xl font-bold">Admin-Bereich</h1>
      <p className="mt-1 text-center text-sm text-muted">Quizze erstellen, bearbeiten und hosten.</p>
      <label htmlFor="password" className="mt-6 block text-sm font-medium text-paper/80">
        Passwort
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setError(null);
        }}
        className="field mt-1.5"
        aria-invalid={Boolean(error)}
      />
      {error && <p className="mt-2 text-sm font-medium text-a1">{error}</p>}
      <Button type="submit" className="mt-5 w-full" disabled={busy || !password}>
        {busy ? "Prüfe …" : "Anmelden"}
      </Button>
    </form>
  );
}
