import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, MapPin, Calendar, Award, BadgeCheck } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { Card, PageHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate } from "@/lib/utils";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { employees, teams, projects } = await getStore();
  const employee = employees.find((e) => e.id === id);
  if (!employee) notFound();

  const team = employee.teamId ? teams.find((t) => t.id === employee.teamId) : null;
  const managedProjects = projects.filter((p) => p.projectManagerId === employee.id);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title={employee.name} subtitle={`${employee.role} · ${employee.department}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={employee.name} size={72} className="text-lg" />
            <h2 className="text-[16px] font-semibold text-ink-900 mt-3">{employee.name}</h2>
            <p className="text-[12.5px] text-ink-500">{employee.role}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <Badge variant={employee.status === "Active" ? "success" : "warning"}>{employee.status}</Badge>
              <Badge variant="neutral">{employee.permission}</Badge>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-[12.5px]">
            <div className="flex items-center gap-2 text-ink-600"><Mail className="w-3.5 h-3.5 text-ink-400" />{employee.email}</div>
            <div className="flex items-center gap-2 text-ink-600"><Phone className="w-3.5 h-3.5 text-ink-400" />{employee.phone}</div>
            <div className="flex items-center gap-2 text-ink-600"><MapPin className="w-3.5 h-3.5 text-ink-400" />{employee.city}</div>
            <div className="flex items-center gap-2 text-ink-600"><Calendar className="w-3.5 h-3.5 text-ink-400" />Hired {formatDate(employee.hireDate)}</div>
          </div>
          {team && (
            <Link href={`/teams/${team.id}`} className="mt-5 block rounded-lg bg-ink-50 hover:bg-ink-100 transition-colors px-3 py-2.5">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Assigned Crew</p>
              <p className="text-[13px] font-medium text-ink-800 mt-0.5">{team.name}</p>
            </Link>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Performance</p>
              <p className="text-[18px] font-semibold text-ink-900 mt-1">{employee.performanceScore}/100</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Weekly Hours</p>
              <p className="text-[18px] font-semibold text-ink-900 mt-1">{employee.weeklyHours}h</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Employment</p>
              <p className="text-[14px] font-semibold text-ink-900 mt-1.5">{employee.employmentType}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] text-ink-400 uppercase tracking-wide">Payroll</p>
              <div className="mt-1.5"><Badge variant={employee.payrollStatus === "Paid" ? "success" : "warning"}>{employee.payrollStatus}</Badge></div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-ink-900 mb-3">Vacation Balance</h3>
            <div className="flex items-center gap-3">
              <ProgressBar value={(employee.vacationUsed / employee.vacationTotal) * 100} tone="blue" className="flex-1" />
              <span className="text-[12.5px] text-ink-600 font-medium whitespace-nowrap">{employee.vacationUsed} / {employee.vacationTotal} days used</span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-[14px] font-semibold text-ink-900 mb-3 flex items-center gap-1.5"><Award className="w-4 h-4 text-blue-500" />Certifications</h3>
            {employee.certifications.length ? (
              <div className="flex flex-wrap gap-1.5">
                {employee.certifications.map((c) => (
                  <Badge key={c} variant="blue"><BadgeCheck className="w-3 h-3" />{c}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-ink-400">No certifications on file.</p>
            )}
          </Card>

          {managedProjects.length > 0 && (
            <Card>
              <div className="px-5 pt-5 pb-1"><h3 className="text-[14px] font-semibold text-ink-900">Projects Managed</h3></div>
              <div className="divide-y divide-ink-50 mt-2">
                {managedProjects.map((p) => (
                  <Link href={`/projects/${p.id}`} key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60 transition-colors">
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-ink-800">{p.name}</p>
                      <p className="text-[11.5px] text-ink-400">{p.city}, {p.state}</p>
                    </div>
                    <Badge variant="blue">{p.status}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
