"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  tabs,
  defaultTab,
}: {
  tabs: { label: string; content: React.ReactNode }[];
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.label);
  const activeTab = tabs.find((t) => t.label === active) ?? tabs[0];

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-ink-100 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActive(tab.label)}
            className={cn(
              "relative px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
              active === tab.label ? "text-blue-600" : "text-ink-500 hover:text-ink-700"
            )}
          >
            {tab.label}
            {active === tab.label && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-5 animate-fade-in-up">{activeTab?.content}</div>
    </div>
  );
}
