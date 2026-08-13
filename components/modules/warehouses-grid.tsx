"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Warehouse as WarehouseIcon, MapPin, User, Pencil, Trash2, PackageX } from "lucide-react";
import type { Warehouse, Material } from "@/lib/data/types";
import { deleteWarehouseAction } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SearchInput } from "@/components/ui/filter-bar";
import { ConfirmDeleteForm } from "./confirm-delete-form";
import { formatCurrency } from "@/lib/utils";

/** Warehouse network overview — each card rolls up the stock actually stored on that site. */
export function WarehousesGrid({
  warehouses,
  materials,
  isAdmin,
}: {
  warehouses: Warehouse[];
  materials: Material[];
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const byWarehouse = new Map<string, { skus: number; units: number; value: number; low: number }>();
    for (const m of materials) {
      const key = m.warehouseId ?? "__none__";
      const entry = byWarehouse.get(key) ?? { skus: 0, units: 0, value: 0, low: 0 };
      entry.skus += 1;
      entry.units += m.quantity;
      entry.value += m.quantity * m.unitCost;
      if (m.quantity < m.reorderLevel) entry.low += 1;
      byWarehouse.set(key, entry);
    }
    return byWarehouse;
  }, [materials]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return warehouses;
    return warehouses.filter((w) => `${w.name} ${w.code} ${w.city} ${w.state} ${w.manager}`.toLowerCase().includes(q));
  }, [warehouses, query]);

  const unassigned = stats.get("__none__");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search warehouses…" className="w-60" />
        <span className="text-[12px] text-ink-400">
          {filtered.length} of {warehouses.length} sites
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((w) => {
          const s = stats.get(w.id) ?? { skus: 0, units: 0, value: 0, low: 0 };
          const utilisation = w.capacity > 0 ? Math.min(100, (s.units / w.capacity) * 100) : 0;
          return (
            <Card key={w.id} className="p-5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <WarehouseIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink-900 truncate">{w.name}</p>
                    <p className="text-[11.5px] text-ink-400">{w.code}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Link href={`/warehouse/sites/${w.id}/edit`} className="text-ink-400 hover:text-blue-600" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <ConfirmDeleteForm
                      action={deleteWarehouseAction}
                      fields={{ warehouseId: w.id }}
                      confirmMessage={`Delete ${w.name}? Its ${s.skus} material${s.skus === 1 ? "" : "s"} will become unassigned.`}
                      className="flex"
                    >
                      <button type="submit" className="text-ink-400 hover:text-danger-500" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </ConfirmDeleteForm>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-1.5 text-[12px] text-ink-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {w.address}, {w.city}, {w.state}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 shrink-0" />
                  {w.manager || "Unassigned"}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11.5px] mb-1">
                  <span className="text-ink-400">Capacity used</span>
                  <span className="font-medium text-ink-700">
                    {s.units.toLocaleString()} / {w.capacity.toLocaleString()}
                  </span>
                </div>
                <ProgressBar value={utilisation} tone={utilisation > 90 ? "danger" : utilisation > 70 ? "warning" : "blue"} />
              </div>

              <div className="mt-4 pt-4 border-t border-ink-100 grid grid-cols-3 gap-3 text-[11.5px]">
                <div>
                  <p className="text-ink-400">SKUs</p>
                  <p className="font-semibold text-ink-800">{s.skus}</p>
                </div>
                <div>
                  <p className="text-ink-400">Stock Value</p>
                  <p className="font-semibold text-ink-800">{formatCurrency(s.value, { compact: true })}</p>
                </div>
                <div>
                  <p className="text-ink-400">Low Stock</p>
                  <p className={s.low > 0 ? "font-semibold text-danger-500" : "font-semibold text-ink-800"}>{s.low}</p>
                </div>
              </div>

              {w.notes && <p className="mt-3 text-[11.5px] text-ink-400 leading-snug">{w.notes}</p>}
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card-surface rounded-2xl p-10 text-center text-ink-400 text-[13px]">No warehouses match your search.</div>
      )}

      {unassigned && unassigned.skus > 0 && (
        <Card className="p-5 border-dashed">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-warning-100 text-warning-500 flex items-center justify-center shrink-0">
              <PackageX className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-ink-900">Unassigned stock</p>
              <p className="text-[12px] text-ink-500 mt-0.5">
                {unassigned.skus} SKU{unassigned.skus === 1 ? "" : "s"} worth {formatCurrency(unassigned.value, { compact: true })} are not
                linked to a warehouse yet.
              </p>
            </div>
            <Badge variant="warning">{unassigned.units.toLocaleString()} units</Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
