import { PageHeader } from "@/components/ui/card";
import { getStore } from "@/lib/data/store";
import { getCurrentUser } from "@/lib/auth";
import { getPresetAnswers } from "@/lib/data/ai";
import { AiChat } from "@/components/modules/ai-chat";

export default async function AiAssistantPage() {
  const [store, user] = await Promise.all([getStore(), getCurrentUser()]);
  const presets = getPresetAnswers(store);

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="AI Assistant"
        subtitle="Ask anything about your company's projects, finances, crews, inventory and schedule"
      />
      <AiChat presets={presets} userName={user?.name ?? "You"} />
    </div>
  );
}
