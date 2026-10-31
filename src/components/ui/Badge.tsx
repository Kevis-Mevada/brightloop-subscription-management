import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "neutral"
    | "outline";
  status?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  status,
  children,
  ...props
}) => {
  let resolvedVariant = variant || "default";

  if (status) {
    const s = status.toUpperCase();
    if (["ACTIVE", "COMPLETED", "PAID", "ACCEPTED", "SUCCESS"].includes(s)) {
      resolvedVariant = "success";
    } else if (["PENDING", "PENDING_VERIFICATION", "SENT", "QUOTATION", "RUNNING"].includes(s)) {
      resolvedVariant = "warning";
    } else if (["CLOSED", "SUSPENDED", "CANCELLED", "REJECTED", "FAILED", "OVERDUE", "ARCHIVED"].includes(s)) {
      resolvedVariant = "danger";
    } else if (["CONFIRMED", "SERVICE", "PHYSICAL", "DIGITAL"].includes(s)) {
      resolvedVariant = "info";
    } else if (["DRAFT", "PAUSED", "INACTIVE"].includes(s)) {
      resolvedVariant = "neutral";
    }
  }

  const variants = {
    default: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200",
    danger: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200",
    info: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200",
    neutral: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
    outline: "bg-transparent text-slate-700 border-slate-300 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        variants[resolvedVariant],
        className
      )}
      {...props}
    >
      {children || status}
    </span>
  );
};
