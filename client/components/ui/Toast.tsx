"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast, type ToastItem, type ToastVariant } from "@/lib/context/ToastContext";
import { cn } from "@/lib/utils/cn";

// ── Per-variant styling ──────────────────────────────────────────────────────

const variantConfig: Record<
  ToastVariant,
  { icon: string; bar: string; bg: string; border: string; text: string }
> = {
  success: {
    icon: "✓",
    bar: "bg-emerald-500",
    bg: "bg-emerald-950/90",
    border: "border-emerald-700/50",
    text: "text-emerald-100",
  },
  error: {
    icon: "✕",
    bar: "bg-red-500",
    bg: "bg-red-950/90",
    border: "border-red-700/50",
    text: "text-red-100",
  },
  warning: {
    icon: "⚠",
    bar: "bg-amber-500",
    bg: "bg-amber-950/90",
    border: "border-amber-700/50",
    text: "text-amber-100",
  },
  info: {
    icon: "ℹ",
    bar: "bg-blue-500",
    bg: "bg-blue-950/90",
    border: "border-blue-700/50",
    text: "text-blue-100",
  },
};

// ── Single toast card ────────────────────────────────────────────────────────

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const cfg = variantConfig[toast.variant];

  // Slide-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(onDismiss, 300);
  };

  // Progress bar state
  const [progress, setProgress] = useState(100);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(pct);
      if (pct > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [toast.duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "relative w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border backdrop-blur-md shadow-2xl",
        "transition-all duration-300",
        cfg.bg,
        cfg.border,
        visible && !leaving
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0",
      )}
    >
      {/* Progress bar */}
      {toast.duration > 0 && (
        <div
          className={cn("absolute top-0 left-0 h-[2px] transition-none", cfg.bar)}
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="flex items-start gap-3 p-4 pt-5">
        {/* Icon */}
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            cfg.bar,
            "text-white",
          )}
        >
          {cfg.icon}
        </span>

        {/* Message */}
        <p className={cn("flex-1 text-sm leading-snug font-medium", cfg.text)}>
          {toast.message}
        </p>

        {/* Close */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="text-white/40 hover:text-white/80 transition-colors shrink-0 mt-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Toast portal container ───────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts, dismiss } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastCard toast={t} onDismiss={() => dismiss(t.id)} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
