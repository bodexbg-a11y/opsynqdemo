import { getStore } from "@/lib/data/store";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { CalendarMonth, type DayEvent } from "@/components/modules/calendar-month";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function SchedulingPage() {
  const { projects, tasks, teams, employees, equipment } = await getStore();

  const YEAR = 2026;
  const MONTH = 7; // August (0-indexed)
  const eventsByDay: Record<number, DayEvent[]> = {};

  tasks.forEach((t) => {
    const d = new Date(t.dueDate);
    if (d.getFullYear() === YEAR && d.getMonth() === MONTH && t.status !== "Completed") {
      const day = d.getDate();
      eventsByDay[day] = eventsByDay[day] ?? [];
      eventsByDay[day].push({ label: t.title, tone: t.priority === "Urgent" ? "danger" : "blue" });
    }
  });
  projects.forEach((p) => {
    const d = new Date(p.deadline);
    if (d.getFullYear() === YEAR && d.getMonth() === MONTH) {
      const day = d.getDate();
      eventsByDay[day] = eventsByDay[day] ?? [];
      eventsByDay[day].push({ label: `Deadline: ${p.name}`, tone: "warning" });
    }
    p.milestones.forEach((m) => {
      const md = new Date(m.date);
      if (md.getFullYear() === YEAR && md.getMonth() === MONTH) {
        const day = md.getDate();
        eventsByDay[day] = eventsByDay[day] ?? [];
        eventsByDay[day].push({ label: `${p.name}: ${m.label}`, tone: "success" });
      }
    });
  });

  const activeProjects = projects.filter((p) => p.status === "In Progress" || p.status === "Behind Schedule");

  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Scheduling" subtitle="Calendar, resource planning and construction timelines" />
      <Tabs
        tabs={[
          {
            label: "Calendar",
            content: (
              <Card className="p-5">
                <CardHeader title="August 2026" subtitle="Task due dates, milestones & project deadlines" className="px-0 pt-0" />
                <div className="mt-4">
                  <CalendarMonth year={YEAR} month={MONTH} today={7} eventsByDay={eventsByDay} />
                </div>
              </Card>
            ),
          },
          {
            label: "Project Timeline",
            content: (
              <Card className="overflow-hidden">
                <CardHeader title="Active Project Timelines" subtitle={`${activeProjects.length} projects in motion`} />
                <div className="px-5 pb-5 pt-3 space-y-4">
                  {activeProjects.slice(0, 15).map((p) => {
                    const start = new Date(p.startDate).getTime();
                    const end = new Date(p.deadline).getTime();
                    const now = new Date("2026-08-07").getTime();
                    const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                    return (
                      <Link href={`/projects/${p.id}`} key={p.id} className="block group">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[12.5px] font-medium text-ink-800 group-hover:text-blue-600">{p.name}</p>
                          <p className="text-[11px] text-ink-400">{formatDate(p.startDate)} – {formatDate(p.deadline)}</p>
                        </div>
                        <div className="h-2 rounded-full bg-ink-100 relative overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                          <div className="absolute top-0 h-full w-0.5 bg-navy-900" style={{ left: `${p.progress}%` }} title="Actual progress" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            ),
          },
          {
            label: "Resource Planning",
            content: (
              <Card className="overflow-hidden">
                <CardHeader title="Crew Allocation" subtitle="Where every team is deployed this week" />
                <div className="divide-y divide-ink-50 mt-2">
                  {teams.map((t) => {
                    const project = t.currentProjectId ? projects.find((p) => p.id === t.currentProjectId) : null;
                    const foreman = employees.find((e) => e.id === t.foremanId);
                    return (
                      <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink-800">{t.name}</p>
                          <p className="text-[11.5px] text-ink-400">Foreman: {foreman?.name}</p>
                        </div>
                        <Badge variant={t.status === "On Site" ? "success" : t.status === "Off Duty" ? "warning" : "neutral"}>{t.status}</Badge>
                        <div className="w-56 text-right">
                          {project ? (
                            <Link href={`/projects/${project.id}`} className="text-[12px] text-blue-600 font-medium hover:underline truncate block">
                              {project.name}
                            </Link>
                          ) : (
                            <span className="text-[12px] text-ink-400">Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ),
          },
          {
            label: "Equipment Booking",
            content: (
              <Card className="overflow-hidden">
                <CardHeader title="Equipment Schedule" subtitle="Current bookings and availability" />
                <div className="divide-y divide-ink-50 mt-2">
                  {equipment.slice(0, 30).map((eq) => {
                    const project = eq.currentProjectId ? projects.find((p) => p.id === eq.currentProjectId) : null;
                    return (
                      <div key={eq.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-ink-800">{eq.name}</p>
                          <p className="text-[11.5px] text-ink-400">{eq.type}</p>
                        </div>
                        <Badge variant={eq.status === "Available" ? "success" : eq.status === "Maintenance" ? "danger" : "blue"}>{eq.status}</Badge>
                        <span className="w-56 text-right text-[12px] text-ink-500 truncate">{project ? project.name : eq.location}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ),
          },
          {
            label: "Employee Scheduling",
            content: (
              <Card className="overflow-hidden">
                <CardHeader title="Weekly Employee Hours" subtitle="Scheduled hours by employee" />
                <div className="divide-y divide-ink-50 mt-2">
                  {employees.slice(0, 25).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={e.name} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink-800">{e.name}</p>
                        <p className="text-[11.5px] text-ink-400">{e.role}</p>
                      </div>
                      <span className="text-[12.5px] font-medium text-ink-700">{e.weeklyHours}h scheduled</span>
                      <Badge variant={e.status === "Active" ? "success" : "warning"}>{e.status}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
