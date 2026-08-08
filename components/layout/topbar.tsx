"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Plus, ChevronDown } from "lucide-react";
import type { AppNotification } from "@/lib/data/types";
import { cn, formatDate } from "@/lib/utils";
import { SeverityDot } from "@/components/ui/severity-dot";
import { navGroups } from "./nav-config";

function useSectionTitle() {
  const pathname = usePathname();
  if (pathname === "/") return "Dashboard";
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.href !== "/" && pathname.startsWith(item.href)) return item.label;
    }
  }
  return "OPSYNQ";
}

export function Topbar({ notifications }: { notifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read);
  const title = useSectionTitle();

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-ink-100/80 flex items-center gap-4 px-4 lg:px-8">
      <h1 className="text-[15px] font-semibold text-ink-900 hidden md:block shrink-0">{title}</h1>

      <div className="flex-1 max-w-md ml-2">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects, clients, tasks…"
            className="w-full bg-ink-50 border border-ink-100 rounded-lg pl-9 pr-3 py-2 text-[13px] text-ink-700 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/projects/new"
          className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-ink-500 hover:bg-ink-50 hover:text-ink-700 transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unread.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-500 ring-2 ring-white" />
            )}
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-96 card-surface rounded-xl z-20 overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
                  <p className="text-[13px] font-semibold text-ink-900">Notifications</p>
                  <span className="text-[11px] text-ink-400">{unread.length} unread</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.slice(0, 8).map((n) => (
                    <Link
                      href={n.link ?? "/notifications"}
                      key={n.id}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex gap-2.5 px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50/70 transition-colors",
                        !n.read && "bg-blue-50/40"
                      )}
                    >
                      <SeverityDot severity={n.severity} className="mt-1.5" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] text-ink-800 leading-snug">{n.message}</p>
                        <p className="text-[11px] text-ink-400 mt-0.5">{formatDate(n.timestamp, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block text-center text-[12.5px] font-medium text-blue-600 hover:bg-blue-50/60 py-2.5"
                >
                  View all notifications
                </Link>
              </div>
            </>
          )}
        </div>

        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-ink-50 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10.5px] font-semibold text-white">
            VM
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
        </button>
      </div>
    </header>
  );
}
