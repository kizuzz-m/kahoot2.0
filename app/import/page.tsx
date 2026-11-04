import { ImportWizard } from "@/components/import/ImportWizard";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Quiz importieren · Quizwerk" };

export default function ImportPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <LinkButton href="/" variant="ghost" size="sm">
          ← Startseite
        </LinkButton>
      </header>
      <h1 className="font-display mt-6 text-4xl font-extrabold sm:text-5xl">Quiz importieren</h1>
      <p className="mt-2 max-w-2xl text-paper/75">
        Lade eigene Quizdateien hoch oder nutze offizielle Datenquellen. Vor dem Speichern siehst du eine Vorschau mit allen
        Hinweisen.
      </p>
      <div className="mt-8">
        <ImportWizard />
      </div>
    </main>
  );
}
