import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-ink shadow-[0_4px_0_0_#c98a0e] hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_0_#c98a0e]",
  secondary:
    "bg-ink-3 text-paper border border-line shadow-[0_4px_0_0_#0a1120] hover:bg-[#22325a] active:translate-y-[3px] active:shadow-[0_1px_0_0_#0a1120]",
  ghost: "text-paper/80 hover:text-paper hover:bg-white/5",
  danger: "bg-a1/15 text-a1 border border-a1/40 hover:bg-a1/25",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-xl gap-1.5",
  md: "px-5 py-2.5 text-base rounded-2xl gap-2",
  lg: "px-7 py-4 text-lg rounded-2xl gap-2.5",
};

const base =
  "inline-flex items-center justify-center font-semibold transition-all select-none disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant = "primary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
