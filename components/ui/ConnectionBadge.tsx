import type { ConnectionStatus } from "@/lib/realtime";
import { cn } from "@/lib/utils";

const LABELS: Record<ConnectionStatus, string> = {
  connecting: "Verbinde …",
  connected: "Live",
  disconnected: "Getrennt – verbinde neu",
};

export function ConnectionBadge({ status, className }: { status: ConnectionStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "connected" && "border-a3/40 bg-a3/10 text-a3",
        status === "connecting" && "border-a2/40 bg-a2/10 text-a2",
        status === "disconnected" && "border-a1/40 bg-a1/10 text-a1",
        className,
      )}
      role="status"
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "connected" ? "bg-a3" : status === "connecting" ? "bg-a2 animate-pulse" : "bg-a1 animate-pulse",
        )}
      />
      {LABELS[status]}
    </span>
  );
}
