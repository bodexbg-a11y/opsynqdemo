"use client";

import { Search, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared filter/search/sort chrome used by every list module. */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white border border-ink-200 rounded-lg pl-8 pr-8 py-1.5 text-[12.5px] w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
}: {
  label: string;
  value: T | "All";
  options: readonly T[];
  onChange: (v: T | "All") => void;
  allLabel?: string;
}) {
  const active = value !== "All";
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "All")}
        title={label}
        className={cn(
          "appearance-none cursor-pointer rounded-lg border pl-3 pr-7 py-1.5 text-[12.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          active ? "border-blue-400 bg-blue-50 text-blue-700" : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        <option value="All">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Same as FilterSelect but for id/label pairs (clients, projects, employees…). */
export function FilterSelectPairs({
  label,
  value,
  options,
  onChange,
  allLabel = "All",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  allLabel?: string;
}) {
  const active = value !== "All";
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={label}
        className={cn(
          "appearance-none cursor-pointer rounded-lg border pl-3 pr-7 py-1.5 text-[12.5px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 max-w-[190px] truncate",
          active ? "border-blue-400 bg-blue-50 text-blue-700" : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
        )}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
      >
        <option value="All">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterPills<T extends string>({
  value,
  options,
  onChange,
  counts,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  counts?: Partial<Record<T, number>>;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
            value === o ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
          )}
        >
          {o}
          {counts?.[o] !== undefined && <span className="ml-1.5 text-[11px] opacity-70">{counts[o]}</span>}
        </button>
      ))}
    </div>
  );
}

export function ClearFiltersButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-[12px] font-medium text-ink-500 hover:text-danger-500 px-2 py-1.5 transition-colors"
    >
      <X className="w-3.5 h-3.5" />
      Clear filters
    </button>
  );
}

/** Clickable table header cell that cycles asc → desc for its column. */
export function SortHeader<K extends string>({
  column,
  label,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  column: K;
  label: string;
  sortKey: K | null;
  sortDir: "asc" | "desc";
  onSort: (column: K) => void;
  className?: string;
}) {
  const active = sortKey === column;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-4 py-3 font-medium", className)}>
      <button
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 uppercase tracking-wide transition-colors",
          active ? "text-blue-600" : "text-ink-400 hover:text-ink-700"
        )}
      >
        {label}
        <Icon className={cn("w-3 h-3", !active && "opacity-40")} />
      </button>
    </th>
  );
}

/** Shared sort-state reducer: clicking the active column flips direction. */
export function nextSort<K extends string>(
  current: { key: K | null; dir: "asc" | "desc" },
  column: K
): { key: K; dir: "asc" | "desc" } {
  if (current.key === column) return { key: column, dir: current.dir === "asc" ? "desc" : "asc" };
  return { key: column, dir: "asc" };
}

/** Locale-aware comparator that keeps numbers numeric and strings alphabetical. */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });
}
