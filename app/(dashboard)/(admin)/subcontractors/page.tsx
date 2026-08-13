import Link from "next/link";
import { Plus } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { SubcontractorsBoard } from "@/components/modules/subcontractors-board";

export default async function SubcontractorsPage() {
  const { subcontractors, projects } = await getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Subcontractors"
        subtitle={`${subcontractors.length} trade partners across every discipline`}
        action={
          <Link
            href="/subcontractors/new"
            className="flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            New Subcontractor
          </Link>
        }
      />
      <SubcontractorsBoard subcontractors={subcontractors} projects={projects} />
    </div>
  );
}
