import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { updateSubcontractorAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { SubcontractorForm } from "@/components/modules/subcontractor-form";

export default async function EditSubcontractorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { subcontractors, projects } = await getStore();
  const subcontractor = subcontractors.find((s) => s.id === id);
  if (!subcontractor) notFound();

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href="/subcontractors" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Subcontractors
        </Link>
        <PageHeader title="Edit Subcontractor" subtitle={subcontractor.company} />
      </div>

      <SubcontractorForm
        action={updateSubcontractorAction}
        subcontractor={subcontractor}
        projects={projects}
        cancelHref="/subcontractors"
        submitLabel="Save Changes"
      />
    </div>
  );
}
