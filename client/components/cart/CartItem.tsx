"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/context/CartContext";
import type { CartItem as CartItemType } from "@/lib/types/cart";
import { useState } from "react";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateItem, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    try {
      await updateItem(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await removeItem(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-6 py-6 border-b border-border ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Image */}
      <div className="relative aspect-square w-24 sm:w-32 shrink-0 bg-muted">
        <Link href={`/products/${item.product.slug}`}>
          {item.product.image ? (
            <Image
              src={item.product.image}
              alt={item.product.imageAlt || item.product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 128px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </Link>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-4">
          <div>
            <h3 className="font-medium text-foreground">
              <Link href={`/products/${item.product.slug}`} className="hover:underline underline-offset-4">
                {item.product.name}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">SKU: {item.product.sku}</p>
          </div>
          <p className="font-medium text-foreground">${parseFloat(item.product.price).toFixed(2)}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex h-10 w-28 items-center justify-between border border-border">
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              className="flex h-full w-8 items-center justify-center text-foreground hover:bg-muted disabled:opacity-50"
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="text-sm">{item.quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              className="flex h-full w-8 items-center justify-center text-foreground hover:bg-muted"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-muted-foreground hover:text-red-500 underline underline-offset-4"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
