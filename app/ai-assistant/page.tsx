import { PageHeader } from "@/components/ui/card";
import { getPresetAnswers } from "@/lib/data/ai";
import { AiChat } from "@/components/modules/ai-chat";

export default function AiAssistantPage() {
  const presets = getPresetAnswers();
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="AI Assistant" subtitle="Ask anything about your company's projects, finances, teams and schedule" />
      <AiChat presets={presets} />
    </div>
  );
}
