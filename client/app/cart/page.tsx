"use client";

import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { CartItem } from "@/components/cart/CartItem";

export default function CartPage() {
  const { cart, isLoading, totalItems, subtotal } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (isLoading || authLoading) {
    return (
      <div className="section-padding animate-pulse">
        <Container size="narrow">
          <div className="h-10 w-32 bg-muted mb-8" />
          <div className="space-y-6">
            <div className="h-32 w-full bg-muted" />
            <div className="h-32 w-full bg-muted" />
          </div>
        </Container>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="section-padding">
        <Container size="narrow" className="text-center">
          <h1 className="font-display text-display-md font-light mb-6">Your Cart</h1>
          <p className="text-body-lg text-muted-foreground mb-8">
            Please log in to view and manage your cart.
          </p>
          <Button href="/login" size="lg">
            Log In
          </Button>
        </Container>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="section-padding">
        <Container size="narrow" className="text-center py-16">
          <h1 className="font-display text-display-md font-light mb-6">Your Cart is Empty</h1>
          <p className="text-body-lg text-muted-foreground mb-10">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Button href="/shop" size="lg">
            Continue Shopping
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <Container size="narrow">
        <h1 className="font-display text-display-md font-light mb-8 pb-4 border-b border-border">
          Your Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items */}
          <div className="flex-1">
            <div className="flex flex-col">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-surface p-6 sticky top-24">
              <h2 className="font-medium text-foreground mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm mb-6 border-b border-border/50 pb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">${parseFloat(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-muted-foreground">Calculated at checkout</span>
                </div>
              </div>
              
              <div className="flex justify-between mb-8 font-medium text-lg">
                <span>Estimated Total</span>
                <span>${parseFloat(cart.estimatedTotal).toFixed(2)}</span>
              </div>
              
              <Button href="/checkout" className="w-full h-12 text-base">
                Proceed to Checkout
              </Button>
              
              <div className="mt-4 text-center">
                <Link href="/shop" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
