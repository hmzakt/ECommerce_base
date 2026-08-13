"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/context/CartContext";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";

interface AddToCartFormProps {
  productId: string;
  isAvailable: boolean;
}

export function AddToCartForm({ productId, isAvailable }: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, isLoading: isCartLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => Math.max(1, q - 1));

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push("/login"); // or show a toast
      return;
    }

    setIsAdding(true);
    try {
      await addItem({ productId, quantity });
      // Could show a success toast or open a mini-cart drawer here
    } finally {
      setIsAdding(false);
    }
  };

  if (!isAvailable) {
    return (
      <Button disabled className="w-full h-12 text-base">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex h-12 w-32 items-center justify-between border border-border">
          <button
            type="button"
            onClick={decrement}
            className="flex h-full w-10 items-center justify-center text-foreground hover:bg-muted disabled:opacity-50"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="text-sm">{quantity}</span>
          <button
            type="button"
            onClick={increment}
            className="flex h-full w-10 items-center justify-center text-foreground hover:bg-muted"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isAdding || isCartLoading}
        className="w-full h-12 text-base font-semibold"
      >
        {isAdding ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  );
}
