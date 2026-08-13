import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { requireAdmin } from "@/lib/auth";
import { createEquipmentAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { EquipmentForm } from "@/components/modules/equipment-form";

export default async function NewEquipmentPage() {
  await requireAdmin();
  const { projects } = await getStore();

  return (
    <div className="space-y-5 pb-10 max-w-2xl">
      <div>
        <Link href="/equipment" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Equipment
        </Link>
        <PageHeader title="New Equipment" subtitle="Add a new asset to the fleet" />
      </div>

      <EquipmentForm action={createEquipmentAction} projects={projects} cancelHref="/equipment" submitLabel="Add Equipment" />
    </div>
  );
}
