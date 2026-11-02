"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { getAdminOrdersApi, AdminOrder } from "@/lib/api/admin";
import {
  ShippingSettings,
  ShippingProviderConfig,
  getShippingSettingsAdminApi,
  updateShippingSettingsAdminApi,
  getShippingProvidersAdminApi,
  updateShippingProviderAdminApi,
} from "@/lib/api/shipping";
import { Modal } from "@/components/ui/Modal";

type Tab = "queue" | "settings" | "providers";

const ALL_POPULAR_COURIERS = [
  "Blue Dart",
  "Delhivery",
  "Ekart Logistics",
  "DTDC Express",
  "Shadowfax",
  "Ecom Express",
  "Xpressbees",
  "India Post",
];

export default function AdminShippingPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("queue");

  // ─── Queue State ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [queueFilter, setQueueFilter] = useState<string>("ALL");

  // ─── Settings State ──────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // ─── Providers State ─────────────────────────────────────────────────────────
  const [providers, setProviders] = useState<ShippingProviderConfig[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ShippingProviderConfig | null>(null);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [providerForm, setProviderForm] = useState({
    isActive: true,
    isMock: false,
    apiKey: "",
    apiSecret: "",
    email: "",
    password: "",
  });
  const [isSavingProvider, setIsSavingProvider] = useState(false);

  // ─── Initial Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    loadOrders();
    loadSettings();
    loadProviders();
  }, [accessToken]);

  const loadOrders = async () => {
    if (!accessToken) return;
    setIsLoadingOrders(true);
    try {
      const [processing, shipped, confirmed] = await Promise.all([
        getAdminOrdersApi(accessToken, { status: "PROCESSING", limit: 30 }),
        getAdminOrdersApi(accessToken, { status: "SHIPPED", limit: 30 }),
        getAdminOrdersApi(accessToken, { status: "CONFIRMED", limit: 30 }),
      ]);
      setOrders([...confirmed.orders, ...processing.orders, ...shipped.orders]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadSettings = async () => {
    if (!accessToken) return;
    setIsLoadingSettings(true);
    try {
      const { settings: s } = await getShippingSettingsAdminApi(accessToken);
      setSettings(s);
    } catch (err: any) {
      console.error("Failed to load shipping settings", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadProviders = async () => {
    if (!accessToken) return;
    setIsLoadingProviders(true);
    try {
      const { providers: p } = await getShippingProvidersAdminApi(accessToken);
      setProviders(p);
    } catch (err: any) {
      console.error("Failed to load providers", err);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  // ─── Settings Handlers ───────────────────────────────────────────────────────
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !settings) return;
    setIsSavingSettings(true);
    try {
      const { settings: updated } = await updateShippingSettingsAdminApi(accessToken, settings);
      setSettings(updated);
      toast.success("Shipping & fulfillment settings updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleCourier = (courierName: string) => {
    if (!settings) return;
    const current = settings.allowedCouriers || [];
    const updated = current.includes(courierName)
      ? current.filter((c) => c !== courierName)
      : [...current, courierName];
    setSettings({ ...settings, allowedCouriers: updated });
  };

  // ─── Provider Handlers ───────────────────────────────────────────────────────
  const handleOpenProviderModal = (provider: ShippingProviderConfig) => {
    setSelectedProvider(provider);
    setProviderForm({
      isActive: provider.isActive,
      isMock: provider.isMock,
      apiKey: "",
      apiSecret: "",
      email: "",
      password: "",
    });
    setIsProviderModalOpen(true);
  };

  const handleSaveProvider = async () => {
    if (!accessToken || !selectedProvider) return;
    setIsSavingProvider(true);
    try {
      const creds: Record<string, string> = {};
      if (providerForm.email) creds.email = providerForm.email;
      if (providerForm.password) creds.password = providerForm.password;
      if (providerForm.apiKey) creds.apiKey = providerForm.apiKey;
      if (providerForm.apiSecret) creds.apiSecret = providerForm.apiSecret;

      const payload: any = {
        isActive: providerForm.isActive,
        isMock: providerForm.isMock,
      };
      if (Object.keys(creds).length > 0) {
        payload.credentials = creds;
      }

      await updateShippingProviderAdminApi(accessToken, selectedProvider.providerName, payload);
      toast.success(`${selectedProvider.providerName} configuration updated!`);
      setIsProviderModalOpen(false);
      loadProviders();
    } catch (err: any) {
      toast.error(err.message || "Failed to update provider configuration");
    } finally {
      setIsSavingProvider(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (queueFilter === "ALL") return true;
    return o.status === queueFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logistics & Shipping Operations</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Manage fulfillment queue, courier selection strategies, and carrier integrations
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-white/5 border border-white/8 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "queue" ? "bg-white text-[#0f0f0f] shadow-sm font-semibold" : "text-white/60 hover:text-white"
            }`}
          >
            📦 Fulfillment Queue
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "settings" ? "bg-white text-[#0f0f0f] shadow-sm font-semibold" : "text-white/60 hover:text-white"
            }`}
          >
            ⚙️ Warehouse & Rules
          </button>
          <button
            onClick={() => setActiveTab("providers")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "providers" ? "bg-white text-[#0f0f0f] shadow-sm font-semibold" : "text-white/60 hover:text-white"
            }`}
          >
            🔌 Carrier Providers
          </button>
        </div>
      </div>

      {/* ─── TAB 1: FULFILLMENT QUEUE ────────────────────────────────────────────── */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/8 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-white/40">Total Active</p>
              <p className="text-2xl font-semibold mt-1">{orders.length}</p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-white/40">Awaiting Dispatch</p>
              <p className="text-2xl font-semibold mt-1 text-blue-400">
                {orders.filter((o) => o.status === "CONFIRMED" || o.status === "PROCESSING").length}
              </p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-white/40">Shipped / In Transit</p>
              <p className="text-2xl font-semibold mt-1 text-purple-400">
                {orders.filter((o) => o.status === "SHIPPED").length}
              </p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wider text-white/40">Auto-Dispatch Mode</p>
              <p className="text-sm font-medium mt-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${settings?.autoCreateShipment ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>{settings?.autoCreateShipment ? "Automatic (Outbox)" : "Manual Assignment"}</span>
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {["ALL", "CONFIRMED", "PROCESSING", "SHIPPED"].map((f) => (
              <button
                key={f}
                onClick={() => setQueueFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  queueFilter === f
                    ? "bg-white/10 text-white border-white/20 font-medium"
                    : "bg-white/3 text-white/40 border-white/6 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white/5 border border-white/8 rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/8 text-xs uppercase tracking-wider text-white/30">
              <div className="col-span-3">Order Number</div>
              <div className="col-span-3">Customer & Destination</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Fulfillment</div>
            </div>

            {isLoadingOrders ? (
              <div className="p-8 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-white/5 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <p>No orders matching current filter.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 border-b border-white/6 last:border-b-0 items-center hover:bg-white/2 transition-colors"
                >
                  <div className="md:col-span-3">
                    <p className="text-sm font-mono font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-white/40 mt-0.5">Total: ₹{order.total}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm truncate">
                      {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Customer"}
                    </p>
                    {order.shippingAddress && (
                      <p className="text-xs text-white/40 truncate">
                        {order.shippingAddress.city}, {order.shippingAddress.state} ({order.shippingAddress.postalCode})
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-white/50">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border ${
                        order.status === "SHIPPED"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : order.status === "PROCESSING"
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="md:col-span-2 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg transition-colors"
                    >
                      <span>Manage</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: WAREHOUSE & SELECTION RULES ────────────────────────────────────── */}
      {activeTab === "settings" && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Automation Switch */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
                Automated Shipment Creation
              </h2>
              <p className="text-xs text-white/40 mt-1 max-w-xl">
                When enabled, the Transactional Outbox worker automatically calculates package metrics, queries live courier rates, evaluates selection algorithms, and creates shipments as soon as an order is confirmed.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoCreateShipment}
                onChange={(e) => setSettings({ ...settings, autoCreateShipment: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Warehouse Origin Address */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Warehouse Origin Address
            </h2>
            <p className="text-xs text-white/40">
              The pickup origin location sent to couriers for rate calculation and scheduled manifest pickups.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-white/40 mb-1.5">Street Address</label>
                <input
                  type="text"
                  value={settings.originAddress.streetAddress}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      originAddress: { ...settings.originAddress, streetAddress: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">City</label>
                <input
                  type="text"
                  value={settings.originAddress.city}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      originAddress: { ...settings.originAddress, city: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">State</label>
                <input
                  type="text"
                  value={settings.originAddress.state}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      originAddress: { ...settings.originAddress, state: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">PIN / Postal Code</label>
                <input
                  type="text"
                  value={settings.originAddress.postalCode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      originAddress: { ...settings.originAddress, postalCode: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={settings.originAddress.contactPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      originAddress: { ...settings.originAddress, contactPhone: e.target.value },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Courier Selection Strategy */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Automated Courier Selection Strategy
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: "CHEAPEST",
                  title: "Cheapest Freight",
                  desc: "Selects lowest carrier freight rate among serviceable partners.",
                },
                {
                  id: "FASTEST",
                  title: "Fastest Turnaround",
                  desc: "Prioritizes earliest transit days for premium delivery experience.",
                },
                {
                  id: "BALANCED",
                  title: "Balanced Multi-Factor",
                  desc: "Composite score evaluating price, turnaround days, and carrier quality.",
                },
              ].map((strat) => (
                <div
                  key={strat.id}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      selectionStrategy: strat.id as any,
                    })
                  }
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.selectionStrategy === strat.id
                      ? "bg-white/10 border-white/40 ring-1 ring-white/20"
                      : "bg-white/3 border-white/6 hover:bg-white/6"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{strat.title}</span>
                    <input
                      type="radio"
                      name="selectionStrategy"
                      checked={settings.selectionStrategy === strat.id}
                      onChange={() =>
                        setSettings({
                          ...settings,
                          selectionStrategy: strat.id as any,
                        })
                      }
                      className="accent-white"
                    />
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">{strat.desc}</p>
                </div>
              ))}
            </div>

            {/* Weights Sliders (When BALANCED is chosen) */}
            {settings.selectionStrategy === "BALANCED" && (
              <div className="mt-4 p-4 bg-white/2 border border-white/6 rounded-lg space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Multi-Factor Score Weights (Sum: 1.0)
                </p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-white/40 mb-1">Cost Weight ({settings.strategyWeights.costWeight})</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.strategyWeights.costWeight}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          strategyWeights: {
                            ...settings.strategyWeights,
                            costWeight: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/40 mb-1">Speed Weight ({settings.strategyWeights.speedWeight})</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.strategyWeights.speedWeight}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          strategyWeights: {
                            ...settings.strategyWeights,
                            speedWeight: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-white"
                    />
                  </div>
                  <div>
                    <label className="block text-white/40 mb-1">Rating Weight ({settings.strategyWeights.ratingWeight})</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.strategyWeights.ratingWeight}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          strategyWeights: {
                            ...settings.strategyWeights,
                            ratingWeight: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Allowed Couriers Whitelist */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Allowed Courier Partners Whitelist
            </h2>
            <p className="text-xs text-white/40">
              Only checked couriers will be eligible for automated or suggested assignment.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {ALL_POPULAR_COURIERS.map((c) => {
                const isChecked = settings.allowedCouriers.includes(c);
                return (
                  <label
                    key={c}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      isChecked ? "bg-white/10 border-white/30 text-white font-medium" : "bg-white/2 border-white/6 text-white/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCourier(c)}
                      className="accent-white rounded"
                    />
                    <span>{c}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Package Fallback Defaults */}
          <div className="bg-white/5 border border-white/8 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Fallback Package Dimensions
            </h2>
            <p className="text-xs text-white/40">
              Used when items in an order do not have explicit physical package dimensions specified.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.fallbackDimensions.defaultPackageWeight}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fallbackDimensions: {
                        ...settings.fallbackDimensions,
                        defaultPackageWeight: parseFloat(e.target.value) || 0.5,
                      },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Length (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.fallbackDimensions.defaultLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fallbackDimensions: {
                        ...settings.fallbackDimensions,
                        defaultLength: parseFloat(e.target.value) || 10,
                      },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Breadth (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.fallbackDimensions.defaultBreadth}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fallbackDimensions: {
                        ...settings.fallbackDimensions,
                        defaultBreadth: parseFloat(e.target.value) || 10,
                      },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Height (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  value={settings.fallbackDimensions.defaultHeight}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      fallbackDimensions: {
                        ...settings.fallbackDimensions,
                        defaultHeight: parseFloat(e.target.value) || 10,
                      },
                    })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 bg-white text-[#0f0f0f] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSavingSettings ? "Saving Settings..." : "Save Shipping Settings"}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 3: CARRIER PROVIDER INTEGRATIONS ──────────────────────────────────── */}
      {activeTab === "providers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-white/5 border border-white/8 rounded-xl p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">{p.providerName}</h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          p.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-white/5 text-white/40 border-white/10"
                        }`}
                      >
                        {p.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                          p.isMock
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {p.isMock ? "SANDBOX / MOCK" : "LIVE PRODUCTION"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-white/40 mt-1">
                    Type: <span className="uppercase text-white/60">{p.providerType}</span>
                  </p>

                  <div className="mt-4 p-3 bg-white/2 border border-white/4 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-white/50">Encrypted Credentials:</span>
                    <span className={`font-mono ${p.hasCredentials ? "text-emerald-400" : "text-amber-400"}`}>
                      {p.hasCredentials ? "✓ Configured (AES-256-GCM)" : "⚠️ Missing (Using Mock)"}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenProviderModal(p)}
                    type="button"
                    className="w-full px-4 py-2 bg-white/8 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>⚙️ Configure Credentials & Mode</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Provider Credentials Modal */}
          {selectedProvider && (
            <Modal
              open={isProviderModalOpen}
              onClose={() => setIsProviderModalOpen(false)}
              title={`Configure ${selectedProvider.providerName}`}
              size="md"
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 bg-muted/40 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">Provider Active</p>
                      <p className="text-xs text-muted-foreground">Enable provider for rate queries & dispatch</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={providerForm.isActive}
                      onChange={(e) => setProviderForm({ ...providerForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded accent-foreground"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 bg-muted/40 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">Sandbox / Mock Mode</p>
                      <p className="text-xs text-muted-foreground">Simulate courier network without consuming API balance</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={providerForm.isMock}
                      onChange={(e) => setProviderForm({ ...providerForm, isMock: e.target.checked })}
                      className="w-4 h-4 rounded accent-foreground"
                    />
                  </label>
                </div>

                {/* Credential Inputs */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Carrier API Credentials (Encrypted at rest)
                  </p>

                  {selectedProvider.providerName === "SHIPROCKET" ? (
                    <>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Shiprocket Email</label>
                        <input
                          type="email"
                          value={providerForm.email}
                          onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                          placeholder="registered-email@domain.com"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Shiprocket Password</label>
                        <input
                          type="password"
                          value={providerForm.password}
                          onChange={(e) => setProviderForm({ ...providerForm, password: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground font-mono"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">API Key / Token</label>
                        <input
                          type="password"
                          value={providerForm.apiKey}
                          onChange={(e) => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">API Secret / Client ID</label>
                        <input
                          type="password"
                          value={providerForm.apiSecret}
                          onChange={(e) => setProviderForm({ ...providerForm, apiSecret: e.target.value })}
                          placeholder="••••••••••••"
                          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsProviderModalOpen(false)}
                    className="px-4 py-2 border border-border text-foreground hover:bg-muted rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSavingProvider}
                    onClick={handleSaveProvider}
                    className="px-5 py-2 bg-foreground text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSavingProvider ? "Saving..." : "Update Provider"}
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}
