import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { requireAdmin } from "@/lib/auth";
import { createMaterialAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { MaterialForm } from "@/components/modules/material-form";

export default async function NewMaterialPage() {
  await requireAdmin();
  const { suppliers } = await getStore();

  return (
    <div className="space-y-5 pb-10 max-w-2xl">
      <div>
        <Link href="/warehouse" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Warehouse
        </Link>
        <PageHeader title="New Material" subtitle="Add a new SKU to the inventory" />
      </div>

      <MaterialForm action={createMaterialAction} suppliers={suppliers} cancelHref="/warehouse" submitLabel="Add Material" />
    </div>
  );
}
