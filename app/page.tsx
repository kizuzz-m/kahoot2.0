import { JoinCard } from "@/components/home/JoinCard";
import { Logo } from "@/components/ui/Logo";

export const metadata = { title: "Spiel beitreten · Quizwerk" };

/** Öffentliche Startseite: ausschließlich zum Beitreten. Verwaltung liegt unter /admin. */
export default function JoinPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-8">
      <Logo className="animate-rise" />
      <div className="flex w-full flex-1 flex-col items-center justify-center py-10">
        <div className="w-full max-w-sm animate-rise [animation-delay:80ms]">
          <JoinCard />
        </div>
      </div>
      <p className="text-center text-sm text-muted">Den Spielcode siehst du auf dem großen Bildschirm.</p>
    </main>
  );
}
