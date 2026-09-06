"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getAdminUserByIdApi, updateUserRoleApi, updateUserStatusApi, AdminUser } from "@/lib/api/admin";
import { getOrdersApi, Order } from "@/lib/api/orders";

const ROLES = ["CUSTOMER", "ADMIN", "SUPER_ADMIN"];

const ROLE_BADGE: Record<string, string> = {
  CUSTOMER: "text-white/50 bg-white/5",
  ADMIN: "text-blue-400 bg-blue-500/10",
  SUPER_ADMIN: "text-purple-400 bg-purple-500/10",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user: currentUser } = useAuth();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUser = async () => {
    if (!accessToken || !id) return;
    setIsLoading(true);
    try {
      const { user: u } = await getAdminUserByIdApi(accessToken, id);
      setUser(u);
      setNewRole(u.role);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [accessToken, id]);

  const handleRoleUpdate = async () => {
    if (!accessToken || !user || newRole === user.role) return;
    setIsUpdating(true);
    setError(""); setSuccessMsg("");
    try {
      const { user: updated } = await updateUserRoleApi(accessToken, user.id, newRole);
      setUser(updated);
      setNewRole(updated.role);
      setSuccessMsg("Role updated successfully.");
    } catch (e: any) {
      setError(e.message || "Failed to update role.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!accessToken || !user) return;
    setIsUpdating(true);
    setError(""); setSuccessMsg("");
    try {
      const { user: updated } = await updateUserStatusApi(accessToken, user.id, !user.isActive);
      setUser(updated);
      setSuccessMsg(`User ${updated.isActive ? "activated" : "deactivated"} successfully.`);
    } catch (e: any) {
      setError(e.message || "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-xl" />)}
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-16 text-white/40">User not found. <Link href="/admin/users" className="underline">Go back</Link></div>;
  }

  const isSelf = currentUser?.id === user.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-white/40 hover:text-white text-sm">← Users</Link>
        <h1 className="text-2xl font-semibold">{user.firstName} {user.lastName}</h1>
      </div>

      {(error || successMsg) && (
        <div className={`rounded-lg p-4 text-sm ${error ? "bg-red-500/10 border border-red-500/30 text-red-400" : "bg-green-500/10 border border-green-500/30 text-green-400"}`}>
          {error || successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl mx-auto">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <p className="font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-white/40">{user.email}</p>
              {user.phone && <p className="text-sm text-white/30">{user.phone}</p>}
            </div>
            <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>
              {user.role}
            </span>
          </div>

          <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Account Status</span>
              <span className={user.isActive ? "text-green-400" : "text-red-400"}>{user.isActive ? "Active" : "Disabled"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Email Verified</span>
              <span className={user.isEmailVerified ? "text-green-400" : "text-white/30"}>{user.isEmailVerified ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Joined</span>
              <span className="text-white/60">{new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
          </div>
        </div>

        {/* Right: Management */}
        <div className="lg:col-span-2 space-y-5">
          {/* Role Management */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-white/30">Role Management</h2>
            {isSelf && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg p-3">
                You cannot change your own role.
              </div>
            )}
            <div className="flex gap-3">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                disabled={isSelf || currentUser?.role !== "SUPER_ADMIN"}
                className="flex-1 bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-40"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                onClick={handleRoleUpdate}
                disabled={isUpdating || isSelf || newRole === user.role || currentUser?.role !== "SUPER_ADMIN"}
                className="px-4 py-2 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-40"
              >
                {isUpdating ? "..." : "Update Role"}
              </button>
            </div>
            {currentUser?.role !== "SUPER_ADMIN" && (
              <p className="text-xs text-white/30">Only SUPER_ADMIN can change user roles.</p>
            )}
          </div>

          {/* Status Management */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-white/30">Account Status</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{user.isActive ? "Account is Active" : "Account is Disabled"}</p>
                <p className="text-xs text-white/30 mt-0.5">
                  {user.isActive ? "User can log in and make purchases." : "User is blocked from accessing the store."}
                </p>
              </div>
              <button
                onClick={handleStatusToggle}
                disabled={isUpdating || isSelf}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-40 ${
                  user.isActive
                    ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                    : "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                }`}
              >
                {user.isActive ? "Disable Account" : "Enable Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
