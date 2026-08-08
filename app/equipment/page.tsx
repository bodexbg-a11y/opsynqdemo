import Link from "next/link";
import { Plus } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { PageHeader, Card } from "@/components/ui/card";
import { EquipmentTable } from "@/components/modules/equipment-table";

export default function EquipmentPage() {
  const { equipment, projects } = getStore();
  const available = equipment.filter((e) => e.status === "Available").length;
  const inUse = equipment.filter((e) => e.status === "In Use").length;
  const maintenance = equipment.filter((e) => e.status === "Maintenance").length;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Equipment"
        subtitle={`${equipment.length} fleet assets tracked with QR tags`}
        action={
          <Link
            href="/equipment/new"
            className="flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            New Equipment
          </Link>
        }
      />
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Available</p>
          <p className="text-[20px] font-semibold text-success-500 mt-1">{available}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">In Use</p>
          <p className="text-[20px] font-semibold text-blue-600 mt-1">{inUse}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] text-ink-400 uppercase tracking-wide">Maintenance</p>
          <p className="text-[20px] font-semibold text-danger-500 mt-1">{maintenance}</p>
        </Card>
      </div>
      <EquipmentTable equipment={equipment} projects={projects} />
    </div>
  );
}
