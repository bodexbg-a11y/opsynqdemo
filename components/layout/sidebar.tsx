"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups } from "./nav-config";
import { cn } from "@/lib/utils";
import { HardHat, Star } from "lucide-react";

export function Sidebar({ notificationCount = 0 }: { notificationCount?: number }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 left-0 z-40 bg-navy-900 text-white">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
          <HardHat className="w-4.5 h-4.5 text-white" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold tracking-wide text-white">OPSYNQ</p>
          <p className="text-[10px] text-ink-400 tracking-wider -mt-0.5">CONSTRUCTION OS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-ink-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors relative",
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-ink-300 hover:text-white hover:bg-white/[0.05]"
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-blue-400" />
                    )}
                    <Icon className={cn("w-[15px] h-[15px] shrink-0", active ? "text-blue-400" : "text-ink-400 group-hover:text-ink-200")} strokeWidth={2} />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.tier === "addon" && (
                      <Star
                        className="ml-auto shrink-0 w-3 h-3 text-amber-300 fill-amber-300"
                        strokeWidth={2}
                      >
                        <title>Доступно как платный доп-модуль</title>
                      </Star>
                    )}
                    {item.badgeKey === "notifications" && notificationCount > 0 && (
                      <span className="ml-auto text-[10px] font-semibold bg-blue-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-white/[0.05] transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
            VM
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-[12.5px] font-medium truncate">Vlad Mesaros</p>
            <p className="text-[11px] text-ink-500 truncate">CEO · Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
