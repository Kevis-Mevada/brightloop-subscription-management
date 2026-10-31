"use client";

import React from "react";
import { Building2, Bell } from "lucide-react";
import { SessionUser } from "@/lib/types";

interface HeaderProps {
  user: SessionUser;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ user, title, subtitle, actions }) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        {title && (
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user.organizationName && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>{user.organizationName}</span>
          </div>
        )}

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
};
