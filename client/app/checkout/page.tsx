"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/context/AuthContext";
import { useCart } from "@/lib/context/CartContext";
import { checkoutApi, ShippingAddress } from "@/lib/api/orders";
import { createPaymentOrderApi, verifyPaymentApi } from "@/lib/api/payments";
import { useRazorpay } from "@/components/checkout/RazorpayScript";
import { ApiClientError } from "@/lib/api/client";

export default function CheckoutPage() {
  const router = useRouter();
  const { accessToken, user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { cart, totalItems, subtotal, isLoading: isCartLoading, clearCart } = useCart();
  const { isLoaded: isRazorpayLoaded } = useRazorpay();

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: user ? `${user.firstName} ${user.lastName}` : "",
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    phone: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!isAuthenticated || !accessToken) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (!isRazorpayLoaded) {
      setError("Payment gateway is currently loading. Please wait a moment.");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Order
      const { order } = await checkoutApi(accessToken, formData);

      // 2. Create Razorpay Payment Order
      const paymentOrder = await createPaymentOrderApi(accessToken, order.id);

      // 3. Configure Razorpay Widget
      const options = {
        key: paymentOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Maison",
        description: `Order ${order.id}`,
        order_id: paymentOrder.razorpayOrderId,
        handler: async function (response: any) {
          try {
            // 4. Verify Payment
            await verifyPaymentApi(accessToken, {
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // 5. Clear Cart & Redirect
            await clearCart();
            router.push(`/checkout/success?orderId=${order.id}`);
          } catch (err: any) {
            setError(err.message || "Payment verification failed. Please contact support.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: user?.email,
          contact: formData.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(response.error.description || "Payment failed. Please try again.");
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      if (err instanceof ApiClientError && err.errors && err.errors.length > 0) {
        const errorsMap: Record<string, string> = {};
        err.errors.forEach((e) => {
          const parts = e.field.split(".");
          const fieldName = parts[parts.length - 1];
          errorsMap[fieldName] = e.message;
        });
        setFieldErrors(errorsMap);
        setError("Please correct the errors below.");
      } else {
        setError(err.message || "An unexpected error occurred during checkout.");
      }
      setIsProcessing(false);
    }
  };

  if (isAuthLoading || isCartLoading) {
    return (
      <div className="section-padding min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (!cart || totalItems === 0) {
    return (
      <div className="section-padding min-h-[50vh] flex flex-col items-center justify-center text-center">
        <h1 className="font-display text-3xl mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Add some items before proceeding to checkout.</p>
        <Button href="/shop">Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="section-padding bg-muted/20 min-h-screen">
      <Container size="default">
        <h1 className="font-display text-3xl font-light mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 mb-8 text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Shipping Form */}
          <div className="lg:col-span-7">
            <div className="bg-surface p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-medium mb-6">Shipping Address</h2>
              
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.fullName ? "border-red-500" : "border-border"}`}
                  />
                  {fieldErrors.fullName && <p className="text-red-500 text-sm mt-1">{fieldErrors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="streetAddress" className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    required
                    value={formData.streetAddress}
                    onChange={handleChange}
                    className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.streetAddress ? "border-red-500" : "border-border"}`}
                    placeholder="House number and street name"
                  />
                  {fieldErrors.streetAddress && <p className="text-red-500 text-sm mt-1">{fieldErrors.streetAddress}</p>}
                </div>

                <div>
                  <label htmlFor="apartment" className="block text-sm font-medium mb-2">Apartment, suite, etc. (optional)</label>
                  <input
                    type="text"
                    id="apartment"
                    name="apartment"
                    value={formData.apartment || ""}
                    onChange={handleChange}
                    className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.apartment ? "border-red-500" : "border-border"}`}
                  />
                  {fieldErrors.apartment && <p className="text-red-500 text-sm mt-1">{fieldErrors.apartment}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-2">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.city ? "border-red-500" : "border-border"}`}
                    />
                    {fieldErrors.city && <p className="text-red-500 text-sm mt-1">{fieldErrors.city}</p>}
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium mb-2">State / Province</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.state ? "border-red-500" : "border-border"}`}
                    />
                    {fieldErrors.state && <p className="text-red-500 text-sm mt-1">{fieldErrors.state}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="postalCode" className="block text-sm font-medium mb-2">Postal Code</label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      required
                      value={formData.postalCode}
                      onChange={handleChange}
                      className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.postalCode ? "border-red-500" : "border-border"}`}
                    />
                    {fieldErrors.postalCode && <p className="text-red-500 text-sm mt-1">{fieldErrors.postalCode}</p>}
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium mb-2">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.country ? "border-red-500" : "border-border"}`}
                    />
                    {fieldErrors.country && <p className="text-red-500 text-sm mt-1">{fieldErrors.country}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full border px-4 py-3 focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent ${fieldErrors.phone ? "border-red-500" : "border-border"}`}
                  />
                  {fieldErrors.phone && <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>}
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-surface p-6 md:p-8 shadow-sm sticky top-24">
              <h2 className="text-xl font-medium mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative w-16 h-20 bg-muted/30 flex-shrink-0 overflow-hidden">
                      {item.product.image && (
                        <Image
                          src={item.product.image}
                          alt={item.product.imageAlt || item.product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-sm font-medium line-clamp-1">{item.product.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium">
                      ${item.lineTotal}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Calculated at next step</span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-4 border-t border-border">
                  <span>Total</span>
                  <span>${subtotal}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="w-full h-14 mt-8 bg-foreground text-background hover:bg-foreground/80 transition-colors font-medium text-sm tracking-wide disabled:opacity-50 disabled:pointer-events-none"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
