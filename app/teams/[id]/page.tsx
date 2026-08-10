import { notFound } from "next/navigation";
import { HardHat, ShieldAlert, Award, Users } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { teams, employees, projects } = await getStore();
  const team = teams.find((t) => t.id === id);
  if (!team) notFound();

  const foreman = employees.find((e) => e.id === team.foremanId);
  const members = employees.filter((e) => team.memberIds.includes(e.id));
  const currentProject = team.currentProjectId ? projects.find((p) => p.id === team.currentProjectId) : null;
  const pastProjects = projects.filter((p) => p.teamIds.includes(team.id) && p.id !== team.currentProjectId).slice(0, 6);

  const severityTone: Record<string, "warning" | "danger" | "neutral"> = { Minor: "neutral", Moderate: "warning", Severe: "danger" };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={team.name}
        subtitle={`${team.specialty} crew · ${members.length + 1} members`}
        action={<Badge variant={team.status === "On Site" ? "success" : team.status === "Off Duty" ? "warning" : "neutral"}>{team.status}</Badge>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Performance Score</p>
          <p className="text-[22px] font-semibold text-ink-900 mt-1">{team.performanceScore}/100</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Completed Projects</p>
          <p className="text-[22px] font-semibold text-ink-900 mt-1">{team.completedProjects}</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Avg Weekly Hours</p>
          <p className="text-[22px] font-semibold text-ink-900 mt-1">{team.avgWeeklyHours}h</p>
        </Card>
        <Card className="p-5">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Safety Incidents</p>
          <p className="text-[22px] font-semibold text-ink-900 mt-1">{team.safetyIncidents.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-[14px] font-semibold text-ink-900 mb-4 flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" />Crew Roster</h3>
          <div className="space-y-2">
            {foreman && (
              <Link href={`/employees/${foreman.id}`} className="flex items-center gap-3 rounded-lg bg-blue-50/60 px-3 py-2.5 hover:bg-blue-50 transition-colors">
                <Avatar name={foreman.name} size={32} />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-ink-800">{foreman.name}</p>
                  <p className="text-[11px] text-ink-500">{foreman.role}</p>
                </div>
                <Badge variant="blue">Foreman</Badge>
              </Link>
            )}
            {members.map((m) => (
              <Link href={`/employees/${m.id}`} key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-ink-50 transition-colors">
                <Avatar name={m.name} size={32} />
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-ink-800">{m.name}</p>
                  <p className="text-[11px] text-ink-500">{m.role}</p>
                </div>
                <span className="text-[11px] text-ink-400">{m.weeklyHours}h/wk</span>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-ink-900 mb-3 flex items-center gap-1.5"><HardHat className="w-4 h-4 text-blue-500" />Current Assignment</h3>
            {currentProject ? (
              <Link href={`/projects/${currentProject.id}`} className="block rounded-lg bg-ink-50 px-3 py-3 hover:bg-ink-100 transition-colors">
                <p className="text-[13px] font-medium text-ink-800">{currentProject.name}</p>
                <p className="text-[11.5px] text-ink-400 mt-0.5">{currentProject.city}, {currentProject.state}</p>
              </Link>
            ) : (
              <p className="text-[13px] text-ink-400">No active assignment — available for dispatch.</p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-ink-900 mb-3 flex items-center gap-1.5"><Award className="w-4 h-4 text-blue-500" />Certifications</h3>
            <div className="flex flex-wrap gap-1.5">
              {team.certifications.map((c) => (
                <Badge key={c} variant="blue">{c}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Safety Incidents" subtitle="Logged incident history" />
          <div className="divide-y divide-ink-50 mt-2">
            {team.safetyIncidents.map((inc) => (
              <div key={inc.id} className="flex items-center gap-3 px-5 py-3">
                <ShieldAlert className="w-4 h-4 text-ink-300 shrink-0" />
                <div className="flex-1">
                  <p className="text-[13px] text-ink-700">{inc.description}</p>
                  <p className="text-[11.5px] text-ink-400">{formatDate(inc.date)}</p>
                </div>
                <Badge variant={severityTone[inc.severity]}>{inc.severity}</Badge>
              </div>
            ))}
            {team.safetyIncidents.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No safety incidents recorded. Excellent record.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Completed Projects" subtitle="Recent job history" />
          <div className="divide-y divide-ink-50 mt-2">
            {pastProjects.map((p) => (
              <Link href={`/projects/${p.id}`} key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 transition-colors">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-ink-800">{p.name}</p>
                  <p className="text-[11.5px] text-ink-400">{p.city}, {p.state}</p>
                </div>
                <span className="text-[11.5px] text-ink-400">{formatDate(p.deadline)}</span>
              </Link>
            ))}
            {pastProjects.length === 0 && <p className="p-6 text-center text-ink-400 text-[13px]">No project history yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
