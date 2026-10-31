"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, FileText, Send, Check, X, ArrowRight, Repeat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<any[]>([
    { productId: "", variantId: "", description: "", quantity: 1, unitPrice: 0, discountRate: 0, taxRate: 18 },
  ]);

  const loadData = async () => {
    try {
      const [resQuotes, resCust, resPlans, resProds, resTaxes] = await Promise.all([
        fetch("/api/quotations").then((r) => r.json()),
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/plans").then((r) => r.json()),
        fetch("/api/products").then((r) => r.json()),
        fetch("/api/taxes").then((r) => r.json()),
      ]);

      if (resQuotes.success) setQuotations(resQuotes.data);
      if (resCust.success) setCustomers(resCust.data);
      if (resPlans.success) setPlans(resPlans.data);
      if (resProds.success) setProducts(resProds.data);
      if (resTaxes.success) setTaxes(resTaxes.data);
    } catch (err) {
      console.error("Error loading quotation data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    const firstCust = customers[0]?.id || "";
    const firstPlan = plans[0]?.id || "";
    setCustomerId(firstCust);
    setPlanId(firstPlan);
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setValidUntil(d.toISOString().slice(0, 10));
    setNotes("Standard 30-day quotation validity terms.");
    if (products.length > 0) {
      const firstProd = products[0];
      setLines([
        {
          productId: firstProd.id,
          variantId: firstProd.variants?.[0]?.id || "",
          description: firstProd.name,
          quantity: 1,
          unitPrice: Number(firstProd.salesPrice),
          discountRate: 0,
          taxRate: 18,
        },
      ]);
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleProductSelect = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    const updated = [...lines];
    updated[index].productId = pId;
    updated[index].description = prod?.name || "";
    updated[index].unitPrice = Number(prod?.salesPrice || 0);
    updated[index].variantId = prod?.variants?.[0]?.id || "";
    setLines(updated);
  };

  const addLine = () => {
    const firstProd = products[0];
    setLines([
      ...lines,
      {
        productId: firstProd?.id || "",
        variantId: firstProd?.variants?.[0]?.id || "",
        description: firstProd?.name || "",
        quantity: 1,
        unitPrice: Number(firstProd?.salesPrice || 0),
        discountRate: 0,
        taxRate: 18,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: string, val: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: val };
    setLines(updated);
  };

  const calculateTotals = () => {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    lines.forEach((l) => {
      const lineSub = (parseInt(l.quantity) || 1) * (parseFloat(l.unitPrice) || 0);
      const lineDisc = lineSub * ((parseFloat(l.discountRate) || 0) / 100);
      const afterDisc = lineSub - lineDisc;
      const lineTax = afterDisc * ((parseFloat(l.taxRate) || 0) / 100);
      sub += lineSub;
      disc += lineDisc;
      tax += lineTax;
    });
    return { sub, disc, tax, total: sub - disc + tax };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const effectiveCustId = customerId || customers[0]?.id;
    const effectivePlanId = planId || plans[0]?.id || null;
    const effectiveLines = lines.map((l) => {
      const pId = l.productId || products[0]?.id;
      const prod = products.find((p) => p.id === pId);
      return {
        ...l,
        productId: pId,
        description: l.description || prod?.name || "Quoted Service",
        unitPrice: parseFloat(l.unitPrice) || Number(prod?.salesPrice || 0),
      };
    });

    if (!effectiveCustId || !effectiveLines[0]?.productId) {
      setError("Please ensure a valid customer and product are selected.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: effectiveCustId,
          planId: effectivePlanId,
          validUntil,
          notes,
          lines: effectiveLines,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to create quotation");
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/quotations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.success) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvert = async (id: string) => {
    try {
      const res = await fetch("/api/quotations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, convertToSubscription: true }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        loadData();
      } else {
        alert(json.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Quotation Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build proposals, send to subscribers, track approval lifecycle, and convert directly to subscriptions.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Create Quotation
        </Button>
      </div>

      {/* Quotations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Quote Number</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Associated Plan</th>
                  <th className="py-3.5 px-4 font-semibold">Valid Until</th>
                  <th className="py-3.5 px-4 font-semibold">Subtotal</th>
                  <th className="py-3.5 px-4 font-semibold">Total</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Lifecycle Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading quotations...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      No quotations found. Click &quot;Create Quotation&quot; to build one.
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
                        {q.quotationNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {q.customer?.name}
                        <span className="block text-xs text-slate-400">{q.customer?.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {q.plan?.name || "Custom Line Items"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(q.validUntil)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {formatCurrency(q.subtotal)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={q.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(q.id, "SENT")}
                              className="text-xs h-7 px-2"
                            >
                              <Send className="mr-1 h-3 w-3 text-blue-500" />
                              Send
                            </Button>
                          )}
                          {q.status === "SENT" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(q.id, "ACCEPTED")}
                                className="text-xs h-7 px-2 text-emerald-600 border-emerald-200"
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(q.id, "REJECTED")}
                                className="text-xs h-7 px-2 text-rose-600 border-rose-200"
                              >
                                <X className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                          {(q.status === "ACCEPTED" || q.status === "SENT") && !q.subscription && (
                            <Button
                              size="sm"
                              onClick={() => handleConvert(q.id)}
                              className="text-xs h-7 px-2 bg-blue-600 text-white hover:bg-blue-500"
                            >
                              <Repeat className="mr-1 h-3 w-3" />
                              Convert to Sub
                            </Button>
                          )}
                          {q.subscription && (
                            <span className="text-[11px] font-mono font-medium text-emerald-600">
                              Sub: {q.subscription.subscriptionNumber}
                            </span>
                          )}
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

      {/* Add Quotation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Subscription Quotation"
        description="Add multi-product lines, variants, discounts, and calculate invoice totals."
        maxWidth="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Select Customer
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
                Subscription Plan Model
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">No Plan (Custom Ad-hoc)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(p.price)}/{p.billingInterval.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Valid Until"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              required
            />
          </div>

          {/* Quotation Lines Builder */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Quotation Line Items
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={addLine}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Line Item
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((l, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 items-center text-xs"
                >
                  <div className="col-span-4">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Product</label>
                    <select
                      value={l.productId}
                      onChange={(e) => handleProductSelect(i, e.target.value)}
                      className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.salesPrice)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={(e) => updateLine(i, "quantity", parseInt(e.target.value || "1"))}
                      className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={l.unitPrice}
                      onChange={(e) => updateLine(i, "unitPrice", parseFloat(e.target.value || "0"))}
                      className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Disc %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={l.discountRate}
                      onChange={(e) => updateLine(i, "discountRate", parseFloat(e.target.value || "0"))}
                      className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Tax %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={l.taxRate}
                      onChange={(e) => updateLine(i, "taxRate", parseFloat(e.target.value || "0"))}
                      className="w-full h-8 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="col-span-1 text-right font-semibold">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Line Total</label>
                    <span className="text-slate-900 dark:text-slate-100">
                      {formatCurrency(
                        (l.quantity * l.unitPrice * (1 - l.discountRate / 100)) * (1 + l.taxRate / 100)
                      )}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="text-red-500 hover:text-red-700 text-sm font-bold"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Totals Summary */}
            <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-xs ml-auto space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {formatCurrency(totals.sub)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Discount:</span>
                <span className="font-medium text-emerald-600">
                  -{formatCurrency(totals.disc)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Tax:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  +{formatCurrency(totals.tax)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Grand Total:</span>
                <span className="text-blue-600">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Create Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

