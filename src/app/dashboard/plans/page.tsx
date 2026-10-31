"use client";

import React, { useEffect, useState } from "react";
import { Plus, Calendar, Clock, Layers, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [billingInterval, setBillingInterval] = useState("MONTHLY");
  const [minimumQuantity, setMinimumQuantity] = useState("1");
  const [autoClose, setAutoClose] = useState(false);
  const [allowPause, setAllowPause] = useState(true);
  const [allowEarlyCancellation, setAllowEarlyCancellation] = useState(true);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const json = await res.json();
      if (json.success) {
        setPlans(json.data);
      }
    } catch (err) {
      console.error("Error fetching plans", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openAddModal = () => {
    setEditingPlan(null);
    setName("");
    setCode("");
    setDescription("");
    setPrice("");
    setBillingInterval("MONTHLY");
    setMinimumQuantity("1");
    setAutoClose(false);
    setAllowPause(true);
    setAllowEarlyCancellation(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setName(plan.name);
    setCode(plan.code);
    setDescription(plan.description || "");
    setPrice(plan.price.toString());
    setBillingInterval(plan.billingInterval);
    setMinimumQuantity(plan.minimumQuantity.toString());
    setAutoClose(plan.autoClose);
    setAllowPause(plan.allowPause);
    setAllowEarlyCancellation(plan.allowEarlyCancellation);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      name,
      code,
      description,
      price: parseFloat(price),
      billingInterval,
      minimumQuantity: parseInt(minimumQuantity || "1"),
      autoClose,
      allowPause,
      allowEarlyCancellation,
    };

    try {
      const url = "/api/plans";
      const method = editingPlan ? "PUT" : "POST";
      const body = editingPlan ? { ...payload, id: editingPlan.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to save plan");
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      fetchPlans();
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
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure Daily, Weekly, Monthly, and Yearly recurring pricing models and cancellation policies.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            Loading subscription plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            No subscription plans created yet. Click &quot;Create Plan&quot; to add your first billing plan.
          </div>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{plan.billingInterval}</Badge>
                  <Badge status={plan.status} />
                </div>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <p className="font-mono text-xs text-slate-400">{plan.code}</p>
                {plan.description && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    /{plan.billingInterval.toLowerCase()}
                  </span>
                </div>

                {/* Policies checklist */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Minimum Quantity</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {plan.minimumQuantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Pause Allowed</span>
                    <span>
                      {plan.allowPause ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-400 inline" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Early Cancellation</span>
                    <span>
                      {plan.allowEarlyCancellation ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-400 inline" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Active Subscriptions</span>
                    <span className="font-semibold text-blue-600">
                      {plan._count?.subscriptions || 0}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(plan)}
                  className="w-full mt-2"
                >
                  Edit Configuration
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? "Edit Subscription Plan" : "Create Subscription Plan"}
        description="Configure pricing, recurrence frequency, and subscription lifecycle rules."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              placeholder="e.g. Professional Cloud Monthly"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Plan Code"
              placeholder="e.g. PLAN-PRO-MO"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              placeholder="299.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Recurrence Frequency
              </label>
              <select
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="DAILY">Daily Billing</option>
                <option value="WEEKLY">Weekly Billing</option>
                <option value="MONTHLY">Monthly Billing</option>
                <option value="YEARLY">Yearly Billing</option>
              </select>
            </div>
            <Input
              label="Min Quantity"
              type="number"
              value={minimumQuantity}
              onChange={(e) => setMinimumQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe plan features and target tier..."
              className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Lifecycle policy toggles */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Subscription Lifecycle Policies
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowPause"
                checked={allowPause}
                onChange={(e) => setAllowPause(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="allowPause" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Allow customers and staff to pause subscription
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowEarlyCancellation"
                checked={allowEarlyCancellation}
                onChange={(e) => setAllowEarlyCancellation(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label
                htmlFor="allowEarlyCancellation"
                className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Allow early cancellation before contract expiry date
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoClose"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="autoClose" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Auto-close subscription when expiry end date is reached
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              {editingPlan ? "Save Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

