"use client";

import React, { useEffect, useState } from "react";
import { Zap, Play, CheckCircle2, XCircle, Clock, Server, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

export default function BillingJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/billing/run");
      const json = await res.json();
      if (json.success) setJobs(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRunBilling = async () => {
    setIsRunning(true);
    setResultMessage(null);

    try {
      const res = await fetch("/api/billing/run", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setResultMessage(json.message);
        fetchJobs();
      } else {
        setResultMessage(`Error: ${json.error}`);
      }
    } catch (err: any) {
      setResultMessage(`Failed to trigger billing engine: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="h-6 w-6 text-blue-600" />
            Automatic Recurring Billing Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deterministic billing engine with idempotency keys, atomic DB transactions, and period boundary recalculations.
          </p>
        </div>
        <Button
          onClick={handleRunBilling}
          isLoading={isRunning}
          className="bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Play className="mr-2 h-4 w-4" />
          Trigger Billing Run Now
        </Button>
      </div>

      {resultMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">{resultMessage}</span>
          </div>
          <button
            onClick={() => setResultMessage(null)}
            className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Engine Architecture Information Card */}
      <Card className="bg-slate-900 text-slate-100 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white">
            <Server className="h-4 w-4 text-blue-400" />
            Billing Engine Idempotency &amp; Safeguards
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <h4 className="font-semibold text-white mb-1">Idempotency Keys</h4>
            <p className="text-slate-400">
              Unique constraints on <code>SUB-{`{id}`}-{`{start}`}-{`{end}`}</code> guarantee zero duplicate invoices per subscription cycle.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <h4 className="font-semibold text-white mb-1">Atomic Transactions</h4>
            <p className="text-slate-400">
              Invoice generation, line calculations, nextBillingDate advancement, and audit logs execute in a single Prisma transaction.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <h4 className="font-semibold text-white mb-1">Lifecycle State Checks</h4>
            <p className="text-slate-400">
              Only subscriptions in <code>ACTIVE</code> status are billed. Paused or Closed contracts are strictly bypassed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Log Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Job ID</th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Subscriptions Checked</th>
                <th className="py-3.5 px-4 font-semibold">Invoices Generated</th>
                <th className="py-3.5 px-4 font-semibold">Execution Time</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading job logs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Clock className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    No billing jobs executed yet. Click &quot;Trigger Billing Run Now&quot; to test the engine.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {j.id.slice(0, 10)}...
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(j.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {j.subscriptionsProcessed}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {j.invoicesGenerated}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {j.executionTimeMs ? `${j.executionTimeMs} ms` : "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={j.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500">
                      {j.errorMessage ? (
                        <span className="text-red-500 truncate max-w-xs block ml-auto">
                          {j.errorMessage}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Completed normally</span>
                      )}
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

