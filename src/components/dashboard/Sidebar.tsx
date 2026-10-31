"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  Users,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Calculator,
  BarChart3,
  Settings,
  LogOut,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/lib/types";

interface SidebarProps {
  user: SessionUser;
}

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/dashboard/products", icon: Package },
    { label: "Plans", href: "/dashboard/plans", icon: CalendarDays },
    { label: "Customers", href: "/dashboard/customers", icon: Users },
    { label: "Quotations", href: "/dashboard/quotations", icon: FileSpreadsheet },
    { label: "Subscriptions", href: "/dashboard/subscriptions", icon: Repeat },
    { label: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { label: "Payments", href: "/dashboard/payments", icon: CreditCard },
    { label: "Discounts", href: "/dashboard/discounts", icon: Percent },
    { label: "Tax Rules", href: "/dashboard/taxes", icon: Calculator },
    { label: "Billing Engine", href: "/dashboard/billing-jobs", icon: Zap },
    { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            BL
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white">Brightloop</span>
            <span className="block text-[10px] text-blue-400 font-medium uppercase tracking-wider">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {user.role === "SUPER_ADMIN" && (
          <Link
            href="/super-admin"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-amber-300 bg-amber-950/40 border border-amber-800/50 mb-3 hover:bg-amber-900/40 transition-colors"
          >
            <ShieldAlert className="h-4 w-4" />
            Super Admin Console
          </Link>
        )}

        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-md transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
