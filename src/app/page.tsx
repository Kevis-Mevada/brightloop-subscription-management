import Link from "next/link";
import {
  Repeat,
  ShieldCheck,
  Zap,
  BarChart3,
  Receipt,
  Users,
  CheckCircle2,
  ArrowRight,
  Globe2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
              BL
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">Brightloop</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md shadow-blue-500/25 transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-900 to-slate-900 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-6">
            <Globe2 className="h-3.5 w-3.5" />
            True Multi-Tenant SaaS Architecture
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Automated Recurring Billing &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Subscription Management
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Enterprise subscription lifecycle platform built for modern SaaS. Scale your recurring
            revenue with bulletproof tenant isolation, atomic billing jobs, quotation lifecycles, and self-service portals.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-lg shadow-lg shadow-blue-500/30 transition-all text-base"
            >
              Get Started with Brightloop <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-8 py-3.5 rounded-lg border border-slate-700 transition-all text-base"
            >
              Sign In to Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Core Highlights */}
      <section className="py-20 bg-slate-950 border-t border-slate-800 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Engineered for Enterprise Subscription Workflows
            </h2>
            <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">
              Everything required to manage subscriptions, calculate MRR/ARR, bill automatically, and collect payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Automated Recurring Billing</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Deterministic billing engine with atomic idempotency keys, avoiding duplicate invoices across daily, weekly, monthly, and yearly cycles.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Tenant Isolation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Strict organization separation enforced in database schema, server actions, and API boundaries. Zero cross-tenant data leakage.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-Time MRR &amp; ARR Analytics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Live calculated revenue metrics, churn tracking, outstanding balance reconciliation, and upcoming renewal alerts.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Quotations &amp; Conversion</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Send professional quotations with line items, tax, and discount rules. 1-click conversion to active subscriptions upon acceptance.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Customer Self-Service Portal</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dedicated portal for customers to view active subscriptions, download PDF invoices, check payment receipts, and request pause/cancel.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="h-12 w-12 rounded-lg bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Transactional Resend Emails</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automated email delivery for invoices, payment receipts, upcoming renewals, and email verification powered by Resend API.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800 bg-slate-950 px-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Brightloop SaaS Subscription Management System. All rights reserved.
      </footer>
    </div>
  );
}

