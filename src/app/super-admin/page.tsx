"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Users,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default function SuperAdminPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      const res = await fetch("/api/super-admin");
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleSuspend = async (orgId: string, currentSuspended: boolean) => {
    setActionLoading(orgId);
    try {
      const res = await fetch("/api/super-admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          isSuspended: !currentSuspended,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchAdminData();
      } else {
        alert(json.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalOrganizations: 0,
    activeOrganizations: 0,
    suspendedOrganizations: 0,
    totalPlatformUsers: 0,
  };

  const orgs = data?.organizations || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Platform-Wide Multi-Tenant Oversight
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor all registered customer organizations, user distribution, and manage tenant suspension states.
        </p>
      </div>

      {/* Platform Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrganizations}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Active Tenants</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats.activeOrganizations}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Suspended Tenants</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{stats.suspendedOrganizations}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Total Platform Users</CardTitle>
            <Users className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-300">{stats.totalPlatformUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold text-white">Registered Organizations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Organization Name</th>
                <th className="py-3.5 px-4 font-semibold">Tenant Slug</th>
                <th className="py-3.5 px-4 font-semibold">Currency</th>
                <th className="py-3.5 px-4 font-semibold">Users</th>
                <th className="py-3.5 px-4 font-semibold">Customers</th>
                <th className="py-3.5 px-4 font-semibold">Subscriptions</th>
                <th className="py-3.5 px-4 font-semibold">Created</th>
                <th className="py-3.5 px-4 font-semibold text-right">Tenant Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {orgs.map((org: any) => (
                <tr key={org.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {org.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                    {org.slug}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-amber-300">
                    {org.currency}
                  </td>
                  <td className="py-3.5 px-4">{org._count?.users || 0}</td>
                  <td className="py-3.5 px-4">{org._count?.customers || 0}</td>
                  <td className="py-3.5 px-4 font-semibold text-blue-400">
                    {org._count?.subscriptions || 0}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">
                    {formatDate(org.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleSuspend(org.id, org.isSuspended)}
                      isLoading={actionLoading === org.id}
                      className={
                        org.isSuspended
                          ? "text-emerald-400 border-emerald-900/60 hover:bg-emerald-950/40 text-xs h-7"
                          : "text-rose-400 border-rose-900/60 hover:bg-rose-950/40 text-xs h-7"
                      }
                    >
                      {org.isSuspended ? "Activate Tenant" : "Suspend Tenant"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

