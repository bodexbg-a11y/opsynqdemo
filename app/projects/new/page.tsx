import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { createProjectAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { ProjectForm } from "@/components/modules/project-form";

export default function NewProjectPage() {
  const { employees, teams, clients } = getStore();

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
        <PageHeader title="New Project" subtitle="Add a new construction project to the portfolio" />
      </div>

      <ProjectForm action={createProjectAction} clients={clients} employees={employees} teams={teams} cancelHref="/projects" submitLabel="Create Project" />
    </div>
  );
}
