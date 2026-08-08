import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { updateEquipmentAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { EquipmentForm } from "@/components/modules/equipment-form";

export default async function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { equipment, projects } = getStore();
  const item = equipment.find((e) => e.id === id);
  if (!item) notFound();

  return (
    <div className="space-y-5 pb-10 max-w-2xl">
      <div>
        <Link href="/equipment" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Equipment
        </Link>
        <PageHeader title="Edit Equipment" subtitle={item.name} />
      </div>

      <EquipmentForm action={updateEquipmentAction} equipment={item} projects={projects} cancelHref="/equipment" submitLabel="Save Changes" />
    </div>
  );
}
