"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getAdminOrderByIdApi, updateOrderStatusAdminApi, updateShippingAdminApi, AdminOrder } from "@/lib/api/admin";
import { getShippingDetailsApi } from "@/lib/api/orders";
import { API_BASE_URL } from "@/lib/api/client";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const SHIPPING_STATUSES = ["PENDING", "PACKED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURNED"];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PROCESSING: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  SHIPPED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  DELIVERED: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const ORDER_TIMELINE = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [shipping, setShipping] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusForm, setStatusForm] = useState({ status: "", paymentStatus: "" });
  const [shippingForm, setShippingForm] = useState({ trackingNumber: "", shippingProvider: "", estimatedDelivery: "", status: "" });
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [shippingId, setShippingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!accessToken || !id) return;
    setIsLoading(true);
    try {
      const [{ order: o }, shippingData] = await Promise.all([
        getAdminOrderByIdApi(accessToken, id),
        getShippingDetailsApi(accessToken, id).catch(() => null),
      ]);
      setOrder(o);
      setStatusForm({ status: o.status, paymentStatus: o.paymentStatus });
      if (shippingData?.shipping) {
        const s = shippingData.shipping;
        setShipping(s);
        setShippingId(s.id || null);
        setShippingForm({
          trackingNumber: s.trackingNumber || "",
          shippingProvider: s.shippingProvider || "",
          estimatedDelivery: s.estimatedDelivery ? s.estimatedDelivery.slice(0, 10) : "",
          status: s.status || "",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [accessToken, id]);

  const handleUpdateStatus = async () => {
    if (!accessToken || !id) return;
    setIsSavingStatus(true);
    setStatusError("");
    try {
      const { order: updated } = await updateOrderStatusAdminApi(accessToken, id, {
        status: statusForm.status || undefined,
        paymentStatus: statusForm.paymentStatus || undefined,
      });
      setOrder(updated);
    } catch (e: any) {
      setStatusError(e.message || "Failed to update status.");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleUpdateShipping = async () => {
    if (!accessToken || !shippingId) return;
    setIsSavingShipping(true);
    setShippingError("");
    try {
      await updateShippingAdminApi(accessToken, shippingId, {
        trackingNumber: shippingForm.trackingNumber || null,
        shippingProvider: shippingForm.shippingProvider || null,
        estimatedDelivery: shippingForm.estimatedDelivery ? new Date(shippingForm.estimatedDelivery).toISOString() : null,
        status: shippingForm.status || undefined,
      });
      await fetchData();
    } catch (e: any) {
      setShippingError(e.message || "Failed to update shipping.");
    } finally {
      setIsSavingShipping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-xl" />)}
      </div>
    );
  }

  if (!order) return (
    <div className="text-center py-16 text-white/40">Order not found. <Link href="/admin/orders" className="underline">Go back</Link></div>
  );

  const currentStep = ORDER_TIMELINE.indexOf(order.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm text-white/40 hover:text-white block mb-1">← Orders</Link>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 text-xs border rounded-full ${STATUS_BADGE[order.status] || "text-white/40"}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white/5 border border-white/8 rounded-xl p-6">
        <h2 className="text-xs uppercase tracking-wider text-white/30 mb-5">Order Timeline</h2>
        {order.status === "CANCELLED" ? (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <span>✕</span> This order has been cancelled.
          </div>
        ) : (
          <div className="flex items-center">
            {ORDER_TIMELINE.map((step, i) => {
              const done = i <= currentStep;
              const current = i === currentStep;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs transition-all
                      ${done ? "border-white bg-white text-[#0f0f0f]" : "border-white/15 text-white/20"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center ${current ? "text-white" : "text-white/30"}`}>
                      {step.charAt(0) + step.slice(1).toLowerCase()}
                    </p>
                  </div>
                  {i < ORDER_TIMELINE.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 ${i < currentStep ? "bg-white" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6">
            <h2 className="text-xs uppercase tracking-wider text-white/30 mb-4">Items</h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-2 border-b border-white/6 last:border-b-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-white/30 font-mono">{item.productSku}</p>
                    <p className="text-xs text-white/30">Qty: {item.quantity} × ₹{item.unitPrice}</p>
                  </div>
                  <p className="text-sm font-medium">₹{item.lineTotal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
            <h2 className="text-xs uppercase tracking-wider text-white/30">Update Order Status</h2>
            {statusError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{statusError}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Order Status</label>
                <select value={statusForm.status} onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Payment Status</label>
                <select value={statusForm.paymentStatus} onChange={(e) => setStatusForm((p) => ({ ...p, paymentStatus: e.target.value }))}
                  className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleUpdateStatus} disabled={isSavingStatus}
              className="px-5 py-2 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50">
              {isSavingStatus ? "Saving..." : "Update Status"}
            </button>
          </div>

          {/* Shipping Update */}
          {shippingId && (
            <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
              <h2 className="text-xs uppercase tracking-wider text-white/30">Shipping & Tracking</h2>
              {shippingError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{shippingError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Tracking Number</label>
                  <input value={shippingForm.trackingNumber} onChange={(e) => setShippingForm((p) => ({ ...p, trackingNumber: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="e.g. DTDC1234567" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Shipping Provider</label>
                  <input value={shippingForm.shippingProvider} onChange={(e) => setShippingForm((p) => ({ ...p, shippingProvider: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="e.g. DTDC, Blue Dart" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Estimated Delivery</label>
                  <input type="date" value={shippingForm.estimatedDelivery} onChange={(e) => setShippingForm((p) => ({ ...p, estimatedDelivery: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Shipping Status</label>
                  <select value={shippingForm.status} onChange={(e) => setShippingForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20">
                    <option value="">Select</option>
                    {SHIPPING_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleUpdateShipping} disabled={isSavingShipping}
                className="px-5 py-2 bg-white text-[#0f0f0f] rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50">
                {isSavingShipping ? "Saving..." : "Update Tracking"}
              </button>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-white/30">Customer</h2>
            {order.user ? (
              <div>
                <p className="text-sm font-medium">{order.user.firstName} {order.user.lastName}</p>
                <p className="text-xs text-white/40">{order.user.email}</p>
                <Link href={`/admin/users/${order.user.id}`} className="text-xs text-white/30 hover:text-white underline mt-2 block">View Profile →</Link>
              </div>
            ) : <p className="text-sm text-white/30">Unknown customer</p>}
          </div>

          {/* Shipping Address */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-white/30">Shipping Address</h2>
            {order.shippingAddress ? (
              <address className="text-sm not-italic text-white/60 space-y-0.5">
                <p className="text-white font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.streetAddress}</p>
                {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-1">{order.shippingAddress.phone}</p>
              </address>
            ) : <p className="text-sm text-white/30">No address</p>}
          </div>

          {/* Payment Summary */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-5 space-y-2.5">
            <h2 className="text-xs uppercase tracking-wider text-white/30">Summary</h2>
            {[["Subtotal", `₹${order.subtotal}`], ["Shipping", `₹${order.shippingCost || "0.00"}`], ["Tax", `₹${order.tax || "0.00"}`]].map(([l, v]) => (
              <div key={l} className="flex justify-between text-sm">
                <span className="text-white/40">{l}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-white/8">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span className="text-white/30">Payment</span>
              <span className={`${order.paymentStatus === "PAID" ? "text-green-400" : order.paymentStatus === "FAILED" ? "text-red-400" : "text-yellow-400"}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
