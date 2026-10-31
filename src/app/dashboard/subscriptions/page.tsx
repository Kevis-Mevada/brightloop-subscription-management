"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  Repeat,
  Pause,
  Play,
  RotateCw,
  XCircle,
  History,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // History modal
  const [selectedSubForHistory, setSelectedSubForHistory] = useState<any | null>(null);

  // New Subscription Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [billingFrequency, setBillingFrequency] = useState("MONTHLY");

  const loadData = async () => {
    try {
      const [resSubs, resCust, resPlans, resProds] = await Promise.all([
        fetch("/api/subscriptions").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/plans").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
      ]);

      if (resSubs.success) setSubscriptions(resSubs.data);
      if (resCust.success) setCustomers(resCust.data);
      if (resPlans.success) setPlans(resPlans.data);
      if (resProds.success) setProducts(resProds.data);
    } catch (err) {
      console.error("Error loading subscriptions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (id: string, action: string, reasonPrompt?: string) => {
    let reason = "";
    if (action === "CANCEL" || reasonPrompt) {
      const input = prompt(reasonPrompt || `Enter reason for ${action.toLowerCase()}:`);
      if (input === null) return;
      reason = input;
    }

    try {
      const res = await fetch("/api/subscriptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || `Failed to ${action}`);
      } else {
        loadData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateNewSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const selectedPlan = plans.find((p) => p.id === planId);
    const selectedProd = products[0];

    const payload = {
      customerId,
      planId,
      billingFrequency: billingFrequency || selectedPlan?.billingInterval || "MONTHLY",
      lines: [
        {
          productId: selectedProd?.id,
          variantId: selectedProd?.variants?.[0]?.id || null,
          quantity: 1,
          unitPrice: selectedPlan ? Number(selectedPlan.price) : 100,
          discountRate: 0,
          taxRate: 18,
        },
      ],
    };

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to create subscription");
        setIsSubmitting(false);
        return;
      }

      setIsNewModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Subscription Lifecycle
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Active recurring contracts, pause/resume controls, renewal schedules, and complete audit history.
          </p>
        </div>
        <Button
          onClick={() => {
            setCustomerId(customers[0]?.id || "");
            setPlanId(plans[0]?.id || "");
            setBillingFrequency(plans[0]?.billingInterval || "MONTHLY");
            setIsNewModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Subscription
        </Button>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Sub Number</th>
                  <th className="py-3.5 px-4 font-semibold">Subscriber</th>
                  <th className="py-3.5 px-4 font-semibold">Plan &amp; Frequency</th>
                  <th className="py-3.5 px-4 font-semibold">Next Billing</th>
                  <th className="py-3.5 px-4 font-semibold">Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading subscriptions...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Repeat className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      No subscriptions found. Click &quot;Create Subscription&quot; or convert an accepted quotation.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
                        {sub.subscriptionNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {sub.customer?.name}
                        <span className="block text-xs text-slate-400">{sub.customer?.companyName || sub.customer?.email}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 dark:text-slate-100 block">
                          {sub.plan?.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {sub.billingFrequency} &bull; Terms: {sub.paymentTerms}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="h-3 w-3 text-blue-500" />
                          {formatDate(sub.nextBillingDate)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(sub.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={sub.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume */}
                          {sub.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(sub.id, "PAUSE", "Reason for pausing subscription:")}
                              className="text-xs h-7 px-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                            >
                              <Pause className="mr-1 h-3 w-3" />
                              Pause
                            </Button>
                          )}
                          {sub.status === "PAUSED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(sub.id, "RESUME")}
                              className="text-xs h-7 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              <Play className="mr-1 h-3 w-3" />
                              Resume
                            </Button>
                          )}

                          {/* Renew */}
                          {(sub.status === "ACTIVE" || sub.status === "PAUSED") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(sub.id, "RENEW")}
                              className="text-xs h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <RotateCw className="mr-1 h-3 w-3" />
                              Renew
                            </Button>
                          )}

                          {/* Cancel */}
                          {sub.status !== "CLOSED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(sub.id, "CANCEL", "Reason for cancellation:")}
                              className="text-xs h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          )}

                          {/* History */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedSubForHistory(sub)}
                            className="text-xs h-7 px-2"
                          >
                            <History className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Audit Trail Modal */}
      {selectedSubForHistory && (
        <Modal
          isOpen={Boolean(selectedSubForHistory)}
          onClose={() => setSelectedSubForHistory(null)}
          title={`Audit History: ${selectedSubForHistory.subscriptionNumber}`}
          description={`Customer: ${selectedSubForHistory.customer?.name} &bull; Plan: ${selectedSubForHistory.plan?.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {selectedSubForHistory.history && selectedSubForHistory.history.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                {selectedSubForHistory.history.map((h: any) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 dark:border-slate-900" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {h.action}
                        </span>
                        {h.newStatus && <Badge status={h.newStatus} />}
                      </div>
                      {h.reason && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {h.reason}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        By {h.actorEmail || "System"} &bull; {formatDateTime(h.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-sm text-slate-500">
                No audit log entries recorded yet.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Create Direct Subscription Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Direct Subscription"
        description="Bind a customer to a recurring billing plan immediately."
      >
        <form onSubmit={handleCreateNewSub} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subscription Plan
            </label>
            <select
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                const pl = plans.find((p) => p.id === e.target.value);
                if (pl) setBillingFrequency(pl.billingInterval);
              }}
              required
              className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {formatCurrency(p.price)}/{p.billingInterval.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Activate Subscription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

