import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { requireAdmin } from "@/lib/auth";
import { createWarehouseAction } from "@/lib/actions";
import { PageHeader } from "@/components/ui/card";
import { WarehouseForm } from "@/components/modules/warehouse-form";

export default async function NewWarehousePage() {
  await requireAdmin();
  const { employees } = await getStore();

  return (
    <div className="space-y-5 pb-10 max-w-2xl">
      <div>
        <Link href="/warehouse" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Warehouse
        </Link>
        <PageHeader title="New Warehouse" subtitle="Add a storage site to the network" />
      </div>

      <WarehouseForm action={createWarehouseAction} employees={employees} cancelHref="/warehouse" submitLabel="Add Warehouse" />
    </div>
  );
}
