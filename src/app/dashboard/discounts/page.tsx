"use client";

import React, { useEffect, useState } from "react";
import { Plus, Percent, Tag, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("PERCENTAGE");
  const [value, setValue] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/discounts");
      const json = await res.json();
      if (json.success) setDiscounts(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          type,
          value: parseFloat(value),
          minSpend: minSpend ? parseFloat(minSpend) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          endDate: endDate ? new Date(endDate) : null,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to create discount");
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setCode("");
      setName("");
      setValue("");
      setMinSpend("");
      setUsageLimit("");
      setEndDate("");
      fetchDiscounts();
    } catch (err: any) {
      setError(err.message);
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
            Discount &amp; Promotion Rules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure percentage and fixed price discount codes, spend thresholds, and usage limits.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Discount
        </Button>
      </div>

      {/* Discounts Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Coupon Code</th>
                <th className="py-3.5 px-4 font-semibold">Promotion Name</th>
                <th className="py-3.5 px-4 font-semibold">Discount Amount</th>
                <th className="py-3.5 px-4 font-semibold">Min Spend</th>
                <th className="py-3.5 px-4 font-semibold">Usage</th>
                <th className="py-3.5 px-4 font-semibold">Valid Until</th>
                <th className="py-3.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading discounts...
                  </td>
                </tr>
              ) : discounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Tag className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    No discount codes created yet. Click &quot;Create Discount&quot; to configure promotions.
                  </td>
                </tr>
              ) : (
                discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-600">
                      {d.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {d.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {d.type === "PERCENTAGE" ? `${d.value}% Off` : `-${formatCurrency(d.value)}`}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {d.minSpend ? formatCurrency(d.minSpend) : "No minimum"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {d.usedCount} {d.usageLimit ? `/ ${d.usageLimit}` : "used"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {d.endDate ? formatDate(d.endDate) : "Never expires"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge status={d.status ? "ACTIVE" : "INACTIVE"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Discount Code"
        description="Set up promotional codes for quotations and subscription invoices."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Promo Code"
              placeholder="e.g. WELCOME20"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Input
              label="Campaign Name"
              placeholder="e.g. Q4 Starter Promo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Discount Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </div>
            <Input
              label={type === "PERCENTAGE" ? "Percentage (%)" : "Fixed Discount ($)"}
              type="number"
              step="0.01"
              placeholder="10.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Min Spend ($)"
              type="number"
              step="0.01"
              placeholder="Optional"
              value={minSpend}
              onChange={(e) => setMinSpend(e.target.value)}
            />
            <Input
              label="Max Usages"
              type="number"
              placeholder="Unlimited"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
            <Input
              label="Expiry Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Create Discount
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

