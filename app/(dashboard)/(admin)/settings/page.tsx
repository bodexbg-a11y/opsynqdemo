import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const current = await getCurrentUser();
  const [adminCount, pmCount] = await Promise.all([
    prisma.user.count({ where: { role: "Admin" } }),
    prisma.user.count({ where: { role: "ProjectManager" } }),
  ]);

  const ROLES = [
    { name: "Admin", desc: "Full access to all modules, financials and settings", count: adminCount },
    { name: "Project Manager", desc: "Sees only the projects and tasks assigned to them by an Admin", count: pmCount },
  ];

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Settings" subtitle="Company profile, roles, permissions and preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar name={current?.name ?? "?"} size={56} />
            <div>
              <p className="text-[14px] font-semibold text-ink-900">{current?.name}</p>
              <p className="text-[12.5px] text-ink-500">{current?.role === "Admin" ? "Admin" : "Project Manager"}</p>
              <p className="text-[12px] text-ink-400 mt-0.5">{current?.email}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h3 className="text-[14px] font-semibold text-ink-900 mb-1">Company Profile</h3>
          <p className="text-[12.5px] text-ink-500 mb-4">OPSYNQ Construction OS demo workspace</p>
          <div className="grid grid-cols-2 gap-4 text-[12.5px]">
            <div>
              <p className="text-ink-400 text-[11px] uppercase tracking-wide">Company Name</p>
              <p className="text-ink-800 font-medium mt-0.5">OPSYNQ Builders Group</p>
            </div>
            <div>
              <p className="text-ink-400 text-[11px] uppercase tracking-wide">Headquarters</p>
              <p className="text-ink-800 font-medium mt-0.5">Denver, CO</p>
            </div>
            <div>
              <p className="text-ink-400 text-[11px] uppercase tracking-wide">Industry</p>
              <p className="text-ink-800 font-medium mt-0.5">General Contracting</p>
            </div>
            <div>
              <p className="text-ink-400 text-[11px] uppercase tracking-wide">Plan</p>
              <p className="text-ink-800 font-medium mt-0.5">Enterprise</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <h3 className="text-[14px] font-semibold text-ink-900">Roles & Permissions</h3>
          <Link
            href="/settings/users"
            className="flex items-center gap-1.5 text-[12.5px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Manage Users
          </Link>
        </div>
        <div className="divide-y divide-ink-50 mt-3">
          {ROLES.map((r) => (
            <div key={r.name} className="flex items-center gap-4 px-5 py-4">
              <Badge variant="blue">{r.name}</Badge>
              <p className="flex-1 text-[12.5px] text-ink-500">{r.desc}</p>
              <span className="text-[12.5px] font-medium text-ink-800">{r.count} users</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
