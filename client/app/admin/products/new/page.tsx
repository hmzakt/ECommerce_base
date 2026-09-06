"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { createProductApi, getAdminCategoriesApi, AdminCategory } from "@/lib/api/admin";

const EMPTY_FORM = {
  name: "", sku: "", brand: "", price: "", compareAtPrice: "", costPrice: "",
  categoryId: "", shortDescription: "", description: "", isActive: true, isFeatured: false,
  images: [{ url: "", alt: "" }],
};

export default function NewProductPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    getAdminCategoriesApi(accessToken).then(({ categories }) => setCategories(categories)).catch(console.error);
  }, [accessToken]);

  const handleChange = (field: string, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleImageChange = (index: number, field: string, value: string) => {
    const updated = [...form.images];
    updated[index] = { ...updated[index], [field]: value };
    setForm((p) => ({ ...p, images: updated }));
  };

  const addImage = () => setForm((p) => ({ ...p, images: [...p.images, { url: "", alt: "" }] }));
  const removeImage = (index: number) => setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.sku.trim()) errs.sku = "SKU is required";
    if (!form.brand.trim()) errs.brand = "Brand is required";
    if (!form.price || isNaN(Number(form.price))) errs.price = "Valid price is required";
    if (!form.categoryId) errs.categoryId = "Category is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!accessToken) return;

    setIsSaving(true);
    setApiError("");

    try {
      const { product } = await createProductApi(accessToken, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        brand: form.brand.trim(),
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        categoryId: form.categoryId,
        shortDescription: form.shortDescription || null,
        description: form.description || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: form.images.filter((img) => img.url.trim()).map((img) => ({
          url: img.url.trim(),
          alt: img.alt.trim() || undefined,
        })),
      });
      router.push(`/admin/products/${product.id}`);
    } catch (err: any) {
      setApiError(err.message || "Failed to create product.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/40 hover:text-white text-sm">← Back</button>
        <h1 className="text-2xl font-semibold">New Product</h1>
      </div>

      {apiError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{apiError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Basic Information</h2>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Product Name *</label>
            <input
              value={form.name} onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 ${errors.name ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`}
              placeholder="e.g. Linen Table Lamp"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">SKU *</label>
              <input
                value={form.sku} onChange={(e) => handleChange("sku", e.target.value)}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 ${errors.sku ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`}
                placeholder="MSN-LAMP-001"
              />
              {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Brand *</label>
              <input
                value={form.brand} onChange={(e) => handleChange("brand", e.target.value)}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 ${errors.brand ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`}
                placeholder="Maison Originals"
              />
              {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Category *</label>
            <select
              value={form.categoryId} onChange={(e) => handleChange("categoryId", e.target.value)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${errors.categoryId ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId}</p>}
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Short Description</label>
            <input
              value={form.shortDescription} onChange={(e) => handleChange("shortDescription", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              placeholder="One-line summary for product listings"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Full Description</label>
            <textarea
              value={form.description} onChange={(e) => handleChange("description", e.target.value)}
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 resize-y"
              placeholder="Detailed product description..."
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Selling Price (₹) *</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price} onChange={(e) => handleChange("price", e.target.value)}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${errors.price ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`}
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Compare-at Price (₹)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.compareAtPrice} onChange={(e) => handleChange("compareAtPrice", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Cost Price (₹)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.costPrice} onChange={(e) => handleChange("costPrice", e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="0.00"
              />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Images (URLs)</h2>
          {form.images.map((img, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <input
                  value={img.url} onChange={(e) => handleImageChange(index, "url", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="https://example.com/image.jpg"
                />
                <input
                  value={img.alt} onChange={(e) => handleImageChange(index, "alt", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="Alt text (optional)"
                />
              </div>
              {form.images.length > 1 && (
                <button type="button" onClick={() => removeImage(index)} className="text-red-400/60 hover:text-red-400 mt-2">✕</button>
              )}
            </div>
          ))}
          <button
            type="button" onClick={addImage}
            className="text-sm text-white/40 hover:text-white border border-white/10 rounded-lg px-4 py-2 hover:bg-white/5 transition-colors"
          >
            + Add Image
          </button>
        </section>

        {/* Status */}
        <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Settings</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox" checked={form.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="text-sm">Active / Published</p>
              <p className="text-xs text-white/30">Visible to customers in the store</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox" checked={form.isFeatured}
              onChange={(e) => handleChange("isFeatured", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="text-sm">Featured Product</p>
              <p className="text-xs text-white/30">Highlighted on the homepage</p>
            </div>
          </label>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={isSaving}
            className="px-6 py-2.5 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Creating..." : "Create Product"}
          </button>
          <button
            type="button" onClick={() => router.back()}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
