import Link from "next/link";
import { Plus, Upload, Download } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/card";
import { ProjectsTable } from "@/components/modules/projects-table";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "Admin";
  const { projects, clients, employees } = await getStore();
  const visibleProjects = isAdmin ? projects : projects.filter((p) => p.projectManagerId === user?.employeeId);

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Projects"
        subtitle={isAdmin ? `${visibleProjects.length} projects across every active job site` : `${visibleProjects.length} projects assigned to you`}
        action={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <a
                href="/api/export/projects"
                className="flex items-center gap-1.5 text-[13px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </a>
              <Link
                href="/import?type=projects"
                className="flex items-center gap-1.5 text-[13px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import
              </Link>
              <Link
                href="/projects/new"
                className="flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                New Project
              </Link>
            </div>
          ) : undefined
        }
      />
      <ProjectsTable projects={visibleProjects} clients={clients} employees={employees} />
    </div>
  );
}
