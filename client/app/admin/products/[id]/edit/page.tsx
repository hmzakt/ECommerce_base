"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getAdminProductsApi, updateProductApi, getAdminCategoriesApi, AdminProduct, AdminCategory } from "@/lib/api/admin";
import { ProductImageManager } from "@/components/admin/ProductImageManager";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    Promise.all([
      getAdminProductsApi(accessToken, { page: 1, limit: 1, search: id }),
      getAdminCategoriesApi(accessToken),
    ]).then(async ([productsResult, categoriesResult]) => {
      // Fetch specific product by doing a targeted search, or use the id
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"}/admin/products?search=${id}&limit=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      // Actually fetch by id directly from admin products
      const productsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"}/products/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const productData = await productsRes.json();
      const p: AdminProduct = productData.data?.product;
      setProduct(p);
      setCategories(categoriesResult.categories);
      if (p) {
        setForm({
          name: p.name, sku: p.sku, brand: p.brand, price: p.price,
          compareAtPrice: p.compareAtPrice || "", costPrice: p.costPrice || "",
          categoryId: p.categoryId, shortDescription: p.shortDescription || "",
          description: p.description || "", isActive: p.isActive, isFeatured: p.isFeatured,
          images: p.images?.length > 0 ? p.images.map(img => ({ url: img.url, alt: img.alt || "" })) : [{ url: "", alt: "" }],
        });
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [accessToken, id]);

  const handleChange = (field: string, value: any) => {
    setForm((p: any) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const handleImageChange = (index: number, field: string, value: string) => {
    const updated = [...form.images];
    updated[index] = { ...updated[index], [field]: value };
    setForm((p: any) => ({ ...p, images: updated }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name?.trim()) errs.name = "Name is required";
    if (!form.sku?.trim()) errs.sku = "SKU is required";
    if (!form.brand?.trim()) errs.brand = "Brand is required";
    if (!form.price || isNaN(Number(form.price))) errs.price = "Valid price is required";
    if (!form.categoryId) errs.categoryId = "Category is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    if (!accessToken || !id) return;

    setIsSaving(true);
    setApiError("");
    try {
      await updateProductApi(accessToken, id, {
        name: form.name.trim(), sku: form.sku.trim(), brand: form.brand.trim(),
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
        costPrice: form.costPrice ? Number(form.costPrice) : null,
        categoryId: form.categoryId,
        shortDescription: form.shortDescription || null,
        description: form.description || null,
        isActive: form.isActive, isFeatured: form.isFeatured,
        images: form.images.filter((img: any) => img.url.trim()).map((img: any) => ({
          url: img.url.trim(), alt: img.alt.trim() || undefined,
        })),
      });
      router.push(`/admin/products/${id}`);
    } catch (err: any) {
      setApiError(err.message || "Failed to update product.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-xl" />)}
    </div>
  );

  if (!form || !product) return (
    <div className="text-white/40 text-center py-16">Product not found. <Link href="/admin/products" className="underline">Go back</Link></div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/products/${id}`} className="text-white/40 hover:text-white text-sm">← Back</Link>
        <h1 className="text-2xl font-semibold">Edit Product</h1>
      </div>

      {apiError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 text-sm">{apiError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Basic Information</h2>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Product Name *</label>
            <input value={form.name} onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${errors.name ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">SKU *</label>
              <input value={form.sku} onChange={(e) => handleChange("sku", e.target.value)}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${errors.sku ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`} />
              {errors.sku && <p className="text-red-400 text-xs mt-1">{errors.sku}</p>}
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Brand *</label>
              <input value={form.brand} onChange={(e) => handleChange("brand", e.target.value)}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${errors.brand ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`} />
              {errors.brand && <p className="text-red-400 text-xs mt-1">{errors.brand}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Category *</label>
            <select value={form.categoryId} onChange={(e) => handleChange("categoryId", e.target.value)}
              className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${errors.categoryId ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`}>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId}</p>}
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Short Description</label>
            <input value={form.shortDescription} onChange={(e) => handleChange("shortDescription", e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20" />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Full Description</label>
            <textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)}
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 resize-y" />
          </div>
        </section>

        <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            {[["price", "Selling Price *", true], ["compareAtPrice", "Compare-at Price", false], ["costPrice", "Cost Price", false]].map(([field, label, required]) => (
              <div key={field as string}>
                <label className="block text-xs text-white/40 mb-1.5">{label as string} (₹)</label>
                <input type="number" min="0" step="0.01"
                  value={(form as any)[field as string]}
                  onChange={(e) => handleChange(field as string, e.target.value)}
                  className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 ${errors[field as string] ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-white/20"}`} />
                {errors[field as string] && <p className="text-red-400 text-xs mt-1">{errors[field as string]}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Images (Local Upload to Cloudinary & URL Support) */}
        <ProductImageManager
          images={form.images}
          onChange={(images) => setForm((p: any) => ({ ...p, images }))}
          accessToken={accessToken}
        />

        <section className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-medium text-white/70 uppercase tracking-wider">Settings</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => handleChange("isActive", e.target.checked)} className="w-4 h-4 rounded" />
            <div><p className="text-sm">Active / Published</p><p className="text-xs text-white/30">Visible to customers</p></div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => handleChange("isFeatured", e.target.checked)} className="w-4 h-4 rounded" />
            <div><p className="text-sm">Featured Product</p><p className="text-xs text-white/30">Shown on homepage</p></div>
          </label>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={isSaving}
            className="px-6 py-2.5 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50">
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <Link href={`/admin/products/${id}`}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
