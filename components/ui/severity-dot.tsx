import { cn } from "@/lib/utils";

const map = {
  info: "bg-blue-400",
  warning: "bg-warning-500",
  critical: "bg-danger-500",
};

export function SeverityDot({ severity, className }: { severity: "info" | "warning" | "critical"; className?: string }) {
  return <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", map[severity], className)} />;
}
