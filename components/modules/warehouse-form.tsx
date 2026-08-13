import Link from "next/link";
import type { Warehouse, Employee } from "@/lib/data/types";
import { Card } from "@/components/ui/card";
import { FormField, FormSection, inputClass, selectClass, textareaClass } from "@/components/ui/form";

export function WarehouseForm({
  action,
  warehouse,
  employees,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  warehouse?: Warehouse;
  employees: Employee[];
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <Card className="p-6">
      <form action={action} className="space-y-8">
        {warehouse && <input type="hidden" name="warehouseId" value={warehouse.id} />}

        <FormSection title="Site Details">
          <FormField label="Warehouse Name" required className="md:col-span-2">
            <input name="name" required defaultValue={warehouse?.name} placeholder="Central Distribution Yard" className={inputClass} />
          </FormField>

          <FormField label="Site Code" hint="Short identifier used on labels, e.g. CDY">
            <input name="code" defaultValue={warehouse?.code} placeholder="CDY" maxLength={8} className={inputClass} />
          </FormField>

          <FormField label="Capacity" hint="Pallet positions">
            <input name="capacity" type="number" min={0} defaultValue={warehouse?.capacity ?? 500} className={inputClass} />
          </FormField>

          <FormField label="Address" className="md:col-span-2">
            <input name="address" defaultValue={warehouse?.address} placeholder="1420 Industrial Pkwy" className={inputClass} />
          </FormField>

          <FormField label="City">
            <input name="city" defaultValue={warehouse?.city} placeholder="Denver" className={inputClass} />
          </FormField>

          <FormField label="State">
            <input name="state" defaultValue={warehouse?.state} placeholder="CO" maxLength={2} className={inputClass} />
          </FormField>

          <FormField label="Site Manager">
            <select name="manager" defaultValue={warehouse?.manager ?? ""} className={selectClass}>
              <option value="">— Unassigned —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.name}>
                  {e.name} · {e.role}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Notes" className="md:col-span-2">
            <textarea name="notes" defaultValue={warehouse?.notes} placeholder="Access hours, special handling…" className={textareaClass} />
          </FormField>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink-100">
          <Link href={cancelHref} className="text-[13px] font-medium text-ink-500 hover:text-ink-800 px-4 py-2">
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Card>
  );
}
