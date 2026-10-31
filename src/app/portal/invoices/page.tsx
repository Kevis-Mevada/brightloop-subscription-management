"use client";

import React, { useEffect, useState } from "react";
import { Receipt, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerInvoicesPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/portal")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCustomer(json.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const invoices = customer?.invoices || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          My Invoices
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          View all past billing statements, payment receipts, and download PDF copies.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Invoice Number</th>
                <th className="py-3.5 px-4 font-semibold">Issue Date</th>
                <th className="py-3.5 px-4 font-semibold">Due Date</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Amount Paid</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Receipt className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    No invoices generated for your account yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(inv.issueDate)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                      {formatCurrency(inv.paidAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewInvoice(inv)}
                        className="text-xs h-7 px-2.5"
                      >
                        <Printer className="mr-1 h-3 w-3" />
                        View / Print PDF
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Printable PDF Modal */}
      {previewInvoice && (
        <Modal
          isOpen={Boolean(previewInvoice)}
          onClose={() => setPreviewInvoice(null)}
          title={`Invoice: ${previewInvoice.invoiceNumber}`}
          maxWidth="4xl"
        >
          <div className="p-8 bg-white text-slate-900 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-blue-600">BRIGHTLOOP</h2>
                <p className="text-xs text-slate-500 mt-1">SaaS Subscription Management</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-extrabold text-slate-800">INVOICE</h3>
                <p className="font-mono text-sm font-semibold text-blue-600 mt-1">
                  {previewInvoice.invoiceNumber}
                </p>
                <p className="text-xs text-slate-500 mt-1">Date: {formatDate(previewInvoice.issueDate)}</p>
                <p className="text-xs text-slate-500">Due: {formatDate(previewInvoice.dueDate)}</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To:</h4>
                <p className="font-bold text-slate-800">{customer?.name}</p>
                {customer?.companyName && <p className="text-sm text-slate-600">{customer.companyName}</p>}
                <p className="text-sm text-slate-600">{customer?.billingAddress}</p>
                <p className="text-sm text-slate-600">{customer?.email}</p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status:</h4>
                <div className="inline-block">
                  <Badge status={previewInvoice.status} />
                </div>
              </div>
            </div>

            <table className="w-full text-left text-sm mb-6 border border-slate-200">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Tax</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {previewInvoice.lines && previewInvoice.lines.map((l: any) => (
                  <tr key={l.id}>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{l.description}</td>
                    <td className="py-2.5 px-3 text-center">{l.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(l.unitPrice)}</td>
                    <td className="py-2.5 px-3 text-right">{l.discountRate}%</td>
                    <td className="py-2.5 px-3 text-right">{l.taxRate}%</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatCurrency(l.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="w-64 ml-auto space-y-1.5 text-xs border-t border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(previewInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{formatCurrency(previewInvoice.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tax:</span>
                <span className="font-semibold">+{formatCurrency(previewInvoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(previewInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pt-1">
                <span>Amount Paid:</span>
                <span className="text-emerald-600 font-semibold">{formatCurrency(previewInvoice.paidAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 mt-6 print:hidden">
              <Button variant="outline" onClick={() => setPreviewInvoice(null)}>Close</Button>
              <Button onClick={handlePrint} className="bg-blue-600 text-white">
                <Printer className="mr-2 h-4 w-4" />
                Print / Download PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

