import Link from "next/link";
import type { Material, Supplier, Warehouse } from "@/lib/data/types";
import { MATERIAL_CATEGORIES } from "@/lib/data/constants";
import { Card } from "@/components/ui/card";
import { FormField, FormSection, inputClass, selectClass } from "@/components/ui/form";

export function MaterialForm({
  action,
  material,
  suppliers,
  warehouses,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  material?: Material;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <Card className="p-6">
      <form action={action} className="space-y-8">
        {material && <input type="hidden" name="materialId" value={material.id} />}

        <FormSection title="Material Details">
          <FormField label="Name" required className="md:col-span-2">
            <input name="name" required defaultValue={material?.name} placeholder="e.g. Ready-Mix Concrete" className={inputClass} />
          </FormField>

          <FormField label="Category">
            <select name="category" defaultValue={material?.category ?? "Finishing"} className={selectClass}>
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Unit" hint="e.g. cu yd, ton, sheet, box">
            <input name="unit" defaultValue={material?.unit} placeholder="unit" className={inputClass} />
          </FormField>

          <FormField label="Supplier">
            <select name="supplierId" defaultValue={material?.supplierId ?? ""} className={selectClass}>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Warehouse">
            <select name="warehouseId" defaultValue={material?.warehouseId ?? ""} className={selectClass}>
              <option value="">— Unassigned —</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Bin Location" hint="Aisle and bin inside the warehouse">
            <input name="warehouseLocation" defaultValue={material?.warehouseLocation} placeholder="Aisle 1 - Bin A1" className={inputClass} />
          </FormField>
        </FormSection>

        <FormSection title="Stock & Cost">
          <FormField label="Quantity in Stock" required>
            <input name="quantity" type="number" min={0} required defaultValue={material?.quantity ?? 0} className={inputClass} />
          </FormField>

          <FormField label="Reorder Level" hint="Alert when stock falls below this">
            <input name="reorderLevel" type="number" min={0} defaultValue={material?.reorderLevel ?? 20} className={inputClass} />
          </FormField>

          <FormField label="Unit Cost (USD)">
            <input name="unitCost" type="number" min={0} step={0.01} defaultValue={material?.unitCost ?? 0} className={inputClass} />
          </FormField>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink-100">
          <Link href={cancelHref} className="text-[13px] font-medium text-ink-500 hover:text-ink-800 px-4 py-2">
            Cancel
          </Link>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20">
            {submitLabel}
          </button>
        </div>
      </form>
    </Card>
  );
}
