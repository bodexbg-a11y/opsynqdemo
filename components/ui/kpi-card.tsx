import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  tone = "neutral",
  sub,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  deltaLabel?: string;
  tone?: "neutral" | "blue" | "success" | "warning" | "danger";
  sub?: string;
}) {
  const toneMap: Record<string, string> = {
    neutral: "bg-ink-100 text-ink-600",
    blue: "bg-blue-50 text-blue-600",
    success: "bg-success-100 text-success-500",
    warning: "bg-warning-100 text-warning-500",
    danger: "bg-danger-100 text-danger-500",
  };

  const positive = (delta ?? 0) >= 0;

  return (
    <div className="card-surface rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <p className="text-[12.5px] font-medium text-ink-500">{label}</p>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", toneMap[tone])}>
          <Icon className="w-4 h-4" strokeWidth={2.25} />
        </div>
      </div>
      <p className="text-[26px] font-semibold text-ink-900 tracking-tight leading-none">{value}</p>
      <div className="flex items-center gap-1.5 min-h-[16px]">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[12px] font-medium",
              positive ? "text-success-500" : "text-danger-500"
            )}
          >
            {positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(delta)}%
          </span>
        )}
        {sub && <span className="text-[12px] text-ink-400">{sub}</span>}
        {deltaLabel && <span className="text-[12px] text-ink-400">{deltaLabel}</span>}
      </div>
    </div>
  );
}
