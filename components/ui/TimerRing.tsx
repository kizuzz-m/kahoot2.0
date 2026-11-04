import { cn } from "@/lib/utils";

/** Kreisförmiger Countdown. */
export function TimerRing({
  remainingMs,
  totalMs,
  size = 96,
  className,
}: {
  remainingMs: number;
  totalMs: number;
  size?: number;
  className?: string;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const seconds = Math.ceil(remainingMs / 1000);
  const urgent = seconds <= 5;
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="#131e33" stroke="#2a3a5c" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={urgent ? "#ff6b57" : "#ffb627"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{ transition: "stroke-dashoffset 200ms linear" }}
        />
      </svg>
      <span
        className={cn("font-display relative font-extrabold tabular-nums", urgent && "text-a1")}
        style={{ fontSize: size * 0.34 }}
        aria-live="polite"
      >
        {seconds}
      </span>
    </div>
  );
}
