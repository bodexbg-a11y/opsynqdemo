import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  barClassName,
  tone = "blue",
}: {
  value: number;
  className?: string;
  barClassName?: string;
  tone?: "blue" | "success" | "warning" | "danger";
}) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
  };
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-ink-100 overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all", toneMap[tone], barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
