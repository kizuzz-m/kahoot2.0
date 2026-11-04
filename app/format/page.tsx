import { readFileSync } from "node:fs";
import path from "node:path";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Quizformat · Quizwerk" };

const json = readFileSync(path.join(process.cwd(), "public/vorlagen/quizwerk-beispiel.json"), "utf8");
const csv = readFileSync(path.join(process.cwd(), "public/vorlagen/quizwerk-vorlage.csv"), "utf8");

const fields: [string, string, string][] = [
  ["title", "ja", "1–120 Zeichen (fehlt er, wird der Dateiname verwendet)"],
  ["description", "nein", "max. 500 Zeichen"],
  ["questions", "ja", "1–200 Fragen"],
  ["question", "ja", "Fragetext, 1–500 Zeichen"],
  ["image", "nein", "http(s)-URL oder data:image-URL"],
  ["answers", "ja", "2–6 Antworten mit text und correct"],
  ["correct", "ja", "mindestens eine Antwort true – mehrere = Mehrfachauswahl"],
  ["timeLimit", "nein", "Sekunden, 5–240 (Standard 20)"],
  ["points", "nein", "0–5000 (Standard 1000, 0 = ohne Wertung)"],
  ["explanation", "nein", "Erklärung nach der Auflösung"],
];

export default function FormatPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-24 sm:px-8">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <LinkButton href="/import" variant="ghost" size="sm">
          ← Zum Import
        </LinkButton>
      </header>
      <h1 className="font-display mt-6 text-4xl font-extrabold">Das Quizwerk-Format</h1>
      <p className="mt-2 text-paper/75">
        Version 1 · Die vollständige Beschreibung inkl. tolerierter Varianten steht in <code>docs/FORMAT.md</code>.
      </p>

      <h2 className="font-display mt-10 text-2xl font-bold">JSON</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-3 text-muted">
            <tr>
              <th className="px-4 py-2">Feld</th>
              <th className="px-4 py-2">Pflicht</th>
              <th className="px-4 py-2">Regeln</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(([f, req, rule]) => (
              <tr key={f} className="border-t border-line">
                <td className="px-4 py-2 font-mono text-brand">{f}</td>
                <td className="px-4 py-2">{req}</td>
                <td className="px-4 py-2 text-paper/80">{rule}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink-2 p-4 text-sm">{json}</pre>

      <h2 className="font-display mt-10 text-2xl font-bold">CSV</h2>
      <p className="mt-2 text-paper/80">
        Eine Frage pro Zeile, Trennzeichen <code>;</code> <code>,</code> oder Tab. Spalte <code>richtig</code>: Nummer
        (1-basiert), Buchstabe A–F oder Antworttext, mehrere mit <code>|</code> trennen.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink-2 p-4 text-sm">{csv}</pre>
    </main>
  );
}
