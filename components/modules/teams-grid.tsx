"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, HardHat, ShieldAlert } from "lucide-react";
import type { Team, Employee, Project } from "@/lib/data/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<Team["status"], "success" | "neutral" | "warning"> = {
  "On Site": "success",
  Available: "neutral",
  "Off Duty": "warning",
};

export function TeamsGrid({ teams, employees, projects }: { teams: Team[]; employees: Employee[]; projects: Project[] }) {
  const [query, setQuery] = useState("");
  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const filtered = teams.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()) || t.specialty.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="relative w-64">
        <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search crews or specialty…"
          className="bg-white border border-ink-200 rounded-lg pl-8 pr-3 py-1.5 text-[12.5px] w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
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
    </div>
  );
}
