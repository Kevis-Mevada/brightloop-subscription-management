"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Repeat,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Receipt,
  PlusCircle,
  Zap,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Error loading metrics", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRunBilling = async () => {
    setIsBillingRunning(true);
    setBillingMessage(null);
    try {
      const res = await fetch("/api/billing/run", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setBillingMessage(json.message);
        fetchMetrics();
      } else {
        setBillingMessage(`Billing Run Error: ${json.error}`);
      }
    } catch (err: any) {
      setBillingMessage(`Failed to trigger billing: ${err.message}`);
    } finally {
      setIsBillingRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalCustomers: 0,
    activeSubscriptions: 0,
    totalSubscriptions: 0,
    mrr: 0,
    arr: 0,
    revenueCollected: 0,
    outstandingPayments: 0,
    overdueInvoices: 0,
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Subscription Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial performance and active subscription metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRunBilling}
            isLoading={isBillingRunning}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <Zap className="mr-2 h-4 w-4 text-blue-600" />
            Run Billing Engine
          </Button>
          <Link href="/dashboard/subscriptions">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Subscription
            </Button>
          </Link>
        </div>
      </div>

      {/* Notification banner if billing ran */}
      {billingMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">{billingMessage}</span>
          </div>
          <button
            onClick={() => setBillingMessage(null)}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Monthly Recurring Revenue (MRR)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.mrr)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ARR: {formatCurrency(metrics.arr)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Active Subscriptions
            </CardTitle>
            <Repeat className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics.activeSubscriptions}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Out of {metrics.totalSubscriptions} total created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Revenue Collected
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.revenueCollected)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Total lifetime payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Outstanding Balance
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.outstandingPayments)}
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">
              {metrics.overdueInvoices} overdue invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Grid: Upcoming Renewals & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Renewals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Upcoming Renewals (30 Days)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Subscriptions due to recur soon</p>
            </div>
            <Link
              href="/dashboard/subscriptions"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.upcomingRenewals && data.upcomingRenewals.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingRenewals.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {sub.customer?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {sub.plan?.name} &bull; {sub.subscriptionNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(sub.totalAmount)}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                        <Clock className="h-3 w-3" />
                        {formatDate(sub.nextBillingDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                No renewals due within the next 30 days.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Recorded transaction receipts</p>
            </div>
            <Link
              href="/dashboard/payments"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {data?.recentPayments && data.recentPayments.length > 0 ? (
              <div className="space-y-3">
                {data.recentPayments.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {p.customer?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Invoice {p.invoice?.invoiceNumber} &bull; {p.paymentMethod.replace("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(p.amount)}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(p.paymentDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                No payment transactions recorded yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

