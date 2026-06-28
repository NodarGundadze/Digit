import type { ReactNode } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { Brand } from "./Brand";
import { Avatar } from "./Avatar";
import { logoutAction } from "@/lib/actions/auth";
import { getBranding } from "@/lib/settings";

export async function AppShell({
  subtitle,
  userName,
  avatarUrl,
  badge,
  children,
}: {
  subtitle: string;
  userName: string;
  avatarUrl?: string | null;
  badge?: ReactNode;
  children: ReactNode;
}) {
  const { logoUrl, brandName } = await getBranding();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Brand subtitle={subtitle} logoUrl={logoUrl} brandName={brandName} />
          <div className="flex items-center gap-3">
            {badge}
            <div className="hidden sm:flex items-center gap-2">
              <Avatar src={avatarUrl} name={userName} />
              <span className="text-sm font-semibold text-slate-700">
                {userName}
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl px-3 py-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {children}
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-[10px] text-slate-400 font-mono bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{brandName.toUpperCase()} OPERATIONS PLATFORM © 2026</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Role-gated
            workspace · SQLite + Prisma
          </span>
        </div>
      </footer>
    </div>
  );
}
