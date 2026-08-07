import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { ClientsTable } from "@/components/modules/clients-table";

export default function ClientsPage() {
  const { clients } = getStore();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Clients" subtitle={`${clients.length} companies in your CRM`} />
      <ClientsTable clients={clients} />
    </div>
  );
}
