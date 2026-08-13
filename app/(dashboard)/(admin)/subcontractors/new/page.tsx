import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { createSubcontractorAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { SubcontractorForm } from "@/components/modules/subcontractor-form";

export default async function NewSubcontractorPage() {
  const { projects } = await getStore();

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href="/subcontractors" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Subcontractors
        </Link>
        <PageHeader title="New Subcontractor" subtitle="Add a trade partner to the roster" />
      </div>

      <SubcontractorForm
        action={createSubcontractorAction}
        projects={projects}
        cancelHref="/subcontractors"
        submitLabel="Add Subcontractor"
      />
    </div>
  );
}
