"use client";

import { updateClientStatusAction } from "@/lib/actions";
import { CLIENT_STATUSES } from "@/lib/data/constants";
import type { Client } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const TONE: Record<Client["status"], string> = {
  Active: "bg-success-100 text-success-500",
  Past: "bg-ink-100 text-ink-600",
  Lead: "bg-blue-50 text-blue-700",
};

export function ClientStatusSelect({
  clientId,
  status,
  className,
}: {
  clientId: string;
  status: Client["status"];
  className?: string;
}) {
  return (
    <form action={updateClientStatusAction} onClick={(e) => e.stopPropagation()} className="inline-block">
      <input type="hidden" name="clientId" value={clientId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        title="Change client status"
        className={cn(
          "text-[11px] font-medium rounded-md pl-2 pr-6 py-1 border-0 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          TONE[status],
          className
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 6px center",
        }}
      >
        {CLIENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
