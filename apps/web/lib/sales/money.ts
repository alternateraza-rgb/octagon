// Prices are kept in cents. Octacore's cut of every sale and hosting payment.
export const PLATFORM_FEE = 0.1;

export const fee = (cents: number) => Math.round(cents * PLATFORM_FEE);
export const sellerShare = (cents: number) => cents - fee(cents);

// Minimums keep Whop's fee under the price, and maximums catch a misplaced zero.
export const PRICE_RANGE = { min: 100, max: 5_000_000 };
export const MONTHLY_RANGE = { min: 100, max: 100_000 };

export function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
}

// "$1,250" or "12.50" typed by a seller, in cents; null when it isn't a price.
export function parsePrice(input: unknown) {
  if (typeof input === "number") return Number.isFinite(input) ? Math.round(input * 100) : null;
  if (typeof input !== "string") return null;
  const clean = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}
