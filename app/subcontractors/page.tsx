import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { SubcontractorsBoard } from "@/components/modules/subcontractors-board";

export default async function SubcontractorsPage() {
  const { subcontractors, projects } = await getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Subcontractors" subtitle={`${subcontractors.length} trade partners across every discipline`} />
      <SubcontractorsBoard subcontractors={subcontractors} projects={projects} />
    </div>
  );
}
