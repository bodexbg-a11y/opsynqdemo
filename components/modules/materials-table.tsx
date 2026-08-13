"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { QrCode, Pencil, Trash2 } from "lucide-react";
import type { Material, Supplier, Warehouse } from "@/lib/data/types";
import { MATERIAL_CATEGORIES } from "@/lib/data/constants";
import { deleteMaterialAction } from "@/lib/actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  SearchInput,
  FilterSelect,
  FilterSelectPairs,
  ClearFiltersButton,
  SortHeader,
  nextSort,
  compareValues,
} from "@/components/ui/filter-bar";
import { ConfirmDeleteForm } from "./confirm-delete-form";
import { formatCurrency } from "@/lib/utils";

type SortKey = "name" | "category" | "quantity" | "warehouse" | "unitCost" | "value";

export function MaterialsTable({
  materials,
  suppliers,
  warehouses,
  isAdmin,
}: {
  materials: Material[];
  suppliers: Supplier[];
  warehouses: Warehouse[];
  isAdmin: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof MATERIAL_CATEGORIES)[number] | "All">("All");
  const [warehouseId, setWarehouseId] = useState("All");
  const [supplierId, setSupplierId] = useState("All");
  const [stock, setStock] = useState<"All" | "Low stock" | "Out of stock" | "In stock">("All");
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({ key: null, dir: "asc" });

  const warehouseMap = useMemo(() => new Map(warehouses.map((w) => [w.id, w])), [warehouses]);
  const supplierMap = useMemo(() => new Map(suppliers.map((s) => [s.id, s])), [suppliers]);

  const warehouseOptions = useMemo(
    () => [
      ...warehouses.map((w) => ({ value: w.id, label: `${w.name} (${w.code})` })),
      { value: "__none__", label: "Unassigned" },
    ],
    [warehouses]
  );

  const supplierOptions = useMemo(() => {
    const ids = new Set(materials.map((m) => m.supplierId));
    return suppliers
      .filter((s) => ids.has(s.id))
      .map((s) => ({ value: s.id, label: s.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [materials, suppliers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = materials.filter((m) => {
      if (category !== "All" && m.category !== category) return false;
      if (warehouseId === "__none__" ? m.warehouseId !== null : warehouseId !== "All" && m.warehouseId !== warehouseId) return false;
      if (supplierId !== "All" && m.supplierId !== supplierId) return false;
      if (stock === "Low stock" && !(m.quantity > 0 && m.quantity < m.reorderLevel)) return false;
      if (stock === "Out of stock" && m.quantity !== 0) return false;
      if (stock === "In stock" && m.quantity < m.reorderLevel) return false;
      if (q && !`${m.name} ${m.sku} ${m.category} ${m.warehouseLocation}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (!sort.key) return rows;
    const key = sort.key;
    const sorted = [...rows].sort((a, b) => {
      switch (key) {
        case "name":
          return compareValues(a.name, b.name);
        case "category":
          return compareValues(a.category, b.category);
        case "quantity":
          return a.quantity - b.quantity;
        case "warehouse":
          return compareValues(warehouseMap.get(a.warehouseId ?? "")?.name, warehouseMap.get(b.warehouseId ?? "")?.name);
        case "unitCost":
          return a.unitCost - b.unitCost;
        case "value":
          return a.quantity * a.unitCost - b.quantity * b.unitCost;
        default:
          return 0;
      }
    });
    return sort.dir === "asc" ? sorted : sorted.reverse();
  }, [materials, category, warehouseId, supplierId, stock, query, sort, warehouseMap]);

  const hasFilters = category !== "All" || warehouseId !== "All" || supplierId !== "All" || stock !== "All" || query !== "";

  const clearAll = () => {
    setCategory("All");
    setWarehouseId("All");
    setSupplierId("All");
    setStock("All");
    setQuery("");
  };

  const totalValue = filtered.reduce((sum, m) => sum + m.quantity * m.unitCost, 0);
  const onSort = (c: SortKey) => setSort((s) => nextSort(s, c));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Category" value={category} options={MATERIAL_CATEGORIES} onChange={setCategory} allLabel="All categories" />
        <FilterSelectPairs label="Warehouse" value={warehouseId} options={warehouseOptions} onChange={setWarehouseId} allLabel="All warehouses" />
        <FilterSelectPairs label="Supplier" value={supplierId} options={supplierOptions} onChange={setSupplierId} allLabel="All suppliers" />
        <FilterSelect
          label="Stock level"
          value={stock}
          options={["Low stock", "Out of stock", "In stock"] as const}
          onChange={(v) => setStock(v as typeof stock)}
          allLabel="Any stock level"
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Search materials or SKU…" className="w-52" />
        <ClearFiltersButton show={hasFilters} onClick={clearAll} />
        <span className="ml-auto text-[12px] text-ink-400">
          {filtered.length} of {materials.length} SKUs · {formatCurrency(totalValue, { compact: true })} on hand
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-ink-400 text-[11px] uppercase tracking-wide">
                <SortHeader column="name" label="Material" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} className="px-5" />
                <SortHeader column="category" label="Category" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="quantity" label="Stock Level" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="warehouse" label="Warehouse" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="unitCost" label="Unit Cost" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <SortHeader column="value" label="Value" sortKey={sort.key} sortDir={sort.dir} onSort={onSort} />
                <th className="px-4 py-3 font-medium">QR</th>
                {isAdmin && <th className="px-4 py-3 font-medium"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map((m) => {
                const low = m.quantity < m.reorderLevel;
                const pct = Math.min(100, (m.quantity / Math.max(m.reorderLevel * 2, 1)) * 100);
                const warehouse = m.warehouseId ? warehouseMap.get(m.warehouseId) : null;
                return (
                  <tr key={m.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink-800">{m.name}</p>
                      <p className="text-ink-400 text-[11px]">
                        {m.sku} · {supplierMap.get(m.supplierId)?.name ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{m.category}</td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={pct} tone={low ? "danger" : "success"} className="w-24" />
                        <span className={low ? "text-danger-500 font-medium" : "text-ink-500"}>
                          {m.quantity} {m.unit}
                        </span>
                      </div>
                      {low && (
                        <Badge variant="danger" className="mt-1">
                          {m.quantity === 0 ? "Out of stock" : "Reorder"}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {warehouse ? (
                        <>
                          <p className="text-ink-700 font-medium">{warehouse.code}</p>
                          <p className="text-ink-400 text-[11px]">{m.warehouseLocation}</p>
                        </>
                      ) : (
                        <span className="text-ink-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-600 whitespace-nowrap">{formatCurrency(m.unitCost)}</td>
                    <td className="px-4 py-3 text-ink-800 font-medium whitespace-nowrap">
                      {formatCurrency(m.quantity * m.unitCost, { compact: true })}
                    </td>
                    <td className="px-4 py-3 text-ink-400">
                      <span className="flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5" />
                        {m.qrCode}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Link href={`/warehouse/materials/${m.id}/edit`} className="text-ink-400 hover:text-blue-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <ConfirmDeleteForm
                            action={deleteMaterialAction}
                            fields={{ materialId: m.id }}
                            confirmMessage={`Delete "${m.name}"?`}
                            className="flex"
                          >
                            <button type="submit" className="text-ink-400 hover:text-danger-500 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </ConfirmDeleteForm>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-ink-400 text-[13px]">No materials match your filters.</div>}
      </Card>
    </div>
  );
}
