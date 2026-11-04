import Link from "next/link";
import { cn } from "@/lib/utils";

/** Eigenes Logo: Sprechblase aus drei Farbsegmenten + Wortmarke. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden>
      <path d="M6 8a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H18l-8 8v-8.4A6 6 0 0 1 6 22Z" fill="#ffb627" />
      <rect x="12" y="9" width="5" height="12" rx="2.5" fill="#0c1424" />
      <rect x="19.5" y="13" width="5" height="8" rx="2.5" fill="#ff6b57" />
      <circle cx="28" cy="18.5" r="2.5" fill="#0c1424" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-2xl font-extrabold tracking-tight">
        quiz<span className="text-brand">werk</span>
      </span>
    </Link>
  );
}
