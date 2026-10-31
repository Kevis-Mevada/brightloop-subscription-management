"use client";

import React, { useEffect, useState } from "react";
import { Download, TrendingUp, DollarSign, Repeat, AlertCircle, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const exportCSV = () => {
    if (!data?.metrics) return;
    const rows = [
      ["Metric", "Value"],
      ["Monthly Recurring Revenue (MRR)", data.metrics.mrr],
      ["Annual Recurring Revenue (ARR)", data.metrics.arr],
      ["Active Subscriptions", data.metrics.activeSubscriptions],
      ["Total Subscriptions", data.metrics.totalSubscriptions],
      ["Total Customers", data.metrics.totalCustomers],
      ["Revenue Collected", data.metrics.revenueCollected],
      ["Outstanding Payments", data.metrics.outstandingPayments],
      ["Overdue Invoices Count", data.metrics.overdueInvoices],
      ["Overdue Amount", data.metrics.overdueAmount],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `brightloop-financial-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Financial &amp; Revenue Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time financial statement, recurring analytics, and exportable ledger snapshots.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
          <Download className="mr-2 h-4 w-4" />
          Export Financial CSV
        </Button>
      </div>

      {/* Financial Table Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Recurring Revenue Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Monthly Recurring Revenue (MRR)</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(m.mrr)}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Annual Recurring Revenue (ARR)</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(m.arr)}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Active Subscriptions</span>
              <span className="font-semibold text-blue-600">{m.activeSubscriptions}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Subscriptions Created</span>
              <span className="font-semibold">{m.totalSubscriptions}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Cash Collection &amp; Receivables
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Total Revenue Collected</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(m.revenueCollected)}
              </span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Outstanding AR Balance</span>
              <span className="font-bold text-amber-600">{formatCurrency(m.outstandingPayments)}</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Overdue Invoices Count</span>
              <span className="font-semibold text-rose-600">{m.overdueInvoices} invoices</span>
            </div>
            <div className="py-3 flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Overdue Receivables Amount</span>
              <span className="font-bold text-rose-600">{formatCurrency(m.overdueAmount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

