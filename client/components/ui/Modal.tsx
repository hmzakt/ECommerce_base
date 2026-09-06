"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Max width of the modal panel */
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  /** Hide the default header */
  bareContent?: boolean;
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  bareContent = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus the panel on open
  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const content = (
    <div
      className={cn(
        "fixed inset-0 z-[9000] flex items-center justify-center p-4",
        "transition-opacity duration-200",
        open ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
        className={cn(
          "relative w-full rounded-2xl bg-background border border-border shadow-2xl",
          "focus:outline-none",
          "transition-all duration-200",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0",
          sizeClass[size],
        )}
      >
        {!bareContent && (
          <>
            {/* Header */}
            {(title || description) && (
              <div className="px-6 pt-6 pb-4 border-b border-border">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-base font-semibold text-foreground"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-muted-foreground"
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5">{children}</div>
          </>
        )}

        {bareContent && children}

        {/* Close button (always present) */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className={cn(
            "absolute top-4 right-4 rounded-md p-1",
            "text-muted-foreground hover:text-foreground transition-colors",
            "hover:bg-muted",
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
