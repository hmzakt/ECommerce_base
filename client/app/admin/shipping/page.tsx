"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getAdminOrdersApi, AdminOrder } from "@/lib/api/admin";

export default function AdminShippingPage() {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    // Fetch orders that need shipping attention (shipped / processing)
    Promise.all([
      getAdminOrdersApi(accessToken, { status: "PROCESSING", limit: 50 }),
      getAdminOrdersApi(accessToken, { status: "SHIPPED", limit: 50 }),
    ])
      .then(([processing, shipped]) => {
        setOrders([...processing.orders, ...shipped.orders]);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shipping Management</h1>
        <p className="text-sm text-white/40 mt-0.5">Orders requiring shipping action</p>
      </div>

      <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/8 text-xs uppercase tracking-wider text-white/30">
          <div className="col-span-3">Order</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p>No orders pending shipping actions.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-white/6 last:border-b-0 items-center">
              <div className="md:col-span-3">
                <p className="text-sm font-mono">{order.orderNumber}</p>
              </div>
              <div className="md:col-span-3">
                {order.user ? (
                  <p className="text-sm truncate">{order.user.firstName} {order.user.lastName}</p>
                ) : <p className="text-sm text-white/30">Unknown</p>}
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-white/50">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="md:col-span-2">
                <span className={`text-xs px-2 py-1 rounded-full border ${order.status === "SHIPPED" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"}`}>
                  {order.status}
                </span>
              </div>
              <div className="md:col-span-2 text-right">
                <Link href={`/admin/orders/${order.id}`}
                  className="text-xs px-3 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg transition-colors">
                  Manage →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
