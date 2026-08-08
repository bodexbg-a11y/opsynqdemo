import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { createProjectAction } from "@/lib/actions";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, RISK_LEVELS } from "@/lib/data/constants";
import { Card, PageHeader } from "@/components/ui/card";
import { FormField, FormSection, inputClass, selectClass, textareaClass } from "@/components/ui/form";

export default function NewProjectPage() {
  const { employees, teams, clients } = getStore();
  const pmCandidates = employees.filter(
    (e) => e.role === "Project Manager" || e.role === "Site Superintendent" || e.department === "Management"
  );

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-500 hover:text-ink-800 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Projects
        </Link>
        <PageHeader title="New Project" subtitle="Add a new construction project to the portfolio" />
      </div>

      <Card className="p-6">
        <form action={createProjectAction} className="space-y-8">
          <FormSection title="Project Details">
            <FormField label="Project Name" required className="md:col-span-2">
              <input name="name" required placeholder="e.g. Harrison Residence Phase 1" className={inputClass} />
            </FormField>

            <FormField label="Client" required hint="Type an existing client or a new company name — new clients are created automatically.">
              <input name="clientName" required list="clients-datalist" placeholder="Start typing a company name…" className={inputClass} />
              <datalist id="clients-datalist">
                {clients.map((c) => (
                  <option key={c.id} value={c.company} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Category">
              <select name="category" defaultValue="Residential" className={selectClass}>
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Address" className="md:col-span-2">
              <input name="address" placeholder="Street address" className={inputClass} />
            </FormField>

            <FormField label="City">
              <input name="city" className={inputClass} />
            </FormField>

            <FormField label="State">
              <input name="state" placeholder="e.g. CA" className={inputClass} />
            </FormField>
          </FormSection>

          <FormSection title="Budget & Schedule">
            <FormField label="Budget (USD)" required>
              <input name="budget" type="number" min={0} step={1000} required placeholder="500000" className={inputClass} />
            </FormField>

            <FormField label="Status">
              <select name="status" defaultValue="Planning" className={selectClass}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Start Date" required>
              <input name="startDate" type="date" required className={inputClass} />
            </FormField>

            <FormField label="Deadline" required>
              <input name="deadline" type="date" required className={inputClass} />
            </FormField>

            <FormField label="Risk Level">
              <select name="riskLevel" defaultValue="Medium" className={selectClass}>
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Project Manager">
              <select name="projectManagerId" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Select a project manager…
                </option>
                {(pmCandidates.length ? pmCandidates : employees).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — {e.role}
                  </option>
                ))}
              </select>
            </FormField>
          </FormSection>

          <FormSection title="Assign Teams" subtitle="Select the crews that will work on this project">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teams.map((t) => (
                <label key={t.id} className="flex items-center gap-2.5 rounded-lg border border-ink-200 px-3 py-2 text-[12.5px] text-ink-700 hover:bg-ink-50 cursor-pointer">
                  <input type="checkbox" name="teamIds" value={t.id} className="accent-blue-600" />
                  {t.name}
                </label>
              ))}
            </div>
          </FormSection>

          <FormSection title="Description" subtitle="Optional notes about the scope of work">
            <div className="md:col-span-2">
              <textarea name="description" placeholder="Describe the project scope…" className={textareaClass} />
            </div>
          </FormSection>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink-100">
            <Link href="/projects" className="text-[13px] font-medium text-ink-500 hover:text-ink-800 px-4 py-2">
              Cancel
            </Link>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20">
              Create Project
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
