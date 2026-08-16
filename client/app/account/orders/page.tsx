"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getOrdersApi, Order, OrderListMeta } from "@/lib/api/orders";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600",
  PAID: "text-green-600",
  FAILED: "text-red-600",
  REFUNDED: "text-blue-600",
};

export default function OrdersPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<OrderListMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getOrdersApi(accessToken, {
      page,
      limit: 10,
      ...(statusFilter ? { status: statusFilter } : {}),
    })
      .then(({ orders, meta }) => {
        setOrders(orders);
        setMeta(meta);
      })
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, [accessToken, page, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-medium">My Orders</h2>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-border px-3 py-2 text-sm bg-surface focus:outline-none focus:ring-1 focus:ring-foreground"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-surface shadow-sm">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-muted-foreground text-lg mb-2">No orders found</p>
            <p className="text-muted-foreground text-sm mb-6">
              {statusFilter ? "Try changing the status filter." : "You haven't placed any orders yet."}
            </p>
            <Link href="/shop" className="text-sm font-medium underline underline-offset-4">
              Start shopping →
            </Link>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
              <div className="col-span-3">Order</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Payment</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>

            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-5 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <div className="md:col-span-3">
                  <p className="text-sm font-medium font-mono">
                    {(order as any).orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className={`text-xs px-2.5 py-1 border rounded-full inline-block ${STATUS_COLORS[order.status] || "bg-muted"}`}>
                    {order.status}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className={`text-sm font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus] || "text-muted-foreground"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="md:col-span-2 md:text-right">
                  <p className="text-sm font-medium">₹{order.total}</p>
                </div>
                <div className="md:col-span-1 md:text-right">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-border hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="px-4 py-2 text-sm border border-border hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
