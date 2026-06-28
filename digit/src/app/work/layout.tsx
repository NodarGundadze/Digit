import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { roleHome, type Role } from "@/lib/types";
import { AppShell } from "@/components/AppShell";

export default async function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "worker") redirect(roleHome(user.role as Role));

  const isManager = user.workerProfile?.level === "manager";

  return (
    <AppShell
      subtitle="Specialist Portal"
      userName={user.name}
      avatarUrl={user.avatarUrl}
      badge={
        isManager ? (
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Manager
          </span>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
