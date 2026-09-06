"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getAdminCategoriesApi, createCategoryApi, updateCategoryApi, deleteCategoryApi, AdminCategory,
} from "@/lib/api/admin";

export default function AdminCategoriesPage() {
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState({ name: "", description: "", image: "", isActive: true });
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  const fetchCategories = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const { categories } = await getAdminCategoriesApi(accessToken);
      setCategories(categories);
    } catch { /* empty */ } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, [accessToken]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", image: "", isActive: true });
    setApiError("");
    setModalMode("create");
  };

  const openEdit = (cat: AdminCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || "", image: cat.image || "", isActive: cat.isActive });
    setApiError("");
    setModalMode("edit");
  };

  const closeModal = () => { setModalMode(null); setEditing(null); };

  const handleSave = async () => {
    if (!accessToken) return;
    if (!form.name.trim()) { setApiError("Name is required"); return; }
    setIsSaving(true);
    setApiError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        image: form.image || null,
        isActive: form.isActive,
      };
      if (modalMode === "create") {
        await createCategoryApi(accessToken, payload);
      } else if (editing) {
        await updateCategoryApi(accessToken, editing.id, payload);
      }
      closeModal();
      fetchCategories();
    } catch (e: any) {
      setApiError(e.message || "Failed to save category.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (!accessToken) return;
    if (!confirm(`Delete category "${cat.name}"? Products in this category may be affected.`)) return;
    try {
      await deleteCategoryApi(accessToken, cat.id);
      fetchCategories();
    } catch (e: any) {
      alert(e.message || "Failed to delete.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-white/40 mt-0.5">{categories.length} categories</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
        >
          + New Category
        </button>
      </div>

      <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p>No categories yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-xs uppercase tracking-wider text-white/30">
                <th className="text-left px-6 py-3">Category</th>
                <th className="text-left px-6 py-3 hidden md:table-cell">Slug</th>
                <th className="text-left px-6 py-3 hidden md:table-cell">Status</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-10 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-white/8 rounded flex items-center justify-center text-white/20">🗂</div>
                      )}
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && <p className="text-xs text-white/30 line-clamp-1">{cat.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="font-mono text-xs text-white/40">{cat.slug}</span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`flex items-center gap-1.5 text-xs ${cat.isActive ? "text-green-400" : "text-white/30"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? "bg-green-400" : "bg-white/20"}`} />
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEdit(cat)} className="text-xs text-white/40 hover:text-white transition-colors">Edit</button>
                      <button onClick={() => handleDelete(cat)} className="text-xs text-red-400/60 hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{modalMode === "create" ? "New Category" : "Edit Category"}</h2>
              <button onClick={closeModal} className="text-white/30 hover:text-white text-xl leading-none">✕</button>
            </div>

            {apiError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{apiError}</div>
            )}

            <div>
              <label className="block text-xs text-white/40 mb-1.5">Name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Image URL</label>
              <input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                placeholder="https://..." />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
              <span className="text-sm">Active / Visible</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={isSaving}
                className="flex-1 py-2.5 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50">
                {isSaving ? "Saving..." : modalMode === "create" ? "Create" : "Save Changes"}
              </button>
              <button onClick={closeModal} className="flex-1 py-2.5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
