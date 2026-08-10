import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { ProjectsTable } from "@/components/modules/projects-table";

export default async function ProjectsPage() {
  const { projects, clients, employees } = await getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Projects"
        subtitle={`${projects.length} projects across every active job site`}
        action={
          <div className="flex items-center gap-2">
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
        }
      />
      <ProjectsTable projects={projects} clients={clients} employees={employees} />
    </div>
  );
}
