"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HardHat, ShieldAlert } from "lucide-react";
import type { Team, Employee, Project } from "@/lib/data/types";
import { TEAM_SPECIALTIES, TEAM_STATUSES } from "@/lib/data/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { SearchInput, FilterSelect, FilterSelectPairs, FilterPills, ClearFiltersButton } from "@/components/ui/filter-bar";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<Team["status"], "success" | "neutral" | "warning"> = {
  "On Site": "success",
  Available: "neutral",
  "Off Duty": "warning",
};

const STATUS_PILLS = ["All", ...TEAM_STATUSES] as const;
type StatusPill = (typeof STATUS_PILLS)[number];

const SORTS = ["Performance", "Completed Jobs", "Crew Size", "Name"] as const;
type SortOption = (typeof SORTS)[number];

export function TeamsGrid({ teams, employees, projects }: { teams: Team[]; employees: Employee[]; projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusPill>("All");
  const [specialty, setSpecialty] = useState<(typeof TEAM_SPECIALTIES)[number] | "All">("All");
  const [projectId, setProjectId] = useState("All");
  const [safety, setSafety] = useState<"All" | "Incident-free" | "Has incidents">("All");
  const [sortBy, setSortBy] = useState<SortOption>("Performance");

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const projectOptions = useMemo(() => {
    const ids = new Set(teams.map((t) => t.currentProjectId).filter(Boolean) as string[]);
    return projects
      .filter((p) => ids.has(p.id))
      .map((p) => ({ value: p.id, label: p.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [teams, projects]);

  const statusCounts = useMemo(() => {
    const counts: Partial<Record<StatusPill, number>> = {};
    for (const s of TEAM_STATUSES) counts[s] = teams.filter((t) => t.status === s).length;
    return counts;
  }, [teams]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = teams.filter((t) => {
      if (status !== "All" && t.status !== status) return false;
      if (specialty !== "All" && t.specialty !== specialty) return false;
      if (projectId !== "All" && t.currentProjectId !== projectId) return false;
      if (safety === "Incident-free" && t.safetyIncidents.length > 0) return false;
      if (safety === "Has incidents" && t.safetyIncidents.length === 0) return false;
      if (q) {
        const foremanName = employeeMap.get(t.foremanId)?.name ?? "";
        if (!`${t.name} ${t.specialty} ${foremanName}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    return [...rows].sort((a, b) => {
      switch (sortBy) {
        case "Performance":
          return b.performanceScore - a.performanceScore;
        case "Completed Jobs":
          return b.completedProjects - a.completedProjects;
        case "Crew Size":
          return b.memberIds.length - a.memberIds.length;
        case "Name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [teams, status, specialty, projectId, safety, query, sortBy, employeeMap]);

  const hasFilters = status !== "All" || specialty !== "All" || projectId !== "All" || safety !== "All" || query !== "";

  const clearAll = () => {
    setStatus("All");
    setSpecialty("All");
    setProjectId("All");
    setSafety("All");
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPills value={status} options={STATUS_PILLS} onChange={setStatus} counts={statusCounts} />
        <SearchInput value={query} onChange={setQuery} placeholder="Search crews, specialty, foreman…" className="w-60" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Specialty" value={specialty} options={TEAM_SPECIALTIES} onChange={setSpecialty} allLabel="All specialties" />
        <FilterSelectPairs label="Assigned project" value={projectId} options={projectOptions} onChange={setProjectId} allLabel="Any project" />
        <FilterSelect
          label="Safety record"
          value={safety}
          options={["Incident-free", "Has incidents"] as const}
          onChange={(v) => setSafety(v as typeof safety)}
          allLabel="Any safety record"
        />
        <label className="relative inline-flex items-center">
          <span className="sr-only">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            title="Sort by"
            className="appearance-none cursor-pointer rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50 pl-3 pr-7 py-1.5 text-[12.5px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%235b6478' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
            }}
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                Sort: {s}
              </option>
            ))}
          </select>
        </label>
        <ClearFiltersButton show={hasFilters} onClick={clearAll} />
        <span className="ml-auto text-[12px] text-ink-400">
          {filtered.length} of {teams.length} crews
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((team) => {
          const foreman = employeeMap.get(team.foremanId);
          const members = team.memberIds.map((id) => employeeMap.get(id)?.name).filter(Boolean) as string[];
          const project = team.currentProjectId ? projectMap.get(team.currentProjectId) : null;
          return (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="p-5 h-full hover:shadow-md transition-shadow hover:border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <HardHat className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink-900">{team.name}</p>
                      <p className="text-[11.5px] text-ink-400">{team.specialty}</p>
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[team.status]}>{team.status}</Badge>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {foreman && <Avatar name={foreman.name} size={26} />}
                  <div className="leading-tight">
                    <p className="text-[12px] font-medium text-ink-800">{foreman?.name}</p>
                    <p className="text-[10.5px] text-ink-400">Foreman</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-2 gap-3 text-[11.5px]">
                  <div>
                    <p className="text-ink-400">Performance</p>
                    <p className="font-semibold text-ink-800">{team.performanceScore}/100</p>
                  </div>
                  <div>
                    <p className="text-ink-400">Completed Jobs</p>
                    <p className="font-semibold text-ink-800">{team.completedProjects}</p>
                  </div>
                  <div>
                    <p className="text-ink-400">Avg Hours/wk</p>
                    <p className="font-semibold text-ink-800">{team.avgWeeklyHours}h</p>
                  </div>
                  <div>
                    <p className="text-ink-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />Incidents</p>
                    <p className={cn("font-semibold", team.safetyIncidents.length > 0 ? "text-warning-500" : "text-ink-800")}>{team.safetyIncidents.length}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <AvatarStack names={members} max={5} />
                  {project ? (
                    <span className="text-[11px] text-blue-600 font-medium truncate max-w-[45%]">{project.name}</span>
                  ) : (
                    <span className="text-[11px] text-ink-400">Unassigned</span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card-surface rounded-2xl p-10 text-center text-ink-400 text-[13px]">No crews match your filters.</div>
      )}
    </div>
  );
}
