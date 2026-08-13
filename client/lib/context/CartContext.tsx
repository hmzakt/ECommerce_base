"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Cart, AddToCartPayload } from "@/lib/types/cart";
import {
  getCartApi,
  addCartItemApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from "@/lib/api/cart";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  addItem: (payload: AddToCartPayload) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  subtotal: string;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch cart when auth state changes to authenticated
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && accessToken) {
      setIsLoading(true);
      getCartApi(accessToken)
        .then(setCart)
        .catch(() => setCart(null))
        .finally(() => setIsLoading(false));
    } else {
      // If logged out, clear cart state
      setCart(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, authLoading]);

  const addItem = useCallback(
    async (payload: AddToCartPayload) => {
      if (!isAuthenticated || !accessToken) {
        // TODO: Handle guest cart or redirect to login
        alert("Please log in to add items to your cart.");
        return;
      }
      const updatedCart = await addCartItemApi(
        accessToken,
        payload.productId,
        payload.quantity,
      );
      setCart(updatedCart);
    },
    [isAuthenticated, accessToken],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!isAuthenticated || !accessToken) return;
      const updatedCart = await updateCartItemApi(
        accessToken,
        itemId,
        quantity,
      );
      setCart(updatedCart);
    },
    [isAuthenticated, accessToken],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!isAuthenticated || !accessToken) return;
      const updatedCart = await removeCartItemApi(accessToken, itemId);
      setCart(updatedCart);
    },
    [isAuthenticated, accessToken],
  );

  const clearCart = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;
    const updatedCart = await clearCartApi(accessToken);
    setCart(updatedCart);
  }, [isAuthenticated, accessToken]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading: isLoading || authLoading,
      addItem,
      updateItem,
      removeItem,
      clearCart,
      totalItems: cart?.totalItems ?? 0,
      subtotal: cart?.subtotal ?? "0.00",
    }),
    [cart, isLoading, authLoading, addItem, updateItem, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
