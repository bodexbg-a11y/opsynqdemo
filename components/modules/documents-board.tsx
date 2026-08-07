"use client";

import { useState } from "react";
import { Search, FileText, Image as ImageIcon, ShieldCheck, ClipboardCheck, FileSignature, Ruler } from "lucide-react";
import type { DocumentItem, Project } from "@/lib/data/types";
import { cn, formatDate } from "@/lib/utils";

const CATEGORIES: (DocumentItem["category"] | "All")[] = [
  "All",
  "Contract",
  "Blueprint",
  "Drawing",
  "PDF",
  "Inspection Report",
  "Safety Document",
  "Photo",
  "Signed Document",
];

const ICONS: Record<DocumentItem["category"], typeof FileText> = {
  Contract: FileSignature,
  Blueprint: Ruler,
  Drawing: Ruler,
  PDF: FileText,
  "Inspection Report": ClipboardCheck,
  "Safety Document": ShieldCheck,
  Photo: ImageIcon,
  "Signed Document": FileSignature,
};

export function DocumentsBoard({ documents, projects }: { documents: DocumentItem[]; projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const filtered = documents.filter((d) => {
    if (category !== "All" && d.category !== category) return false;
    if (query && !d.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
                category === c ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="divide-y divide-ink-50">
          {filtered.slice(0, 150).map((d) => {
            const Icon = ICONS[d.category];
            const project = projectMap.get(d.projectId ?? "");
            return (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink-800 truncate">{d.name}</p>
                  <p className="text-[11.5px] text-ink-400">{project?.name} · Uploaded by {d.uploadedBy} · {formatDate(d.uploadDate)}</p>
                </div>
                <span className="text-[11px] text-ink-400 whitespace-nowrap">{d.fileSize}</span>
                <span className="text-[10.5px] bg-ink-100 text-ink-500 rounded px-1.5 py-0.5 whitespace-nowrap">{d.fileType}</span>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="p-10 text-center text-ink-400 text-[13px]">No documents match your filters.</p>}
        </div>
      </div>
    </div>
  );
}
