"use client";

import React, { useEffect, useState } from "react";
import { Repeat, Pause, XCircle, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerSubscriptionsPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerData = async () => {
    try {
      const res = await fetch("/api/portal");
      const json = await res.json();
      if (json.success) setCustomer(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleAction = async (subId: string, action: string) => {
    const reason = prompt(`Please specify your reason to ${action.toLowerCase()} this subscription:`);
    if (reason === null) return;

    try {
      const res = await fetch("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subId, action, reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || `Failed to ${action}`);
      } else {
        alert(`Subscription ${action.toLowerCase()}d successfully.`);
        fetchCustomerData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const subs = customer?.subscriptions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Subscriptions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review subscription details, renewal periods, and manage pause or cancellation settings.
        </p>
      </div>

      <div className="space-y-4">
        {subs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              <Repeat className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              You currently do not have any active subscriptions.
            </CardContent>
          </Card>
        ) : (
          subs.map((sub: any) => (
            <Card key={sub.id} className="overflow-hidden">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between py-4">
                <div>
                  <span className="font-mono text-xs font-semibold text-blue-600">
                    {sub.subscriptionNumber}
                  </span>
                  <CardTitle className="text-lg font-bold mt-0.5">{sub.plan?.name}</CardTitle>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={sub.status} />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <span className="text-xs text-slate-500 block">Billing Cadence</span>
                    <span className="font-semibold text-sm capitalize">
                      {sub.billingFrequency.toLowerCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Next Renewal Date</span>
                    <span className="font-semibold text-sm flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      {formatDate(sub.nextBillingDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Amount Per Cycle</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {formatCurrency(sub.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Payment Terms</span>
                    <span className="text-sm font-medium">{sub.paymentTerms}</span>
                  </div>
                </div>

                {/* Included Product Lines */}
                {sub.lines && sub.lines.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mb-6">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Subscribed Line Items
                    </h5>
                    <div className="space-y-1.5">
                      {sub.lines.map((l: any) => (
                        <div key={l.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>
                            {l.quantity}x {l.description || l.product?.name}
                            {l.variant && ` (${l.variant.name})`}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatCurrency(l.total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Self service actions */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-end gap-3">
                  {sub.status === "ACTIVE" && sub.plan?.allowPause && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(sub.id, "PAUSE")}
                      className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                    >
                      <Pause className="mr-1.5 h-3.5 w-3.5" />
                      Request Pause
                    </Button>
                  )}
                  {sub.status === "PAUSED" && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(sub.id, "RESUME")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Resume Subscription
                    </Button>
                  )}
                  {sub.status !== "CLOSED" && sub.plan?.allowEarlyCancellation && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(sub.id, "CANCEL")}
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

