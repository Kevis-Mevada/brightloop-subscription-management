import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brightloop | Multi-Tenant SaaS Subscription Management",
  description: "Enterprise Subscription Lifecycle, Recurring Billing, and Customer Portals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
