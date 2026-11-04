"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getOrdersApi, Order } from "@/lib/api/orders";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export default function AccountDashboardPage() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    getOrdersApi(accessToken, { limit: 5 })
      .then(({ orders }) => setRecentOrders(orders))
      .catch(() => setRecentOrders([]))
      .finally(() => setIsLoadingOrders(false));
  }, [accessToken]);

  return (
    <div className="space-y-8">
      {/* Admin Quick Action Banner */}
      {isAdmin && (
        <div className="p-5 bg-surface border border-border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-medium">
                {user.role}
              </span>
              <h2 className="text-base font-medium">Admin Portal</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Access the administrative dashboard to manage orders, catalog, users, and shipping operations.
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background hover:bg-foreground/85 text-xs font-semibold transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            <span>Go to Admin Dashboard</span>
            <span>→</span>
          </Link>
        </div>
      )}

      {/* Welcome + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/account/orders"
          className="group bg-surface p-6 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-border"
        >
          <div className="text-2xl mb-3">📦</div>
          <h3 className="font-medium mb-1 group-hover:underline underline-offset-2">My Orders</h3>
          <p className="text-sm text-muted-foreground">View and track your orders</p>
        </Link>
        <Link
          href="/account/profile"
          className="group bg-surface p-6 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-border"
        >
          <div className="text-2xl mb-3">👤</div>
          <h3 className="font-medium mb-1 group-hover:underline underline-offset-2">Profile</h3>
          <p className="text-sm text-muted-foreground">Manage your personal details</p>
        </Link>
        <Link
          href="/shop"
          className="group bg-surface p-6 shadow-sm hover:shadow-md transition-shadow border border-transparent hover:border-border"
        >
          <div className="text-2xl mb-3">🛍️</div>
          <h3 className="font-medium mb-1 group-hover:underline underline-offset-2">Shop</h3>
          <p className="text-sm text-muted-foreground">Browse our latest collection</p>
        </Link>
      </div>

      {/* Account Info */}
      {!user?.isEmailVerified && (
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
          Your email address hasn't been verified yet.{" "}
          <Link href="/verify-email" className="underline font-medium">
            Resend verification email
          </Link>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">Recent Orders</h2>
          <Link
            href="/account/orders"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            View all
          </Link>
        </div>

        {isLoadingOrders ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/40 animate-pulse rounded" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
            <Link
              href="/shop"
              className="text-sm font-medium underline underline-offset-4 hover:text-muted-foreground"
            >
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between py-4 px-4 border border-border hover:bg-muted/30 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium group-hover:underline underline-offset-2">
                    {(order as any).orderNumber || order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 border rounded-full ${STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-medium">₹{order.total}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
