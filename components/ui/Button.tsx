import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-ink shadow-sm shadow-brand/20 hover:bg-[#ffc24d] active:scale-[0.98]",
  secondary: "bg-white/[0.06] text-paper border border-line hover:bg-white/10 hover:border-[#3a4d75] active:scale-[0.98]",
  ghost: "text-paper/70 hover:text-paper hover:bg-white/[0.06]",
  danger: "text-a1/90 hover:text-a1 hover:bg-a1/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-xl gap-2",
  lg: "h-14 px-7 text-lg rounded-xl gap-2.5",
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
