"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabItem {
  /** Stable identifier used for the URL and state — falls back to `label` when omitted.
   * Pass this explicitly when `label` includes data that can change (e.g. a live count),
   * otherwise the active tab will silently reset whenever that count changes. */
  id?: string;
  label: string;
  content: React.ReactNode;
}

function TabBar({ tabs, active, onSelect }: { tabs: TabItem[]; active: string; onSelect?: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-ink-100 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const tabId = tab.id ?? tab.label;
        const isActive = active === tabId;
        return (
          <button
            key={tabId}
            onClick={onSelect ? () => onSelect(tabId) : undefined}
            className={cn(
              "relative px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
              isActive ? "text-blue-600" : "text-ink-500 hover:text-ink-700"
            )}
          >
            {tab.label}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-blue-600 rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}

function TabsFallback({ tabs, active }: { tabs: TabItem[]; active: string }) {
  const activeTab = tabs.find((t) => (t.id ?? t.label) === active) ?? tabs[0];
  return (
    <div>
      <TabBar tabs={tabs} active={active} />
      <div className="pt-5">{activeTab?.content}</div>
    </div>
  );
}

function TabsInner({ tabs, defaultTab }: { tabs: TabItem[]; defaultTab?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const ids = tabs.map((t) => t.id ?? t.label);
  const requested = searchParams.get("tab");
  const active = requested && ids.includes(requested) ? requested : defaultTab ?? ids[0];
  const activeTab = tabs.find((t) => (t.id ?? t.label) === active) ?? tabs[0];

  function selectTab(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      <TabBar tabs={tabs} active={active ?? ""} onSelect={selectTab} />
      <div className="pt-5 animate-fade-in-up">{activeTab?.content}</div>
    </div>
  );
}

export function Tabs({ tabs, defaultTab }: { tabs: TabItem[]; defaultTab?: string }) {
  const fallbackActive = defaultTab ?? tabs[0]?.id ?? tabs[0]?.label ?? "";
  return (
    <Suspense fallback={<TabsFallback tabs={tabs} active={fallbackActive} />}>
      <TabsInner tabs={tabs} defaultTab={defaultTab} />
    </Suspense>
  );
}
