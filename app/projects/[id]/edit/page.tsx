import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { updateProjectAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { ProjectForm } from "@/components/modules/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { projects, employees, teams, clients } = getStore();
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href={`/projects/${id}`} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to {project.name}
        </Link>
        <PageHeader title="Edit Project" subtitle={project.name} />
      </div>

      <ProjectForm
        action={updateProjectAction}
        project={project}
        clients={clients}
        employees={employees}
        teams={teams}
        cancelHref={`/projects/${id}`}
        submitLabel="Save Changes"
      />
    </div>
  );
}
