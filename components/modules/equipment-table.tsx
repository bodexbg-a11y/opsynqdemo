"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, QrCode, MapPin, Pencil, Trash2 } from "lucide-react";
import type { Equipment, Project } from "@/lib/data/types";
import { deleteEquipmentAction } from "@/lib/actions";
import { EquipmentStatusSelect } from "./equipment-status-select";
import { ConfirmDeleteForm } from "./confirm-delete-form";
import { cn, formatDate } from "@/lib/utils";

const STATUS_FILTERS = ["All", "Available", "In Use", "Maintenance"] as const;

export function EquipmentTable({ equipment, projects }: { equipment: Equipment[]; projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("All");

  const filtered = equipment.filter((e) => {
    if (status !== "All" && e.status !== status) return false;
    if (query && !`${e.name} ${e.type}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-colors",
                status === s ? "bg-navy-900 text-white" : "text-ink-500 hover:bg-ink-100"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search equipment…"
            className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>
      </div>

      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Equipment</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Hours Used</th>
                <th className="px-4 py-3 font-medium">Next Maintenance</th>
                <th className="px-4 py-3 font-medium">QR Tag</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => {
                const project = eq.currentProjectId ? projects.find((p) => p.id === eq.currentProjectId) : null;
                return (
                  <tr key={eq.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-ink-800 whitespace-nowrap">{eq.name}</td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{eq.type}</td>
                    <td className="px-4 py-3">
                      <EquipmentStatusSelect equipmentId={eq.id} status={eq.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project ? <Link href={`/projects/${project.id}`} className="hover:text-blue-600 hover:underline">{project.name}</Link> : eq.location}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{eq.hoursUsed.toLocaleString()} hrs</td>
                    <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(eq.nextMaintenance)}</td>
                    <td className="px-4 py-3 text-ink-400"><span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5" />{eq.qrCode}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Link href={`/equipment/${eq.id}/edit`} className="text-ink-400 hover:text-blue-600 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <ConfirmDeleteForm action={deleteEquipmentAction} fields={{ equipmentId: eq.id }} confirmMessage={`Delete "${eq.name}"?`}>
                          <button type="submit" className="text-ink-400 hover:text-danger-500 transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </ConfirmDeleteForm>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No equipment matches your filters.</div>}
      </div>
    </div>
  );
}
