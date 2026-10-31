"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Users, Mail, Phone, Building, Globe, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("USA");
  const [createPortalUser, setCreatePortalUser] = useState(true);
  const [portalPassword, setPortalPassword] = useState("Password123!");

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setCustomers(json.data);
      }
    } catch (err) {
      console.error("Error fetching customers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const openAddModal = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompanyName("");
    setBillingAddress("");
    setCity("");
    setCountry("USA");
    setCreatePortalUser(true);
    setPortalPassword("Password123!");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      name,
      email,
      phone,
      companyName,
      billingAddress,
      city,
      country,
      createPortalUser,
      portalPassword,
    };

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to create customer");
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      fetchCustomers();
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
            Customer Accounts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your subscribers, contact profiles, billing addresses, and self-service portal access.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers by name, company, email, or customer ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer ID</th>
                  <th className="py-3.5 px-4 font-semibold">Name &amp; Company</th>
                  <th className="py-3.5 px-4 font-semibold">Email &amp; Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Location</th>
                  <th className="py-3.5 px-4 font-semibold">Portal Access</th>
                  <th className="py-3.5 px-4 font-semibold">Subscriptions</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Users className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      No customers found. Click &quot;Add Customer&quot; to register one.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-blue-600">
                        {c.customerNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {c.name}
                        {c.companyName && (
                          <span className="block text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="h-3 w-3" />
                            {c.companyName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        <span className="block">{c.email}</span>
                        {c.phone && <span className="block text-xs text-slate-400">{c.phone}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {c.city ? `${c.city}, ` : ""}
                        {c.country || "N/A"}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.user ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <KeyRound className="h-3 w-3" />
                            Active Login
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No portal login</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {c._count?.subscriptions || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={c.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Customer Profile"
        description="Register a new subscriber account and optionally generate customer portal credentials."
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Customer Full Name"
              placeholder="e.g. Alex Rivera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Company Name (Optional)"
              placeholder="TechStart Innovations"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="alex@techstart.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Phone Number"
              placeholder="+1 (555) 234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                label="Billing Address"
                placeholder="742 Evergreen Terrace"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
              />
            </div>
            <Input
              label="City"
              placeholder="Austin"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Customer Portal Credentials option */}
          <div className="p-3.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="createPortalUser"
                checked={createPortalUser}
                onChange={(e) => setCreatePortalUser(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label
                htmlFor="createPortalUser"
                className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                Create Customer Self-Service Portal Login
              </label>
            </div>
            {createPortalUser && (
              <Input
                label="Initial Portal Password"
                type="password"
                value={portalPassword}
                onChange={(e) => setPortalPassword(e.target.value)}
                required
                className="bg-white dark:bg-slate-900"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

