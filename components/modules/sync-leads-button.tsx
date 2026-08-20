"use client";

import { useFormStatus } from "react-dom";
import { RefreshCw } from "lucide-react";
import { syncFacebookLeadsAction } from "@/lib/actions-leads";
import { cn } from "@/lib/utils";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex items-center gap-1.5 text-[13px] font-medium rounded-lg px-3 py-2 transition-colors text-white",
        pending ? "bg-[#1877F2]/60 cursor-wait" : "bg-[#1877F2] hover:bg-[#166FE5]"
      )}
    >
      <RefreshCw className={cn("w-4 h-4", pending && "animate-spin")} />
      {/* Walking every ad's leads edge takes a while on a large account. */}
      {pending ? "Syncing…" : "Sync from Facebook"}
    </button>
  );
}

export function SyncLeadsButton() {
  return (
    <form action={syncFacebookLeadsAction}>
      <Button />
    </form>
  );
}
