"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getAdminProductsApi, deleteProductApi, AdminProduct } from "@/lib/api/admin";

export default function AdminProductsPage() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await getAdminProductsApi(accessToken, {
        page, limit: 15, search: search || undefined,
        sortBy, active: activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined,
      });
      setProducts(result.products);
      setMeta(result.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, search, sortBy, activeFilter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!accessToken) return;
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteProductApi(accessToken, id);
      fetchProducts();
    } catch (e: any) {
      alert(e.message || "Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-white/40 mt-0.5">{meta.total} total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 transition-colors self-start sm:self-auto"
        >
          + New Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search by name, SKU, brand..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/8 text-xs uppercase tracking-wider text-white/30">
          <div className="col-span-1">Image</div>
          <div className="col-span-4">Product</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-1">Price</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Featured</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p className="text-lg mb-2">No products found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div>
            {products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors items-center"
              >
                {/* Image */}
                <div className="md:col-span-1">
                  <div className="w-10 h-10 bg-white/8 rounded overflow-hidden flex-shrink-0">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.images[0].alt || product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">—</div>
                    )}
                  </div>
                </div>

                {/* Name + SKU */}
                <div className="md:col-span-4">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-sm font-medium hover:text-white/70 transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-white/30 font-mono">{product.sku}</p>
                </div>

                {/* Category */}
                <div className="md:col-span-2">
                  <span className="text-xs text-white/50">{product.category?.name || "—"}</span>
                </div>

                {/* Price */}
                <div className="md:col-span-1">
                  <span className="text-sm">₹{Number(product.price).toLocaleString()}</span>
                </div>

                {/* Status */}
                <div className="md:col-span-1">
                  <span className={`inline-flex items-center gap-1 text-xs ${product.isActive ? "text-green-400" : "text-white/30"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-green-400" : "bg-white/20"}`} />
                    {product.isActive ? "Active" : "Draft"}
                  </span>
                </div>

                {/* Featured */}
                <div className="md:col-span-1">
                  {product.isFeatured ? (
                    <span className="text-xs text-amber-400">★ Featured</span>
                  ) : (
                    <span className="text-xs text-white/20">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex items-center justify-end gap-3">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-xs text-white/40 hover:text-white transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={deletingId === product.id}
                    className="text-xs text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    {deletingId === product.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
          >
            ← Prev
          </button>
          <span className="text-sm text-white/40 px-3">
            {page} / {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
