import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { roleHome, type Role } from "@/lib/types";
import { AppShell } from "@/components/AppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect(roleHome(user.role as Role));

  return (
    <AppShell
      subtitle="Admin Console"
      userName={user.name}
      avatarUrl={user.avatarUrl}
      badge={
        <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1">
          <Shield className="w-3.5 h-3.5" /> Admin
        </span>
      }
    >
      {children}
    </AppShell>
  );
}
