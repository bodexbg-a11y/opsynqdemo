import { CheckCircle2, AlertTriangle, Upload, FileSpreadsheet } from "lucide-react";
import { importClientsAction, importProjectsAction } from "@/lib/actions";
import { Card, PageHeader } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";

function ResultBanner({ imported, skipped, error }: { imported?: string; skipped?: string; error?: string }) {
  if (error) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-danger-100 text-danger-500 px-4 py-3 text-[13px] font-medium">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {error === "nofile" ? "Please choose a file before importing." : "That file couldn't be read — make sure it's a valid .xlsx spreadsheet."}
      </div>
    );
  }
  if (imported !== undefined) {
    const skippedNum = Number(skipped ?? 0);
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-success-100 text-success-500 px-4 py-3 text-[13px] font-medium">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        Imported {imported} row{imported === "1" ? "" : "s"} successfully.
        {skippedNum > 0 && ` ${skippedNum} row${skippedNum === 1 ? "" : "s"} skipped (missing required fields).`}
      </div>
    );
  }
  return null;
}

function ImportForm({
  action,
  columns,
  cta,
}: {
  action: (formData: FormData) => Promise<void>;
  columns: { name: string; required?: boolean }[];
  cta: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-ink-900">Expected columns</h3>
          <p className="text-[12px] text-ink-400 mt-0.5">Column names are matched case-insensitively — extra columns are ignored.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {columns.map((c) => (
          <span
            key={c.name}
            className={`text-[11px] font-medium rounded-md px-2 py-1 ${c.required ? "bg-blue-50 text-blue-700" : "bg-ink-100 text-ink-500"}`}
          >
            {c.name}
            {c.required && " *"}
          </span>
        ))}
      </div>
      <form action={action} className="space-y-4">
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          required
          className="block w-full text-[13px] text-ink-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12.5px] file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
        >
          <Upload className="w-4 h-4" />
          {cta}
        </button>
      </form>
    </Card>
  );
}

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; imported?: string; skipped?: string; error?: string }>;
}) {
  const params = await searchParams;
  const defaultTab = params.type === "projects" ? "Projects" : "Clients";

  return (
    <div className="space-y-5 pb-10 max-w-3xl">
      <PageHeader title="Import Data" subtitle="Bulk-upload your existing clients and projects from an Excel spreadsheet" />

      <ResultBanner imported={params.imported} skipped={params.skipped} error={params.error} />

      <Tabs
        defaultTab={defaultTab}
        tabs={[
          {
            label: "Clients",
            content: (
              <ImportForm
                action={importClientsAction}
                cta="Import Clients"
                columns={[
                  { name: "Company", required: true },
                  { name: "Industry" },
                  { name: "Address" },
                  { name: "City" },
                  { name: "State" },
                  { name: "Status" },
                  { name: "Contact Name" },
                  { name: "Contact Email" },
                  { name: "Contact Phone" },
                ]}
              />
            ),
          },
          {
            label: "Projects",
            content: (
              <ImportForm
                action={importProjectsAction}
                cta="Import Projects"
                columns={[
                  { name: "Project Name", required: true },
                  { name: "Client", required: true },
                  { name: "Category" },
                  { name: "Address" },
                  { name: "City" },
                  { name: "State" },
                  { name: "Budget" },
                  { name: "Start Date" },
                  { name: "Deadline" },
                  { name: "Status" },
                  { name: "Risk Level" },
                  { name: "Description" },
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
