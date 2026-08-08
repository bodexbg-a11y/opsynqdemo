import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { createTeamAction } from "@/lib/actions";
import { TEAM_SPECIALTIES, TEAM_STATUSES } from "@/lib/data/constants";
import { Card, PageHeader } from "@/components/ui/card";
import { FormField, FormSection, inputClass, selectClass } from "@/components/ui/form";

export default function NewTeamPage() {
  const { employees } = getStore();
  const construction = employees.filter((e) => e.department === "Construction");

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href="/teams" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Teams
        </Link>
        <PageHeader title="New Team" subtitle="Assemble a new construction crew" />
      </div>

      <Card className="p-6">
        <form action={createTeamAction} className="space-y-8">
          <FormSection title="Crew Details">
            <FormField label="Crew Callsign" hint="e.g. “Sierra” — the crew will be named “Crew Sierra — [Specialty]”">
              <input name="callsign" placeholder="e.g. Sierra" className={inputClass} />
            </FormField>

            <FormField label="Specialty">
              <select name="specialty" defaultValue="General Labor" className={selectClass}>
                {TEAM_SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Status">
              <select name="status" defaultValue="Available" className={selectClass}>
                {TEAM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Foreman" required>
              <select name="foremanId" required className={selectClass} defaultValue="">
                <option value="" disabled>
                  Select a foreman…
                </option>
                {(construction.length ? construction : employees).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.role}
                  </option>
                ))}
              </select>
            </FormField>
          </FormSection>

          <FormSection title="Crew Members" subtitle="Select the workers assigned to this crew">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {construction.map((e) => (
                <label key={e.id} className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2 text-[12.5px] text-ink-700 hover:bg-ink-50 cursor-pointer">
                  <input type="checkbox" name="memberIds" value={e.id} className="accent-blue-600" />
                  <span className="truncate">{e.name} — {e.role}</span>
                </label>
              ))}
            </div>
          </FormSection>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink-100">
            <Link href="/teams" className="text-[13px] font-medium text-ink-500 hover:text-ink-800 px-4 py-2">
              Cancel
            </Link>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20">
              Create Team
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
