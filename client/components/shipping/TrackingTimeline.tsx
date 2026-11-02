"use client";

import { useState } from "react";
import { CustomerShippingDetails, ShipmentEvent } from "@/lib/api/shipping";

interface TrackingTimelineProps {
  shipping: CustomerShippingDetails;
}

const PRIMARY_STEPS = [
  { key: "ORDER_PLACED", label: "Order Placed" },
  { key: "PICKED_UP", label: "Dispatched" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { key: "DELIVERED", label: "Delivered" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "DRAFT":
    case "PENDING_PICKUP":
    case "PICKUP_SCHEDULED":
      return 0; // Placed / Processing dispatch
    case "PICKED_UP":
      return 1;
    case "IN_TRANSIT":
      return 2;
    case "OUT_FOR_DELIVERY":
      return 3;
    case "DELIVERED":
      return 4;
    case "FAILED_ATTEMPT":
      return 3;
    case "RTO_INITIATED":
    case "RTO_IN_TRANSIT":
    case "RTO_DELIVERED":
      return 2;
    case "CANCELLED":
      return -1;
    default:
      return 1;
  }
}

export function TrackingTimeline({ shipping }: TrackingTimelineProps) {
  const [copied, setCopied] = useState(false);
  const currentStep = getStepIndex(shipping.status);
  const isCancelled = shipping.status === "CANCELLED";
  const isRto = shipping.status.startsWith("RTO_");

  const handleCopyAwb = async () => {
    if (!shipping.awbCode) return;
    try {
      await navigator.clipboard.writeText(shipping.awbCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const formattedEstimatedDate = shipping.estimatedDelivery
    ? new Date(shipping.estimatedDelivery).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-medium tracking-tight">Shipment & Delivery</h3>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                shipping.status === "DELIVERED"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                  : isCancelled
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                  : isRto
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              }`}
            >
              {shipping.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fulfillment Partner: <span className="text-foreground font-medium">{shipping.courierName || shipping.shippingProvider}</span>
          </p>
        </div>

        {/* Tracking Number & Actions */}
        {shipping.awbCode && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAwb}
              type="button"
              className="text-xs px-3 py-1.5 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors flex items-center gap-1.5 font-mono"
              title="Click to copy AWB"
            >
              <span>AWB: {shipping.awbCode}</span>
              <span className="text-muted-foreground text-[10px]">
                {copied ? "✓ Copied" : "Copy"}
              </span>
            </button>

            {shipping.trackingUrl && (
              <a
                href={shipping.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 bg-foreground text-background hover:opacity-90 rounded-lg transition-opacity flex items-center gap-1 font-medium"
              >
                <span>Track Live</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Estimated Delivery Banner */}
      {formattedEstimatedDate && shipping.status !== "DELIVERED" && !isCancelled && (
        <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-lg text-sm">
          <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0 text-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Estimated Delivery: {formattedEstimatedDate}
            </p>
            <p className="text-xs text-muted-foreground">
              Package is being handled by {shipping.courierName || "courier partner"}.
            </p>
          </div>
        </div>
      )}

      {/* Step Progress Line */}
      {!isCancelled && (
        <div className="pt-2 pb-4">
          <div className="flex items-start justify-between relative">
            {PRIMARY_STEPS.map((step, idx) => {
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative text-center">
                  {/* Line segment between circles */}
                  {idx > 0 && (
                    <div
                      className={`absolute top-4 -left-1/2 right-1/2 h-0.5 transition-colors -z-0 ${
                        idx <= currentStep ? "bg-foreground" : "bg-border"
                      }`}
                    />
                  )}

                  {/* Step circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-all ${
                      isPassed
                        ? "bg-foreground text-background"
                        : "bg-surface border-2 border-border text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-foreground/10 font-bold" : ""}`}
                  >
                    {isPassed ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs">{idx + 1}</span>
                    )}
                  </div>

                  <p
                    className={`text-xs mt-2.5 max-w-[80px] leading-tight ${
                      isCurrent
                        ? "font-medium text-foreground"
                        : isPassed
                        ? "text-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Checkpoint History */}
      {shipping.events && shipping.events.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tracking History ({shipping.events.length} Milestones)
          </h4>
          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {shipping.events.map((evt, i) => (
              <div key={evt.id || i} className="relative group">
                {/* Dot marker */}
                <div
                  className={`absolute -left-[19px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                    i === 0 ? "bg-foreground ring-2 ring-foreground/20" : "bg-muted-foreground/60"
                  }`}
                />
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <p className={`text-sm ${i === 0 ? "font-medium text-foreground" : "text-foreground/80"}`}>
                      {evt.description}
                    </p>
                    {evt.location && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        📍 {evt.location}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground font-mono flex-shrink-0">
                    {new Date(evt.occurredAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

