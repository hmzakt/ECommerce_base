export function formatPrice(
  amount: number | string,
  currency = "INR",
  locale = "en-IN",
): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateDiscount(
  price: number,
  compareAtPrice?: number | null,
): number | null {
  if (!compareAtPrice || compareAtPrice <= price) {
    return null;
  }

  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
