import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { roleHome, type Role } from "@/lib/types";
import { AppShell } from "@/components/AppShell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "customer") redirect(roleHome(user.role as Role));

  return (
    <AppShell subtitle="Customer Portal" userName={user.name} avatarUrl={user.avatarUrl}>
      {children}
    </AppShell>
  );
}
