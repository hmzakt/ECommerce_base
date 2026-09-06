"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import {
  getDashboardSummaryApi,
  getRevenueTrendApi,
  getOrderBreakdownApi,
  DashboardSummary,
  RevenueTrend,
  OrderBreakdown,
} from "@/lib/api/admin";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400",
  CONFIRMED: "text-blue-400",
  PROCESSING: "text-indigo-400",
  SHIPPED: "text-purple-400",
  DELIVERED: "text-green-400",
  CANCELLED: "text-red-400",
};

const PAYMENT_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400",
  PAID: "text-green-400",
  FAILED: "text-red-400",
  REFUNDED: "text-blue-400",
};

function KpiCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: string }) {
  return (
    <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-1">
      <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
      {trend && <p className="text-xs text-green-400">{trend}</p>}
    </div>
  );
}

function RevenueChart({ trend }: { trend: RevenueTrend["trend"] }) {
  if (!trend || trend.length === 0) {
    return <div className="text-white/30 text-sm text-center py-8">No revenue data for last 30 days</div>;
  }

  const max = Math.max(...trend.map((d) => Number(d.revenue)));

  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {trend.map((point) => {
        const pct = max > 0 ? (Number(point.revenue) / max) * 100 : 0;
        return (
          <div
            key={point.date}
            className="flex-1 group relative flex flex-col justify-end"
            title={`${point.date}: ₹${Number(point.revenue).toFixed(0)}`}
          >
            <div
              className="bg-white/20 group-hover:bg-white/50 transition-colors rounded-t"
              style={{ height: `${Math.max(pct, 2)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<RevenueTrend | null>(null);
  const [breakdown, setBreakdown] = useState<OrderBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    Promise.all([
      getDashboardSummaryApi(accessToken),
      getRevenueTrendApi(accessToken),
      getOrderBreakdownApi(accessToken),
    ])
      .then(([s, t, b]) => {
        setSummary(s);
        setTrend(t);
        setBreakdown(b);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-xl" />
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!summary) return <div className="text-white/40">Failed to load dashboard data.</div>;

  const maxOrderCount = Math.max(...(breakdown?.breakdown.map((b) => b.count) ?? [1]));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-white/40 mt-0.5">Live overview of your store</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={`₹${Number(summary.revenue.allTime).toLocaleString()}`}
          sub={`₹${Number(summary.revenue.thisMonth).toLocaleString()} this month`}
          trend={`₹${Number(summary.revenue.today).toLocaleString()} today`}
        />
        <KpiCard
          label="Total Orders"
          value={String(summary.orders.total)}
          sub={`${summary.orders.pending} pending`}
        />
        <KpiCard
          label="Customers"
          value={String(summary.users.total)}
        />
        <KpiCard
          label="Active Products"
          value={String(summary.products.total)}
        />
      </div>

      {/* Revenue Chart + Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium">Revenue (Last 30 Days)</h2>
            <span className="text-xs text-white/30">Daily</span>
          </div>
          {trend && <RevenueChart trend={trend.trend} />}
          <div className="flex items-center justify-between mt-3 text-xs text-white/30">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="text-sm font-medium mb-6">Order Status</h2>
          <div className="space-y-3">
            {breakdown?.breakdown.map((item) => (
              <div key={item.status}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={STATUS_COLORS[item.status] || "text-white/60"}>{item.status}</span>
                  <span className="text-white/40">{item.count}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/25 rounded-full"
                    style={{ width: maxOrderCount > 0 ? `${(item.count / maxOrderCount) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium">Top Products</h2>
            <Link href="/admin/products" className="text-xs text-white/40 hover:text-white">
              View all →
            </Link>
          </div>
          {summary.topProducts.length === 0 ? (
            <p className="text-white/30 text-sm">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-xs text-white/20 w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{p.productName}</p>
                    <p className="text-xs text-white/30 font-mono">{p.productSku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">₹{Number(p.totalRevenue).toLocaleString()}</p>
                    <p className="text-xs text-white/30">{p.totalQuantitySold} sold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-white/40 hover:text-white">
              View all →
            </Link>
          </div>
          {summary.recentOrders.length === 0 ? (
            <p className="text-white/30 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono group-hover:text-white/80 truncate">{order.orderNumber}</p>
                    <p className="text-xs text-white/30 truncate">{order.customer}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm">₹{Number(order.total).toLocaleString()}</p>
                    <p className={`text-xs ${STATUS_COLORS[order.status] || "text-white/40"}`}>
                      {order.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
