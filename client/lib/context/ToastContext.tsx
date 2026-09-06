"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number; // ms, 0 = persistent
}

interface ToastContextValue {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;
function nextId() {
  return `toast-${++idCounter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    // Clear any pending auto-dismiss timer
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, variant: ToastVariant, duration = 4500) => {
      const id = nextId();
      setToasts((prev) => {
        // Cap at 5 toasts — drop the oldest when full
        const trimmed = prev.length >= 5 ? prev.slice(1) : prev;
        return [...trimmed, { id, message, variant, duration }];
      });

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (m: string, d?: number) => add(m, "success", d),
      error: (m: string, d?: number) => add(m, "error", d),
      info: (m: string, d?: number) => add(m, "info", d),
      warning: (m: string, d?: number) => add(m, "warning", d),
    }),
    [add],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, dismiss, toast }),
    [toasts, dismiss, toast],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
