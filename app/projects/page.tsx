import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { ProjectsTable } from "@/components/modules/projects-table";

export default function ProjectsPage() {
  const { projects, clients, employees } = getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Projects" subtitle={`${projects.length} projects across every active job site`} />
      <ProjectsTable projects={projects} clients={clients} employees={employees} />
    </div>
  );
}
