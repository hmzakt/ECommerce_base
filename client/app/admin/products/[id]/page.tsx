"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { updateProductApi, AdminProduct } from "@/lib/api/admin";
import { API_BASE_URL } from "@/lib/api/client";

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const fetchProduct = async () => {
    if (!accessToken || !id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const data = await res.json();
      setProduct(data.data?.product);
    } catch { /* empty */ } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [accessToken, id]);

  const toggleField = async (field: "isActive" | "isFeatured") => {
    if (!accessToken || !product || !id) return;
    setIsToggling(true);
    try {
      const { product: updated } = await updateProductApi(accessToken, id, { [field]: !product[field] });
      setProduct(updated);
    } catch (e: any) {
      alert(e.message || "Failed to update.");
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-white/5 rounded w-1/3" />
        <div className="h-64 bg-white/5 rounded-xl" />
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 text-white/40">
        Product not found. <Link href="/admin/products" className="underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="text-white/40 hover:text-white text-sm">← Products</Link>
          <h1 className="text-2xl font-semibold truncate">{product.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/products/${product.slug}`} target="_blank"
            className="px-3 py-2 text-xs text-white/40 hover:text-white border border-white/10 rounded-lg"
          >
            View in Store ↗
          </Link>
          <Link
            href={`/admin/products/${product.id}/edit`}
            className="px-4 py-2 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden aspect-square">
            {product.images?.[0]?.url ? (
              <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">No image</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {product.images.slice(1).map((img) => (
                <div key={img.id} className="aspect-square bg-white/5 rounded overflow-hidden">
                  <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Meta */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/30 mb-1">SKU</p>
              <p className="text-sm font-mono">{product.sku}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Brand</p>
              <p className="text-sm">{product.brand}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Category</p>
              <p className="text-sm">{product.category?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-white/30 mb-1">Slug</p>
              <p className="text-sm font-mono text-white/50 truncate">{product.slug}</p>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-white/30 mb-1">Selling Price</p>
              <p className="text-xl font-semibold">₹{Number(product.price).toLocaleString()}</p>
            </div>
            {product.compareAtPrice && (
              <div>
                <p className="text-xs text-white/30 mb-1">Compare-at</p>
                <p className="text-sm line-through text-white/40">₹{Number(product.compareAtPrice).toLocaleString()}</p>
              </div>
            )}
            {product.costPrice && (
              <div>
                <p className="text-xs text-white/30 mb-1">Cost Price</p>
                <p className="text-sm text-white/60">₹{Number(product.costPrice).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Status Toggles */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">Settings</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Published / Active</p>
                <p className="text-xs text-white/30">Visible to customers in the store</p>
              </div>
              <button
                onClick={() => toggleField("isActive")} disabled={isToggling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.isActive ? "bg-green-500" : "bg-white/10"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Featured</p>
                <p className="text-xs text-white/30">Shown on homepage</p>
              </div>
              <button
                onClick={() => toggleField("isFeatured")} disabled={isToggling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${product.isFeatured ? "bg-amber-500" : "bg-white/10"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.isFeatured ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* Description */}
          {(product.shortDescription || product.description) && (
            <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">Description</h3>
              {product.shortDescription && <p className="text-sm text-white/60">{product.shortDescription}</p>}
              {product.description && <p className="text-sm text-white/40 whitespace-pre-wrap">{product.description}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
