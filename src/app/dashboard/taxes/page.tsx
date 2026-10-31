"use client";

import React, { useEffect, useState } from "react";
import { Plus, Calculator, Percent, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [isInclusive, setIsInclusive] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const fetchTaxes = async () => {
    try {
      const res = await fetch("/api/taxes");
      const json = await res.json();
      if (json.success) setTaxes(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rate: parseFloat(rate),
          isInclusive,
          isDefault,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to create tax rule");
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setName("");
      setRate("");
      setIsInclusive(false);
      setIsDefault(false);
      fetchTaxes();
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
            Tax Configuration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define organization-specific tax rates, VAT/GST rules, and tax-inclusive pricing behaviors.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Tax Rule
        </Button>
      </div>

      {/* Taxes Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Tax Name</th>
                <th className="py-3.5 px-4 font-semibold">Tax Rate</th>
                <th className="py-3.5 px-4 font-semibold">Pricing Mode</th>
                <th className="py-3.5 px-4 font-semibold">Default Rate</th>
                <th className="py-3.5 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading taxes...
                  </td>
                </tr>
              ) : taxes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Calculator className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    No tax rules defined. Click &quot;Add Tax Rule&quot; to configure one.
                  </td>
                </tr>
              ) : (
                taxes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {t.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {t.rate}%
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {t.isInclusive ? "Tax Inclusive Pricing" : "Tax Exclusive (Added at checkout)"}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.isDefault ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Default Org Rate
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge status={t.status ? "ACTIVE" : "INACTIVE"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Tax Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Tax Rule"
        description="Configure tax percentage applied to product and subscription lines."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <Input
            label="Tax Name"
            placeholder="e.g. Standard VAT (18%)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Tax Rate Percentage (%)"
            type="number"
            step="0.01"
            placeholder="18.00"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
          />

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isInclusive"
                checked={isInclusive}
                onChange={(e) => setIsInclusive(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="isInclusive" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Tax inclusive pricing (price already contains tax)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="isDefault" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                Set as default tax rate for new subscriptions and quotations
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Create Tax Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

