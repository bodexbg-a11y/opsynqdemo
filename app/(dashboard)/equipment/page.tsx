import Link from "next/link";
import { Plus } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui/card";
import { EquipmentTable } from "@/components/modules/equipment-table";

export default async function EquipmentPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "Admin";
  const { equipment, projects } = await getStore();

  const visibleProjects = isAdmin ? projects : projects.filter((p) => p.projectManagerId === user?.employeeId);
  const visibleProjectIds = new Set(visibleProjects.map((p) => p.id));
  const visibleEquipment = isAdmin ? equipment : equipment.filter((e) => e.currentProjectId && visibleProjectIds.has(e.currentProjectId));

  const available = visibleEquipment.filter((e) => e.status === "Available").length;
  const inUse = visibleEquipment.filter((e) => e.status === "In Use").length;
  const maintenance = visibleEquipment.filter((e) => e.status === "Maintenance").length;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Equipment"
        subtitle={isAdmin ? `${visibleEquipment.length} fleet assets tracked with QR tags` : `${visibleEquipment.length} assets assigned to your projects`}
        action={
          isAdmin ? (
            <Link
              href="/equipment/new"
              className="flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              New Equipment
            </Link>
          ) : undefined
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
      <EquipmentTable equipment={visibleEquipment} projects={visibleProjects} isAdmin={isAdmin} />
    </div>
  );
}
