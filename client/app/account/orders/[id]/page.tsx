"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { getOrderByIdApi, cancelOrderApi, Order } from "@/lib/api/orders";
import { getShippingDetailsApi, CustomerShippingDetails } from "@/lib/api/shipping";
import { TrackingTimeline } from "@/components/shipping/TrackingTimeline";
import { ApiClientError } from "@/lib/api/client";

const STATUS_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Preparing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const SHIPPING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Label Created",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Delivery Failed",
  RETURNED: "Returned",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [shipping, setShipping] = useState<CustomerShippingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken || !id) return;
    setIsLoading(true);

    Promise.all([
      getOrderByIdApi(accessToken, id),
      getShippingDetailsApi(accessToken, id).catch(() => null),
    ])
      .then(([{ order }, shippingData]) => {
        setOrder(order);
        const details = (shippingData as any)?.shipping || shippingData;
        setShipping(details?.id ? (details as CustomerShippingDetails) : null);
      })
      .catch(() => setError("Order not found."))
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);

  const handleCancel = async () => {
    if (!accessToken || !order) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setIsCancelling(true);
    try {
      const { order: cancelled } = await cancelOrderApi(accessToken, order.id);
      setOrder(cancelled);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to cancel order.");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">{error || "Order not found."}</p>
        <Link href="/account/orders" className="text-sm underline underline-offset-4">
          ← Back to orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = order.status === "CANCELLED"
    ? -1
    : STATUS_STEPS.indexOf(order.status);

  const canCancel = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/account/orders"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← Back to orders
          </Link>
          <h2 className="text-xl font-medium">
            Order {(order as any).orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </div>
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="px-4 py-2 text-sm border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4">{error}</div>
      )}

      {/* Order Status Timeline */}
      <div className="bg-surface p-6 shadow-sm">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-6">Order Status</h3>

        {order.status === "CANCELLED" ? (
          <div className="flex items-center gap-3 text-red-600">
            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
            <span className="font-medium">This order has been cancelled.</span>
          </div>
        ) : (
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step} className="flex items-center flex-1 min-w-[80px]">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isCompleted
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <p className={`text-xs mt-2 text-center leading-tight ${isCurrent ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {STATUS_LABELS[step]}
                    </p>
                  </div>
                  {index < STATUS_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 transition-all ${index < currentStepIndex ? "bg-foreground" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-surface p-6 shadow-sm">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Items</h3>
        <div className="space-y-4">
          {((order as any).items || []).map((item: any) => (
            <div key={item.id} className="flex items-start gap-4 py-3 border-b border-border last:border-b-0">
              <div className="w-12 h-12 bg-muted/30 flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                IMG
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.productSku}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.unitPrice}</p>
              </div>
              <div className="text-sm font-medium">₹{item.lineTotal}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing + Shipping Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Payment Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>₹{order.shippingCost || "0.00"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{order.tax || "0.00"}</span>
            </div>
            <div className="flex justify-between font-medium text-base pt-3 border-t border-border">
              <span>Total</span>
              <span>₹{order.total}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-muted-foreground">Payment Status</span>
              <span className={`font-medium ${
                order.paymentStatus === "PAID" ? "text-green-600" :
                order.paymentStatus === "FAILED" ? "text-red-600" :
                order.paymentStatus === "REFUNDED" ? "text-blue-600" :
                "text-yellow-600"
              }`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">Shipping Address</h3>
          {order.shippingAddress ? (
            <address className="text-sm not-italic space-y-1 text-muted-foreground">
              <p className="text-foreground font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.streetAddress}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-1">{order.shippingAddress.phone}</p>
            </address>
          ) : (
            <p className="text-sm text-muted-foreground">No address on file.</p>
          )}
        </div>
      </div>

      {/* Shipping / Tracking Timeline */}
      {shipping && (
        <TrackingTimeline shipping={shipping} />
      )}
    </div>
  );
}
