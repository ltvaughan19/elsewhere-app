import "server-only";

import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, {
      apiVersion: "2026-07-29.dahlia",
      typescript: true,
    });
  }
  return stripeSingleton;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_EXPLORER &&
      process.env.STRIPE_PRICE_SERIOUS_MOVE,
  );
}

export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export type CheckoutProduct = "explorer" | "serious_move";

export function priceIdForProduct(product: CheckoutProduct): string {
  const priceId =
    product === "explorer"
      ? process.env.STRIPE_PRICE_EXPLORER
      : process.env.STRIPE_PRICE_SERIOUS_MOVE;
  if (!priceId) {
    throw new Error(
      product === "explorer"
        ? "Missing STRIPE_PRICE_EXPLORER"
        : "Missing STRIPE_PRICE_SERIOUS_MOVE",
    );
  }
  return priceId;
}
