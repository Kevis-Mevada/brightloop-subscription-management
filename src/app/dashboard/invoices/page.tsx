"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  Receipt,
  Printer,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Payment Recording modal
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CREDIT_CARD");
  const [reference, setReference] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // PDF Preview modal
  const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data);
      }
    } catch (err) {
      console.error("Error fetching invoices", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const openPaymentModal = (inv: any) => {
    const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
    setPaymentInvoice(inv);
    setPayAmount(outstanding.toFixed(2));
    setPaymentMethod("CREDIT_CARD");
    setReference(`txn_${Math.random().toString(36).substring(2, 10)}`);
    setPayNotes("");
    setPayError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    setIsPaying(true);
    setPayError(null);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: paymentInvoice.id,
          amount: parseFloat(payAmount),
          paymentMethod,
          transactionReference: reference,
          notes: payNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setPayError(json.error || "Failed to record payment");
        setIsPaying(false);
        return;
      }

      setPaymentInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      setPayError(err.message || "Failed to submit payment");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(s) ||
      inv.customer?.name.toLowerCase().includes(s) ||
      inv.customer?.email.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Invoice Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track generated invoices, reconcile payments, review balances, and export PDF receipts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Invoice Number</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Issue / Due Date</th>
                  <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Paid</th>
                  <th className="py-3.5 px-4 font-semibold">Balance Due</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Receipt className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      No invoices found. Invoices are generated automatically by the recurring billing engine.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const balance = Number(inv.totalAmount) - Number(inv.paidAmount);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {inv.customer?.name}
                          <span className="block text-xs text-slate-400">{inv.customer?.email}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          <span>{formatDate(inv.issueDate)}</span>
                          <span className="block text-slate-400">Due: {formatDate(inv.dueDate)}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 font-medium">
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          {balance > 0 ? (
                            <span className="text-amber-600">{formatCurrency(balance)}</span>
                          ) : (
                            <span className="text-slate-400">$0.00</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={inv.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {balance > 0 && inv.status !== "CANCELLED" && (
                              <Button
                                size="sm"
                                onClick={() => openPaymentModal(inv)}
                                className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                              >
                                <DollarSign className="mr-1 h-3 w-3" />
                                Record Pay
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewInvoice(inv)}
                              className="text-xs h-7 px-2"
                            >
                              <Printer className="mr-1 h-3 w-3" />
                              View PDF
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <Modal
          isOpen={Boolean(paymentInvoice)}
          onClose={() => setPaymentInvoice(null)}
          title={`Record Payment for ${paymentInvoice.invoiceNumber}`}
          description={`Customer: ${paymentInvoice.customer?.name} &bull; Total: ${formatCurrency(paymentInvoice.totalAmount)}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {payError && (
              <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
                {payError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Payment Amount ($)"
                type="number"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <Input
              label="Transaction / Reference Code"
              placeholder="e.g. txn_123456789"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Note (Optional)
              </label>
              <textarea
                rows={2}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Check number, bank confirmation, or memo..."
                className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setPaymentInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isPaying} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Confirm &amp; Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable PDF Invoice Modal */}
      {previewInvoice && (
        <Modal
          isOpen={Boolean(previewInvoice)}
          onClose={() => setPreviewInvoice(null)}
          title={`Printable Invoice: ${previewInvoice.invoiceNumber}`}
          maxWidth="4xl"
        >
          <div className="p-8 bg-white text-slate-900 rounded-lg border border-slate-200 print:border-0 print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-600">BRIGHTLOOP</h2>
                <p className="text-xs text-slate-500 mt-1">SaaS Subscription Management</p>
                <p className="text-xs text-slate-500">support@brightloop.io &bull; www.brightloop.io</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-extrabold text-slate-800">INVOICE</h3>
                <p className="font-mono text-sm font-semibold text-blue-600 mt-1">
                  {previewInvoice.invoiceNumber}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Date: {formatDate(previewInvoice.issueDate)}
                </p>
                <p className="text-xs text-slate-500">
                  Due: {formatDate(previewInvoice.dueDate)}
                </p>
              </div>
            </div>

            {/* Billed To */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Billed To:
                </h4>
                <p className="font-bold text-slate-800">{previewInvoice.customer?.name}</p>
                {previewInvoice.customer?.companyName && (
                  <p className="text-sm text-slate-600">{previewInvoice.customer?.companyName}</p>
                )}
                <p className="text-sm text-slate-600">{previewInvoice.customer?.billingAddress}</p>
                <p className="text-sm text-slate-600">{previewInvoice.customer?.email}</p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Payment Status:
                </h4>
                <div className="inline-block">
                  <Badge status={previewInvoice.status} />
                </div>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-left text-sm mb-6 border border-slate-200">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Disc %</th>
                  <th className="py-2.5 px-3 text-right">Tax %</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewInvoice.lines && previewInvoice.lines.map((l: any) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {l.description}
                    </td>
                    <td className="py-2.5 px-3 text-center">{l.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(l.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right">{l.discountRate}%</td>
                    <td className="py-2.5 px-3 text-right">{l.taxRate}%</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatCurrency(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Breakdown */}
            <div className="w-64 ml-auto space-y-1.5 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(previewInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(previewInvoice.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax:</span>
                <span className="font-semibold">+{formatCurrency(previewInvoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Due:</span>
                <span className="text-blue-600">{formatCurrency(previewInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Paid Amount:</span>
                <span className="text-emerald-600 font-semibold">{formatCurrency(previewInvoice.paidAmount)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6 print:hidden">
              <Button variant="outline" onClick={() => setPreviewInvoice(null)}>
                Close
              </Button>
              <Button onClick={handlePrint} className="bg-blue-600 text-white">
                <Printer className="mr-2 h-4 w-4" />
                Print or Save as PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

