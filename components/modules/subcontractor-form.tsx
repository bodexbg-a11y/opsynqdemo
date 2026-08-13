import Link from "next/link";
import type { Subcontractor, Project } from "@/lib/data/types";
import { SUB_TRADES, SUBCONTRACTOR_STATUSES } from "@/lib/data/constants";
import { Card } from "@/components/ui/card";
import { FormField, FormSection, inputClass, selectClass } from "@/components/ui/form";

export function SubcontractorForm({
  action,
  subcontractor,
  projects,
  cancelHref,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  subcontractor?: Subcontractor;
  projects: Project[];
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-5">
      {subcontractor && <input type="hidden" name="subcontractorId" value={subcontractor.id} />}

      <Card className="p-6 space-y-6">
        <FormSection title="Company">
          <FormField label="Company Name" required>
            <input name="company" required defaultValue={subcontractor?.company} className={inputClass} placeholder="Summit Electrical LLC" />
          </FormField>
          <FormField label="Trade" required>
            <select name="trade" defaultValue={subcontractor?.trade ?? "Electrical"} className={selectClass}>
              {SUB_TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <select name="status" defaultValue={subcontractor?.status ?? "Active"} className={selectClass}>
              {SUBCONTRACTOR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Rating" hint="0–5">
            <input
              type="number"
              name="rating"
              min={0}
              max={5}
              step={0.1}
              defaultValue={subcontractor?.rating ?? 4}
              className={inputClass}
            />
          </FormField>
        </FormSection>

        <FormSection title="Primary Contact">
          <FormField label="Contact Name">
            <input name="contactName" defaultValue={subcontractor?.contactName} className={inputClass} placeholder="Marcus Webb" />
          </FormField>
          <FormField label="Email">
            <input name="email" type="email" defaultValue={subcontractor?.email} className={inputClass} placeholder="ops@summit.com" />
          </FormField>
          <FormField label="Phone">
            <input name="phone" defaultValue={subcontractor?.phone} className={inputClass} placeholder="(555) 224-8890" />
          </FormField>
        </FormSection>

        <FormSection title="Engagement">
          <FormField label="Jobs Completed">
            <input type="number" name="jobsCompleted" min={0} defaultValue={subcontractor?.jobsCompleted ?? 0} className={inputClass} />
          </FormField>
          <FormField label="Total Invoiced">
            <input type="number" name="totalInvoiced" min={0} step={100} defaultValue={subcontractor?.totalInvoiced ?? 0} className={inputClass} />
          </FormField>
          <FormField label="Active On Projects" hint="Hold Ctrl/Cmd to select several" className="md:col-span-2">
            <select
              name="activeProjectIds"
              multiple
              defaultValue={subcontractor?.activeProjectIds ?? []}
              className={`${inputClass} min-h-[120px]`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
        </FormSection>
      </Card>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2.5 transition-colors shadow-sm shadow-blue-600/20"
        >
          {submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="text-[13px] font-medium text-ink-600 hover:bg-ink-50 border border-ink-200 rounded-lg px-4 py-2.5 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
