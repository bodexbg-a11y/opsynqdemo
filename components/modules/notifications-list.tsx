"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, FileWarning, Wrench, PackageX, UserX, Bell } from "lucide-react";
import type { AppNotification } from "@/lib/data/types";
import { cn, formatDate } from "@/lib/utils";

const ICONS: Record<AppNotification["type"], typeof Bell> = {
  "Delayed Project": AlertTriangle,
  "Overdue Invoice": FileWarning,
  "Equipment Maintenance": Wrench,
  "Low Inventory": PackageX,
  "Employee Absence": UserX,
  General: Bell,
};

const TYPES: (AppNotification["type"] | "All")[] = [
  "All",
  "Delayed Project",
  "Overdue Invoice",
  "Equipment Maintenance",
  "Low Inventory",
  "Employee Absence",
];

const severityBg: Record<AppNotification["severity"], string> = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-warning-100 text-warning-500",
  critical: "bg-danger-100 text-danger-500",
};

export function NotificationsList({ notifications }: { notifications: AppNotification[] }) {
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const filtered = type === "All" ? notifications : notifications.filter((n) => n.type === type);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 overflow-x-auto">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
              type === t ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="card-surface rounded-2xl overflow-hidden divide-y divide-ink-50">
        {filtered.map((n) => {
          const Icon = ICONS[n.type];
          return (
            <Link
              href={n.link ?? "#"}
              key={n.id}
              className={cn("flex items-start gap-3 px-5 py-4 hover:bg-ink-50/60 transition-colors", !n.read && "bg-blue-50/30")}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", severityBg[n.severity])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-800 leading-snug">{n.message}</p>
                <p className="text-[11.5px] text-ink-400 mt-1">{n.type} · {formatDate(n.timestamp, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
            </Link>
          );
        })}
        {filtered.length === 0 && <p className="p-10 text-center text-ink-400 text-[13px]">No notifications of this type.</p>}
      </div>
    </div>
  );
}
