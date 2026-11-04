"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { acceptedExtensions, checkExternalUrl, importContent, remoteSources } from "@/lib/import/registry";
import type { ImportResult, PlatformNotice, RemoteSource, RemoteSourceOption } from "@/lib/import/types";
import { cn } from "@/lib/utils";
import { ImportPreview } from "./ImportPreview";

type Tab = "file" | "paste" | "remote" | "external";

const TABS: { id: Tab; label: string }[] = [
  { id: "file", label: "Datei" },
  { id: "paste", label: "Text einfügen" },
  { id: "remote", label: "Offizielle Quellen" },
  { id: "external", label: "Andere Plattform" },
];

export function ImportWizard() {
  const [tab, setTab] = useState<Tab>("file");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<ImportResult> | ImportResult) {
    setError(null);
    try {
      setResult(await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (result) return <ImportPreview result={result} onReset={() => setResult(null)} />;

  return (
    <div>
      <div role="tablist" aria-label="Importquelle" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "bg-paper text-ink" : "bg-ink-2 text-paper/70 hover:text-paper",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-line bg-ink-2/70 p-5 sm:p-8" role="tabpanel">
        {tab === "file" && <FileTab onImport={(content, fileName) => run(() => importContent({ content, fileName }))} />}
        {tab === "paste" && <PasteTab onImport={(content) => run(() => importContent({ content }))} />}
        {tab === "remote" && <RemoteTab onImport={(src, opts) => run(() => src.fetchQuiz(opts))} />}
        {tab === "external" && <ExternalTab onUseFile={() => setTab("file")} />}

        {error && (
          <div className="mt-5 rounded-2xl border border-a1/40 bg-a1/10 px-4 py-3 text-sm text-a1" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function FileTab({ onImport }: { onImport: (content: string, fileName: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  async function handle(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("Die Datei ist größer als 10 MB.");
    onImport(await file.text(), file.name);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void handle(e.dataTransfer.files[0]);
        }}
        className={cn(
          "grid place-items-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition",
          over ? "border-brand bg-brand/5" : "border-line",
        )}
      >
        <p className="font-display text-2xl font-bold">JSON- oder CSV-Datei hierher ziehen</p>
        <p className="mt-1 text-muted">oder</p>
        <Button className="mt-3" onClick={() => inputRef.current?.click()}>
          Datei auswählen
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedExtensions()}
          className="hidden"
          onChange={(e) => {
            void handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      <Templates />
    </div>
  );
}

function Templates() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <a href="/vorlagen/quizwerk-beispiel.json" download className="rounded-2xl bg-ink-3/60 p-4 hover:bg-ink-3">
        <p className="font-semibold">Beispiel · JSON</p>
        <p className="text-sm text-muted">Quizwerk-Format mit allen Feldern</p>
      </a>
      <a href="/vorlagen/quizwerk-vorlage.csv" download className="rounded-2xl bg-ink-3/60 p-4 hover:bg-ink-3">
        <p className="font-semibold">Vorlage · CSV</p>
        <p className="text-sm text-muted">Für Excel, Numbers, Google Sheets</p>
      </a>
      <a href="/admin/format" className="rounded-2xl bg-ink-3/60 p-4 hover:bg-ink-3">
        <p className="font-semibold">Format-Dokumentation</p>
        <p className="text-sm text-muted">Alle Felder & Regeln erklärt</p>
      </a>
    </div>
  );
}

function PasteTab({ onImport }: { onImport: (content: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div>
      <label htmlFor="paste" className="mb-2 block text-sm font-semibold text-muted">
        JSON oder CSV (mit Kopfzeile) einfügen – das Format wird automatisch erkannt.
      </label>
      <textarea
        id="paste"
        className="field min-h-72 font-mono text-sm"
        placeholder={'{\n  "title": "Mein Quiz",\n  "questions": [ … ]\n}'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />
      <Button className="mt-4" disabled={!text.trim()} onClick={() => onImport(text)}>
        Vorschau anzeigen
      </Button>
    </div>
  );
}

function RemoteTab({ onImport }: { onImport: (src: RemoteSource, opts: Record<string, string>) => Promise<void> }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-paper/80">
        Hier erscheinen Datenquellen mit <strong>offizieller, frei nutzbarer API</strong>. Weitere Quellen lassen sich in{" "}
        <code className="rounded bg-ink px-1.5 py-0.5 text-sm">lib/import/registry.ts</code> registrieren.
      </p>
      {remoteSources.map((src) => (
        <RemoteSourceForm key={src.id} source={src} onImport={onImport} />
      ))}
    </div>
  );
}

function RemoteSourceForm({
  source,
  onImport,
}: {
  source: RemoteSource;
  onImport: (src: RemoteSource, opts: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(source.options.map((o) => [o.id, o.default])),
  );
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-3xl bg-ink-3/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-bold">{source.label}</h3>
        <a href={source.homepage} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline">
          {new URL(source.homepage).hostname} ↗
        </a>
      </div>
      <p className="mt-1 text-sm text-muted">{source.description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {source.options.map((o) => (
          <RemoteOptionField key={o.id} option={o} value={values[o.id]} onChange={(v) => setValues((s) => ({ ...s, [o.id]: v }))} />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onImport(source, values);
            setBusy(false);
          }}
        >
          {busy ? "Lade Fragen …" : "Fragen laden"}
        </Button>
        <p className="text-xs text-muted">{source.license}</p>
      </div>
    </div>
  );
}

function RemoteOptionField({ option, value, onChange }: { option: RemoteSourceOption; value: string; onChange: (v: string) => void }) {
  const [choices, setChoices] = useState(option.choices ?? []);
  useEffect(() => {
    if (!option.loadChoices) return;
    option.loadChoices().then(setChoices, () => undefined);
  }, [option]);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-muted">{option.label}</span>
      {option.type === "number" ? (
        <input
          type="number"
          className="field"
          min={option.min}
          max={option.max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
          {choices.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}

function ExternalTab({ onUseFile }: { onUseFile: () => void }) {
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState<PlatformNotice | null>(null);
  return (
    <div>
      <p className="text-paper/80">
        Du hast ein Quiz auf einer anderen Plattform? Füge den Link ein – Quizwerk prüft, ob ein offizieller Import möglich
        ist.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setNotice(checkExternalUrl(url));
        }}
      >
        <input
          className="field flex-1"
          placeholder="https://…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setNotice(null);
          }}
          aria-label="Link zum externen Quiz"
        />
        <Button type="submit" disabled={!url.trim()}>
          Prüfen
        </Button>
      </form>

      {notice && (
        <div className="mt-6 rounded-3xl border border-a2/40 bg-a2/10 p-5 animate-pop" role="alert">
          <p className="font-display text-xl font-bold text-a2">Kein direkter Import von {notice.name} möglich</p>
          <p className="mt-2 text-paper/90">{notice.message}</p>
          <p className="mt-4 font-semibold">So geht es trotzdem:</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-paper/90">
            {notice.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <Button className="mt-5" onClick={onUseFile}>
            Zum Datei-Import (JSON/CSV)
          </Button>
        </div>
      )}
    </div>
  );
}
