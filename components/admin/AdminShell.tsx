"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Quizze" },
  { href: "/admin/import", label: "Importieren" },
  { href: "/admin/format", label: "Dateiformat" },
];

/** Gemeinsamer Rahmen der Admin-Seiten: Kopfzeile mit Navigation und Inhalt. */
export function AdminShell({
  authEnabled,
  title,
  description,
  actions,
  children,
}: {
  authEnabled: boolean;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-8">
          <Logo href="/admin" />
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  pathname === item.href ? "bg-white/[0.08] text-paper" : "text-paper/60 hover:text-paper",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LinkButton href="/admin/create" size="sm">
              + Neues Quiz
            </LinkButton>
            {authEnabled && (
              <Button variant="ghost" size="sm" onClick={logout}>
                Abmelden
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-10 sm:px-8">
        {!authEnabled && (
          <div className="mb-8 rounded-xl border border-a2/30 bg-a2/10 px-4 py-3 text-sm text-a2">
            Kein Admin-Passwort gesetzt – jeder mit der Adresse kann diesen Bereich öffnen. Setze die Variable{" "}
            <code className="font-semibold">ADMIN_PASSWORD</code>, um ihn zu schützen.
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {description && <p className="mt-1.5 max-w-2xl text-muted">{description}</p>}
          </div>
          {actions}
        </div>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
