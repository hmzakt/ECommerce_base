"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getAdminUsersApi, AdminUser } from "@/lib/api/admin";

const ROLE_BADGE: Record<string, string> = {
  CUSTOMER: "text-white/50 bg-white/5",
  ADMIN: "text-blue-400 bg-blue-500/10",
  SUPER_ADMIN: "text-purple-400 bg-purple-500/10",
};

export default function AdminUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await getAdminUsersApi(accessToken, { page, limit: 20, search: search || undefined });
      setUsers(result.users);
      setMeta(result.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-white/40 mt-0.5">{meta.total} registered users</p>
        </div>
      </div>

      {/* Search */}
      <input
        type="search" placeholder="Search by name or email..."
        value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
      />

      {/* Table */}
      <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/8 text-xs uppercase tracking-wider text-white/30">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Email Verified</div>
          <div className="col-span-1">Joined</div>
          <div className="col-span-1"></div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-white/30">No users found</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors items-center">
              <div className="md:col-span-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-white/30 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_BADGE[user.role] || "text-white/40"}`}>
                  {user.role}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className={`flex items-center gap-1.5 text-xs ${user.isActive ? "text-green-400" : "text-red-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-400" : "bg-red-400"}`} />
                  {user.isActive ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className={`text-xs ${user.isEmailVerified ? "text-green-400" : "text-white/30"}`}>
                  {user.isEmailVerified ? "✓ Verified" : "Unverified"}
                </span>
              </div>
              <div className="md:col-span-1">
                <p className="text-xs text-white/30">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="md:col-span-1 text-right">
                <Link href={`/admin/users/${user.id}`} className="text-xs text-white/30 hover:text-white underline">View</Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none">← Prev</button>
          <span className="text-sm text-white/40 px-3">{page} / {meta.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
            className="px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none">Next →</button>
        </div>
      )}
    </div>
  );
}
