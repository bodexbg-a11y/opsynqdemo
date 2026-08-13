import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/data/store";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { notifications } = await getStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <Sidebar notificationCount={unreadCount} role={user.role} userName={user.name} userEmail={user.email} />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Topbar notifications={notifications} userName={user.name} isAdmin={user.role === "Admin"} />
        <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </>
  );
}
