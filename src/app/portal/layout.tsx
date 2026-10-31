import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Repeat, Receipt, CreditCard, User, LogOut } from "lucide-react";

export const metadata = {
  title: "Customer Portal | Brightloop",
  description: "Manage your subscriptions, view invoices, and update billing settings.",
};

export default async function CustomerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Top Customer Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                BL
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                Customer Portal
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/portal"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800"
              >
                Overview
              </Link>
              <Link
                href="/portal/subscriptions"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Repeat className="h-4 w-4" />
                My Subscriptions
              </Link>
              <Link
                href="/portal/invoices"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Receipt className="h-4 w-4" />
                Invoices
              </Link>
              <Link
                href="/portal/payments"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <CreditCard className="h-4 w-4" />
                Payment History
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{session.name}</p>
              <p className="text-xs text-slate-500">{session.email}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">{children}</main>
    </div>
  );
}

