"use client";

import { useState } from "react";
import {
  CustomerShippingDetails,
  CourierRateOption,
  checkRatesAdminApi,
  assignCourierAdminApi,
  generateLabelAdminApi,
  schedulePickupAdminApi,
  syncTrackingAdminApi,
  cancelShipmentAdminApi,
} from "@/lib/api/shipping";
import { useToast } from "@/lib/context/ToastContext";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface OrderFulfillmentCardProps {
  orderId: string;
  shipping: CustomerShippingDetails | null;
  accessToken: string;
  onRefresh: () => void;
}

export function OrderFulfillmentCard({
  orderId,
  shipping,
  accessToken,
  onRefresh,
}: OrderFulfillmentCardProps) {
  const { toast } = useToast();

  // Rate comparison modal state
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesResult, setRatesResult] = useState<{
    metrics: { weight: number; length: number; breadth: number; height: number };
    availableCouriers: CourierRateOption[];
    recommendedCourier: CourierRateOption | null;
    strategyUsed: string;
  } | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<CourierRateOption | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Action loading states
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [isSchedulingPickup, setIsSchedulingPickup] = useState(false);
  const [isSyncingTracking, setIsSyncingTracking] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch rates
  const handleOpenRates = async () => {
    setIsRatesModalOpen(true);
    setIsLoadingRates(true);
    try {
      const res = await checkRatesAdminApi(accessToken, { orderId });
      setRatesResult(res);
      setSelectedCourier(res.recommendedCourier || res.availableCouriers[0] || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to retrieve courier rates");
      setIsRatesModalOpen(false);
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Assign courier
  const handleAssignCourier = async () => {
    if (!selectedCourier) return;
    setIsAssigning(true);
    try {
      await assignCourierAdminApi(accessToken, orderId, {
        courierId: selectedCourier.courierId,
        courierName: selectedCourier.courierName,
        rate: selectedCourier.rate,
        estimatedDays: selectedCourier.estimatedDays,
      });
      toast.success(`Dispatched shipment with ${selectedCourier.courierName}!`);
      setIsRatesModalOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign courier");
    } finally {
      setIsAssigning(false);
    }
  };

  // Generate label
  const handleGenerateLabel = async () => {
    if (!shipping?.id) return;
    setIsGeneratingLabel(true);
    try {
      const res = await generateLabelAdminApi(accessToken, shipping.id);
      toast.success("Shipping label generated successfully!");
      if (res.labelUrl) {
        window.open(res.labelUrl, "_blank");
      }
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate shipping label");
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  // Schedule pickup
  const handleSchedulePickup = async () => {
    if (!shipping?.id) return;
    setIsSchedulingPickup(true);
    try {
      const res = await schedulePickupAdminApi(accessToken, shipping.id);
      toast.success(`Pickup scheduled! Token: ${res.pickupRequestId}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule pickup");
    } finally {
      setIsSchedulingPickup(false);
    }
  };

  // Sync tracking
  const handleSyncTracking = async () => {
    if (!shipping?.id) return;
    setIsSyncingTracking(true);
    try {
      const res = await syncTrackingAdminApi(accessToken, shipping.id);
      toast.success(`Tracking synced: ${res.events?.length || 0} milestones`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to sync tracking checkpoints");
    } finally {
      setIsSyncingTracking(false);
    }
  };

  // Cancel shipment
  const handleConfirmCancel = async () => {
    if (!shipping?.id) return;
    setIsCancelling(true);
    try {
      await cancelShipmentAdminApi(accessToken, shipping.id, "Administrative cancellation");
      toast.info("Shipment cancelled with provider");
      setIsCancelDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel shipment");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
        <div>
          <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider flex items-center gap-2">
            <span>Logistics & Fulfillment</span>
            {shipping?.status && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                shipping.status === "DELIVERED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : shipping.status === "CANCELLED"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}>
                {shipping.status.replace(/_/g, " ")}
              </span>
            )}
          </h2>
          <p className="text-xs text-white/40 mt-1">
            Automated courier serviceability, rates, label generation and tracking
          </p>
        </div>

        {/* Action button to open rates / dispatch */}
        {(!shipping || shipping.status === "CANCELLED" || shipping.status === "DRAFT") && (
          <button
            onClick={handleOpenRates}
            type="button"
            className="px-4 py-2 bg-white text-[#0f0f0f] rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>📦 Check Courier Rates & Dispatch</span>
          </button>
        )}
      </div>

      {/* Active Shipment Details */}
      {shipping ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/3 border border-white/6 rounded-lg p-4 text-xs">
            <div>
              <p className="text-white/40 uppercase tracking-wider mb-1">Courier Partner</p>
              <p className="text-sm font-medium text-white">{shipping.courierName || shipping.shippingProvider || "—"}</p>
            </div>
            <div>
              <p className="text-white/40 uppercase tracking-wider mb-1">AWB / Tracking #</p>
              <p className="text-sm font-mono font-medium text-white">{shipping.awbCode || "—"}</p>
            </div>
            <div>
              <p className="text-white/40 uppercase tracking-wider mb-1">Est. Delivery</p>
              <p className="text-sm font-medium text-white">
                {shipping.estimatedDelivery
                  ? new Date(shipping.estimatedDelivery).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-white/40 uppercase tracking-wider mb-1">Live Tracking</p>
              {shipping.trackingUrl ? (
                <a
                  href={shipping.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1"
                >
                  <span>Carrier Portal ↗</span>
                </a>
              ) : (
                <p className="text-white/40">—</p>
              )}
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleGenerateLabel}
              disabled={isGeneratingLabel}
              type="button"
              className="px-3.5 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>📄</span>
              <span>{isGeneratingLabel ? "Generating..." : shipping.labelUrl ? "Re-open Label PDF" : "Generate Shipping Label"}</span>
            </button>

            <button
              onClick={handleSchedulePickup}
              disabled={isSchedulingPickup || shipping.status === "DELIVERED" || shipping.status === "CANCELLED"}
              type="button"
              className="px-3.5 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>🚚</span>
              <span>{isSchedulingPickup ? "Scheduling..." : "Schedule Pickup"}</span>
            </button>

            <button
              onClick={handleSyncTracking}
              disabled={isSyncingTracking}
              type="button"
              className="px-3.5 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>🔄</span>
              <span>{isSyncingTracking ? "Syncing..." : "Sync Tracking"}</span>
            </button>

            {shipping.status !== "DELIVERED" && shipping.status !== "CANCELLED" && (
              <button
                onClick={() => setIsCancelDialogOpen(true)}
                type="button"
                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-colors ml-auto"
              >
                Cancel Shipment
              </button>
            )}
          </div>

          {/* Latest Milestones */}
          {shipping.events && shipping.events.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Latest Tracking Milestones</p>
              <div className="space-y-1.5">
                {shipping.events.slice(0, 3).map((evt, i) => (
                  <div key={evt.id || i} className="flex items-center justify-between text-xs py-1 px-2.5 rounded bg-white/2 border border-white/4">
                    <span className="text-white/80">{evt.description}</span>
                    <span className="text-white/40 font-mono">
                      {new Date(evt.occurredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-white/40 text-xs">
          <p>No active shipment created for this order yet.</p>
          <p className="mt-1">Use the rates button above to compare couriers and dispatch.</p>
        </div>
      )}

      {/* Courier Comparison & Dispatch Modal */}
      <Modal
        open={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        title="Compare Courier Rates & Dispatch"
        size="lg"
      >
        <div className="space-y-5">
          {isLoadingRates ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Querying serviceable couriers & live rates...</p>
            </div>
          ) : ratesResult ? (
            <div className="space-y-4">
              {/* Package metrics summary */}
              <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground">Package Weight: </span>
                  <span className="font-semibold text-foreground">{ratesResult.metrics.weight} kg</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Dimensions: </span>
                  <span className="font-semibold text-foreground">
                    {ratesResult.metrics.length} × {ratesResult.metrics.breadth} × {ratesResult.metrics.height} cm
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Active Strategy: </span>
                  <span className="font-semibold uppercase text-foreground">{ratesResult.strategyUsed}</span>
                </div>
              </div>

              {/* Courier rate table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border text-left">
                    <tr>
                      <th className="p-2.5">Select</th>
                      <th className="p-2.5">Courier</th>
                      <th className="p-2.5">Freight Rate</th>
                      <th className="p-2.5">Est. Days</th>
                      <th className="p-2.5">Rating</th>
                      <th className="p-2.5">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ratesResult.availableCouriers.map((c) => {
                      const isSelected = selectedCourier?.courierId === c.courierId;
                      const isRecommended = ratesResult.recommendedCourier?.courierId === c.courierId;

                      return (
                        <tr
                          key={c.courierId}
                          onClick={() => setSelectedCourier(c)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-foreground/5 font-medium" : "hover:bg-muted/30"
                          }`}
                        >
                          <td className="p-2.5">
                            <input
                              type="radio"
                              name="courierSelection"
                              checked={isSelected}
                              onChange={() => setSelectedCourier(c)}
                              className="accent-foreground"
                            />
                          </td>
                          <td className="p-2.5">
                            <div className="flex items-center gap-2">
                              <span>{c.courierName}</span>
                              {isRecommended && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                                  ★ Recommended
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 font-mono">₹{c.rate.toFixed(2)}</td>
                          <td className="p-2.5">{c.estimatedDays} {c.estimatedDays === 1 ? "day" : "days"}</td>
                          <td className="p-2.5">★ {c.rating ? c.rating.toFixed(1) : "—"}</td>
                          <td className="p-2.5 font-mono">{c.score !== undefined ? c.score.toFixed(3) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Confirm Dispatch Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRatesModalOpen(false)}
                  className="px-4 py-2 border border-border text-foreground hover:bg-muted rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedCourier || isAssigning}
                  onClick={handleAssignCourier}
                  className="px-5 py-2 bg-foreground text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isAssigning ? "Dispatching..." : `Assign & Dispatch with ${selectedCourier?.courierName || "Courier"}`}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={isCancelDialogOpen}
        title="Cancel Shipment"
        description="Are you sure you want to cancel this shipment with the carrier? This will void the AWB and allow you to re-assign a new courier."
        confirmLabel="Yes, Cancel Shipment"
        variant="danger"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onClose={() => setIsCancelDialogOpen(false)}
      />
    </div>
  );
}
