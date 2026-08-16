"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="bg-surface p-8 md:p-12 shadow-sm max-w-2xl mx-auto w-full text-center">
      <div className="mx-auto w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="font-display text-4xl font-light mb-4">Order Confirmed</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        Thank you for your purchase! We've received your order and are getting it ready to ship.
      </p>

      {orderId && (
        <div className="bg-muted/30 py-4 px-6 rounded-md mb-8 inline-block">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Order Number</p>
          <p className="font-mono text-lg font-medium">{orderId}</p>
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-12">
        You will receive an email confirmation shortly with your order details and tracking information.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button href="/shop" className="h-12 px-8">
          Continue Shopping
        </Button>
        <Link 
          href="/account/orders"
          className="inline-flex items-center justify-center h-12 px-8 border border-border text-foreground hover:bg-muted/50 transition-colors"
        >
          View Order Status
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="section-padding bg-muted/20 min-h-[80vh] flex items-center">
      <Container size="default">
        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
          <CheckoutSuccessContent />
        </Suspense>
      </Container>
    </div>
  );
}
