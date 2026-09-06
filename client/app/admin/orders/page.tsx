"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getAdminOrdersApi, AdminOrder } from "@/lib/api/admin";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PROCESSING: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELIVERED: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const PAYMENT_BADGE: Record<string, string> = {
  PENDING: "text-yellow-400",
  PAID: "text-green-400",
  FAILED: "text-red-400",
  REFUNDED: "text-blue-400",
};

export default function AdminOrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await getAdminOrdersApi(accessToken, {
        page, limit: 15,
        search: search || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
        sortBy,
      });
      setOrders(result.orders);
      setMeta(result.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, search, statusFilter, paymentFilter, sortBy]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-white/40 mt-0.5">{meta.total} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search" placeholder="Search by order #, customer email..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
          <option value="">All Payments</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/8 text-xs uppercase tracking-wider text-white/30">
          <div className="col-span-3">Order</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Payment</div>
          <div className="col-span-1 text-right">Total</div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p>No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors items-center group"
            >
              <div className="md:col-span-3">
                <p className="text-sm font-mono group-hover:text-white/70">{order.orderNumber}</p>
              </div>
              <div className="md:col-span-3">
                {order.user ? (
                  <div>
                    <p className="text-sm">{order.user.firstName} {order.user.lastName}</p>
                    <p className="text-xs text-white/30 truncate">{order.user.email}</p>
                  </div>
                ) : <p className="text-sm text-white/30">Unknown</p>}
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-white/50">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs border rounded-full ${STATUS_BADGE[order.status] || "text-white/40"}`}>
                  {order.status}
                </span>
              </div>
              <div className="md:col-span-1">
                <span className={`text-xs ${PAYMENT_BADGE[order.paymentStatus] || "text-white/40"}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="md:col-span-1 text-right">
                <p className="text-sm font-medium">₹{Number(order.total).toLocaleString()}</p>
              </div>
            </Link>
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
