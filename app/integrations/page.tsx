import { PageHeader } from "@/components/ui/card";
import { IntegrationsGrid } from "@/components/modules/integrations-grid";

export default function IntegrationsPage() {
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Integrations" subtitle="Connect OPSYNQ to the tools your company already uses" />
      <IntegrationsGrid />
    </div>
  );
}
