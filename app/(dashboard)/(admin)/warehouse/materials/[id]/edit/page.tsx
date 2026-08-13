import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { updateMaterialAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { MaterialForm } from "@/components/modules/material-form";

export default async function EditMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { materials, suppliers } = await getStore();
  const material = materials.find((m) => m.id === id);
  if (!material) notFound();

  return (
    <div className="space-y-5 pb-10 max-w-2xl">
      <div>
        <Link href="/warehouse" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Warehouse
        </Link>
        <PageHeader title="Edit Material" subtitle={material.name} />
      </div>

      <MaterialForm action={updateMaterialAction} material={material} suppliers={suppliers} cancelHref="/warehouse" submitLabel="Save Changes" />
    </div>
  );
}
