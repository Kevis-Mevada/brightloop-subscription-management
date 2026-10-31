"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit2, Archive, CheckCircle, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState("SERVICE");
  const [salesPrice, setSalesPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [variants, setVariants] = useState<{ name: string; sku: string; priceAdjustment: number }[]>([]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data);
      }
    } catch (err) {
      console.error("Error fetching products", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setCode("");
    setDescription("");
    setProductType("SERVICE");
    setSalesPrice("");
    setCostPrice("");
    setVariants([
      { name: "Standard Edition", sku: "", priceAdjustment: 0 },
      { name: "Odoo Brand Integration", sku: "", priceAdjustment: 560 }, // Default PDF spec example
    ]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setCode(p.code);
    setDescription(p.description || "");
    setProductType(p.productType);
    setSalesPrice(p.salesPrice.toString());
    setCostPrice(p.costPrice ? p.costPrice.toString() : "0");
    setVariants(
      p.variants?.map((v: any) => ({
        name: v.name,
        sku: v.sku || "",
        priceAdjustment: Number(v.priceAdjustment),
      })) || []
    );
    setError(null);
    setIsModalOpen(true);
  };

  const addVariantRow = () => {
    setVariants([...variants, { name: "", sku: "", priceAdjustment: 0 }]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantRow = (index: number, field: string, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      name,
      code,
      description,
      productType,
      salesPrice: parseFloat(salesPrice),
      costPrice: parseFloat(costPrice || "0"),
      variants,
    };

    try {
      const url = "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const body = editingProduct ? { ...payload, id: editingProduct.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to save product");
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      fetchProducts();
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
            Products &amp; Services
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your product catalog, service tiers, and brand variant price adjustments.
          </p>
        </div>
        <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-500 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name, code, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Product Name</th>
                  <th className="py-3.5 px-4 font-semibold">Code</th>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Sales Price</th>
                  <th className="py-3.5 px-4 font-semibold">Cost Price</th>
                  <th className="py-3.5 px-4 font-semibold">Variants</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Loading products catalog...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Package className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                      No products found. Click &quot;Add Product&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {p.name}
                        {p.description && (
                          <span className="block text-xs text-slate-400 truncate max-w-xs">
                            {p.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {p.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={p.productType} />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(p.salesPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatCurrency(p.costPrice || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.variants && p.variants.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.variants.map((v: any) => (
                              <span
                                key={v.id || v.name}
                                className="inline-flex items-center text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                              >
                                {v.name}{" "}
                                {Number(v.priceAdjustment) > 0 &&
                                  `(+${formatCurrency(v.priceAdjustment)})`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={p.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(p)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        description="Configure product details, base pricing, and optional price-adjusting variants."
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              placeholder="e.g. Cloud ERP Core"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Product Code"
              placeholder="e.g. PROD-ERP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="SERVICE">Service</option>
                <option value="PHYSICAL">Physical</option>
                <option value="DIGITAL">Digital</option>
              </select>
            </div>
            <Input
              label="Sales Price ($)"
              type="number"
              step="0.01"
              placeholder="1200.00"
              value={salesPrice}
              onChange={(e) => setSalesPrice(e.target.value)}
              required
            />
            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              placeholder="300.00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
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
              placeholder="Brief summary of what this product or service provides..."
              className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Variants Builder */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Product Variants
                </h4>
                <p className="text-xs text-slate-500">
                  e.g., Selecting &quot;Odoo Brand Variant&quot; adds +$560 to base price
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={addVariantRow}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Variant Name (e.g. Odoo Brand)"
                    value={v.name}
                    onChange={(e) => updateVariantRow(i, "name", e.target.value)}
                    className="flex-1 h-9 rounded border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    required
                  />
                  <div className="w-36 flex items-center gap-1">
                    <span className="text-xs text-slate-400">+$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="560.00"
                      value={v.priceAdjustment}
                      onChange={(e) =>
                        updateVariantRow(i, "priceAdjustment", parseFloat(e.target.value || "0"))
                      }
                      className="w-full h-9 rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariantRow(i)}
                    className="h-9 w-9 p-0 text-red-500"
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

