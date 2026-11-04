"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fileToResizedDataUrl } from "@/lib/image";

export function ImageInput({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onFile(file?: File) {
    if (!file) return;
    setError(null);
    try {
      onChange(await fileToResizedDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (value) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-line bg-ink">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="Bild zur Frage" className="mx-auto max-h-64 w-auto object-contain" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute right-3 top-3"
          onClick={() => onChange(undefined)}
        >
          Bild entfernen
        </Button>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border-2 border-dashed border-line p-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void onFile(e.dataTransfer.files[0]);
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          Bild hochladen
        </Button>
        <span className="text-sm text-muted">oder hierher ziehen · oder URL:</span>
        <form
          className="flex min-w-[220px] flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^https?:\/\//i.test(url.trim())) return setError("Bitte eine vollständige http(s)-URL eingeben.");
            onChange(url.trim());
            setUrl("");
          }}
        >
          <input
            className="field py-1.5 text-sm"
            placeholder="https://…/bild.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Bild-URL"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={!url.trim()}>
            Übernehmen
          </Button>
        </form>
      </div>
      {error && <p className="mt-2 text-sm text-a1">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
