import { JoinCard } from "@/components/home/JoinCard";
import { QuizLibrary } from "@/components/home/QuizLibrary";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { ANSWER_STYLES } from "@/components/ui/answer-style";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <LinkButton href="/import" variant="ghost" size="sm">
            Importieren
          </LinkButton>
          <LinkButton href="/create" variant="ghost" size="sm">
            Erstellen
          </LinkButton>
        </nav>
      </header>

      <section className="grid items-center gap-12 pt-8 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <div className="animate-rise">
          <div className="flex gap-1.5" aria-hidden>
            {ANSWER_STYLES.map((s, i) => (
              <span
                key={s.letter}
                className={`${s.bg} font-display grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold text-ink`}
                style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (4 + i)}deg)` }}
              >
                {s.letter}
              </span>
            ))}
          </div>
          <h1 className="font-display mt-6 text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-7xl">
            Frage auf den
            <br />
            Bildschirm,{" "}
            <span className="relative inline-block text-brand">
              Handys
              <svg viewBox="0 0 200 20" className="absolute -bottom-2 left-0 w-full" aria-hidden>
                <path d="M2 14 Q 50 2 100 12 T 198 8" stroke="#ff6b57" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </span>{" "}
            raus.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper/75">
            Erstelle oder importiere ein Quiz, starte ein Live-Spiel und lass alle per Code oder QR-Code mit ihrem
            eigenen Gerät mitspielen – in Echtzeit, ganz ohne App.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/create" size="lg">
              Quiz erstellen
            </LinkButton>
            <LinkButton href="/import" variant="secondary" size="lg">
              Quiz importieren
            </LinkButton>
          </div>
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <JoinCard />
        </div>
      </section>

      <QuizLibrary />

      <footer className="mt-24 border-t border-line pt-6 text-sm text-muted">
        Quizwerk ist ein eigenständiges Open-Source-Projekt und steht in keiner Verbindung zu anderen Quiz-Plattformen.
      </footer>
    </main>
  );
}
