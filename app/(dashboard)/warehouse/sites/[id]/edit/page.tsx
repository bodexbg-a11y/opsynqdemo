import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { requireAdmin } from "@/lib/auth";
import { updateWarehouseAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { WarehouseForm } from "@/components/modules/warehouse-form";

export default async function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { warehouses, employees } = await getStore();
  const warehouse = warehouses.find((w) => w.id === id);
  if (!warehouse) notFound();

  return (
    <div className="space-y-5 pb-10 max-w-2xl">
      <div>
        <Link href="/warehouse" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Warehouse
        </Link>
        <PageHeader title="Edit Warehouse" subtitle={warehouse.name} />
      </div>

      <WarehouseForm
        action={updateWarehouseAction}
        warehouse={warehouse}
        employees={employees}
        cancelHref="/warehouse"
        submitLabel="Save Changes"
      />
    </div>
  );
}
