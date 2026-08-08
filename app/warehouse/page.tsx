import Link from "next/link";
import { getStore } from "@/lib/data/store";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency, formatDate } from "@/lib/utils";
import { QrCode, Star, Plus, Pencil } from "lucide-react";

export default function WarehousePage() {
  const { materials, suppliers, purchaseOrders } = getStore();
  const lowStock = materials.filter((m) => m.quantity < m.reorderLevel);

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Warehouse"
        subtitle={`${materials.length} SKUs tracked · ${lowStock.length} below reorder level`}
        action={
          <Link
            href="/warehouse/materials/new"
            className="flex items-center gap-1.5 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            New Material
          </Link>
        }
      />
      <Tabs
        tabs={[
          {
            label: "Materials & Inventory",
            content: (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                        <th className="px-5 py-3 font-medium">Material</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Stock Level</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">Unit Cost</th>
                        <th className="px-4 py-3 font-medium">QR</th>
                        <th className="px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => {
                        const low = m.quantity < m.reorderLevel;
                        const pct = Math.min(100, (m.quantity / (m.reorderLevel * 2)) * 100);
                        return (
                          <tr key={m.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-medium text-ink-800">{m.name}</p>
                              <p className="text-ink-400 text-[11px]">{m.sku}</p>
                            </td>
                            <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{m.category}</td>
                            <td className="px-4 py-3 min-w-[160px]">
                              <div className="flex items-center gap-2">
                                <ProgressBar value={pct} tone={low ? "danger" : "success"} className="w-24" />
                                <span className={low ? "text-danger-500 font-medium" : "text-ink-500"}>{m.quantity} {m.unit}</span>
                              </div>
                              {low && <Badge variant="danger" className="mt-1">Reorder</Badge>}
                            </td>
                            <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{m.warehouseLocation}</td>
                            <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatCurrency(m.unitCost)}</td>
                            <td className="px-4 py-3 text-ink-400"><span className="flex items-center gap-1"><QrCode className="w-3.5 h-3.5" />{m.qrCode}</span></td>
                            <td className="px-4 py-3">
                              <Link href={`/warehouse/materials/${m.id}/edit`} className="flex items-center gap-1 text-ink-400 hover:text-blue-600 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ),
          },
          {
            label: "Suppliers",
            content: (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {suppliers.map((s) => (
                  <Card key={s.id} className="p-5">
                    <p className="text-[13.5px] font-semibold text-ink-900">{s.name}</p>
                    <p className="text-[11.5px] text-ink-400 mt-0.5">{s.category}</p>
                    <div className="flex items-center gap-1 mt-2 text-warning-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(s.rating) ? "fill-warning-500" : "fill-none text-ink-200"}`} />
                      ))}
                      <span className="text-[12px] text-ink-500 ml-1">{s.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-100 text-[12px]">
                      <span className="text-ink-400">Orders placed</span>
                      <span className="font-medium text-ink-800">{s.ordersCount}</span>
                    </div>
                    <div className="text-[12px] text-ink-500 mt-1">{s.contact}</div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            label: "Purchase Orders",
            content: (
              <Card className="overflow-hidden">
                <CardHeader title="Purchase Orders" subtitle={`${purchaseOrders.length} orders tracked`} />
                <div className="divide-y divide-ink-50 mt-2">
                  {purchaseOrders.map((po) => {
                    const material = materials.find((m) => m.id === po.materialId);
                    const supplier = suppliers.find((s) => s.id === po.supplierId);
                    return (
                      <div key={po.id} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-ink-800">{material?.name}</p>
                          <p className="text-[11.5px] text-ink-400">{supplier?.name} · Ordered {formatDate(po.orderDate)}</p>
                        </div>
                        <span className="text-[12.5px] text-ink-600">{po.quantity} {material?.unit}</span>
                        <span className="text-[12.5px] font-medium text-ink-800 w-20 text-right">{formatCurrency(po.total, { compact: true })}</span>
                        <Badge variant={po.status === "Delivered" ? "success" : po.status === "Pending" ? "warning" : "blue"}>{po.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
