"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerPaymentsPage() {
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

  const payments = customer?.payments || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Payment History &amp; Receipts
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historical record of all successful subscription transaction payments.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Receipt Number</th>
                <th className="py-3.5 px-4 font-semibold">Invoice Number</th>
                <th className="py-3.5 px-4 font-semibold">Payment Method</th>
                <th className="py-3.5 px-4 font-semibold">Reference</th>
                <th className="py-3.5 px-4 font-semibold">Date Paid</th>
                <th className="py-3.5 px-4 font-semibold">Amount</th>
                <th className="py-3.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CreditCard className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    No payments on record yet.
                  </td>
                </tr>
              ) : (
                payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-emerald-600">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-600">
                      {p.invoice?.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium">
                      {p.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      {p.transactionReference || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge status={p.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

