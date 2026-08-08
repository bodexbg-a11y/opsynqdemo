import Link from "next/link";
import type { Equipment, Project } from "@/lib/data/types";
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from "@/lib/data/constants";
import { Card } from "@/components/ui/card";
import { FormField, FormSection, inputClass, selectClass } from "@/components/ui/form";

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export function EquipmentForm({
  action,
  equipment,
  projects,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  equipment?: Equipment;
  projects: Project[];
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <Card className="p-6">
      <form action={action} className="space-y-8">
        {equipment && <input type="hidden" name="equipmentId" value={equipment.id} />}

        <FormSection title="Equipment Details">
          <FormField label="Name" required className="md:col-span-2">
            <input name="name" required defaultValue={equipment?.name} placeholder="e.g. CAT 320 Excavator #055" className={inputClass} />
          </FormField>

          <FormField label="Type">
            <select name="type" defaultValue={equipment?.type ?? "Excavator"} className={selectClass}>
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Status">
            <select name="status" defaultValue={equipment?.status ?? "Available"} className={selectClass}>
              {EQUIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Location" hint="Site location, or leave as the main equipment yard" className="md:col-span-2">
            <input name="location" defaultValue={equipment?.location} placeholder="Main Equipment Yard" className={inputClass} />
          </FormField>

          <FormField label="Assigned Project" hint="Optional — link this asset to an active job site">
            <select name="currentProjectId" defaultValue={equipment?.currentProjectId ?? ""} className={selectClass}>
              <option value="">Unassigned</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Hours Used">
            <input name="hoursUsed" type="number" min={0} defaultValue={equipment?.hoursUsed ?? 0} className={inputClass} />
          </FormField>
        </FormSection>

        {equipment && (
          <FormSection title="Maintenance">
            <FormField label="Last Maintenance">
              <input name="lastMaintenance" type="date" defaultValue={toDateInputValue(equipment.lastMaintenance)} className={inputClass} />
            </FormField>
            <FormField label="Next Maintenance">
              <input name="nextMaintenance" type="date" defaultValue={toDateInputValue(equipment.nextMaintenance)} className={inputClass} />
            </FormField>
          </FormSection>
        )}

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
