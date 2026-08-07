import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { getStore } from "@/lib/data/store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OPSYNQ Construction OS",
  description: "The complete Business Operating System for construction companies.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { notifications } = getStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--background)]">
        <Sidebar notificationCount={unreadCount} />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          <Topbar notifications={notifications} />
          <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
