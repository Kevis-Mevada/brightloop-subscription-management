"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Repeat, Receipt, DollarSign, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerPortalHomePage() {
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCustomer(json.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeSubs = customer?.subscriptions?.filter((s: any) => s.status === "ACTIVE") || [];
  const unpaidInvoices = customer?.invoices?.filter((i: any) => i.status !== "PAID" && i.status !== "CANCELLED") || [];
  const totalBalanceDue = unpaidInvoices.reduce((sum: number, i: any) => sum + (Number(i.totalAmount) - Number(i.paidAmount)), 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome back, {customer?.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your subscriptions, manage renewals, and check billing history.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Subscriptions
            </CardTitle>
            <Repeat className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeSubs.length}
            </div>
            <Link
              href="/portal/subscriptions"
              className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-flex items-center gap-1"
            >
              Manage subscriptions <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Outstanding Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(totalBalanceDue)}
            </div>
            <Link
              href="/portal/invoices"
              className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-flex items-center gap-1"
            >
              View pending invoices <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Lifetime Payments
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {customer?.payments?.length || 0}
            </div>
            <Link
              href="/portal/payments"
              className="text-xs text-blue-600 font-semibold hover:underline mt-2 inline-flex items-center gap-1"
            >
              View payment receipts <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">My Active Services</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Recurring plans associated with your account</p>
          </div>
          <Link href="/portal/subscriptions">
            <Button variant="outline" size="sm" className="text-xs">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {activeSubs.length > 0 ? (
            <div className="space-y-4">
              {activeSubs.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        {sub.plan?.name}
                      </h4>
                      <Badge status={sub.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {sub.subscriptionNumber} &bull; Next renewal:{" "}
                      <strong className="text-slate-700 dark:text-slate-300">
                        {formatDate(sub.nextBillingDate)}
                      </strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(sub.totalAmount)}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      Billed {sub.billingFrequency.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">
              No active subscriptions found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

