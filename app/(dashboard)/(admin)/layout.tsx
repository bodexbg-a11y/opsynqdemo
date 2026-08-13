import { requireAdmin } from "@/lib/auth";

// Every route nested under this group is Admin-only. A ProjectManager who navigates here
// directly (not just via a hidden nav link) is bounced to /projects.
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  await requireAdmin();
  return children;
}
