import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { DocumentsBoard } from "@/components/modules/documents-board";

export default async function DocumentsPage() {
  const { documents, projects } = await getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Documents" subtitle={`${documents.length} files across contracts, blueprints, and reports`} />
      <DocumentsBoard documents={documents} projects={projects} />
    </div>
  );
}
