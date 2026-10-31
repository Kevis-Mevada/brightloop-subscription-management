import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ShieldAlert, Building2, Users, LayoutDashboard, LogOut } from "lucide-react";

export const metadata = {
  title: "Super Admin Console | Brightloop",
  description: "Platform-wide management and organization administration.",
};

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/login?error=Access%20denied.%20Super%20Admin%20only.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Super Admin Top Header */}
      <header className="border-b border-amber-900/40 bg-slate-900/90 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                Super Admin Console
              </span>
            </div>

            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link
                href="/super-admin"
                className="px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30"
              >
                Platform Organizations
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                Tenant Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-amber-300 font-mono">
              {session.email}
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">{children}</main>
    </div>
  );
}

