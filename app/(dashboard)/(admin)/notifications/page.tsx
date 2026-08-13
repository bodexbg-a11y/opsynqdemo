import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { getStore } from "@/lib/data/store";
import { getAppSettings, filterNotificationsBySettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/card";
import { NotificationsList } from "@/components/modules/notifications-list";

export default async function NotificationsPage() {
  const [{ notifications: allNotifications }, settings] = await Promise.all([getStore(), getAppSettings()]);
  const notifications = filterNotificationsBySettings(allNotifications, settings);
  const unread = notifications.filter((n) => !n.read).length;
  const muted = allNotifications.length - notifications.length;

  return (
    <div className="space-y-5 pb-10">
      <PageHeader
        title="Notifications"
        subtitle={
          muted > 0
            ? `${unread} unread of ${notifications.length} · ${muted} hidden by your alert settings`
            : `${unread} unread of ${notifications.length} total`
        }
        action={
          <Link
            href="/settings"
            className="flex items-center gap-1.5 text-[13px] font-medium bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 rounded-lg px-3 py-2 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
            Alert Settings
          </Link>
        }
      />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
