import { getStore } from "@/lib/data/store";
import { PageHeader } from "@/components/ui/card";
import { NotificationsList } from "@/components/modules/notifications-list";

export default function NotificationsPage() {
  const { notifications } = getStore();
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="space-y-5 pb-10">
      <PageHeader title="Notifications" subtitle={`${unread} unread of ${notifications.length} total`} />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
