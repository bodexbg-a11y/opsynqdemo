import { getStore } from "@/lib/data/store";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/card";
import { DocumentsBoard } from "@/components/modules/documents-board";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "Admin";
  const { documents, projects } = await getStore();

  const visibleProjects = isAdmin ? projects : projects.filter((p) => p.projectManagerId === user?.employeeId);
  const visibleProjectIds = new Set(visibleProjects.map((p) => p.id));
  const visibleDocuments = isAdmin ? documents : documents.filter((d) => d.projectId && visibleProjectIds.has(d.projectId));

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Documents"
        subtitle={
          isAdmin
            ? `${visibleDocuments.length} files across contracts, blueprints, and reports`
            : `${visibleDocuments.length} files across your assigned projects`
        }
      />
      <DocumentsBoard documents={visibleDocuments} projects={visibleProjects} />
    </div>
  );
}
