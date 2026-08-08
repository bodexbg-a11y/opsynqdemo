import Link from "next/link";
import { Upload } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { getAllClientStats } from "@/lib/data/analytics";
import { PageHeader } from "@/components/ui/card";
import { ClientsTable } from "@/components/modules/clients-table";

export default function ClientsPage() {
  const { clients } = getStore();
  const stats = Object.fromEntries(getAllClientStats());

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} companies in your CRM`}
        action={
          <Link
            href="/import?type=clients"
            className="flex items-center gap-1.5 text-[13px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import from Excel
          </Link>
        }
      />
      <ClientsTable clients={clients} stats={stats} />
    </div>
  );
}
