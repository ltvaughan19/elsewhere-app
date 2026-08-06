import "server-only";

import type { PlanTier } from "@expat-atlas/types";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceIdForProduct } from "@/lib/stripe/client";

export type ProfileEntitlementPatch = {
  plan_tier?: PlanTier;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  serious_move_purchased_at?: string | null;
  updated_at?: string;
};

export async function patchProfileEntitlements(
  userId: string,
  patch: ProfileEntitlementPatch,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      ...patch,
      updated_at: patch.updated_at ?? new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) {
    throw new Error(`Failed to update profile entitlements: ${error.message}`);
  }
}

export async function findUserIdByStripeCustomer(
  customerId: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to look up Stripe customer: ${error.message}`);
  }
  return data?.id ?? null;
}

function subscriptionIsActive(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

export function subscriptionMapsToExplorer(
  subscription: Stripe.Subscription,
): boolean {
  const explorerPrice = process.env.STRIPE_PRICE_EXPLORER;
  if (!explorerPrice) return false;
  return subscription.items.data.some(
    (item) => item.price?.id === explorerPrice,
  );
}

export async function applySubscriptionToProfile(
  userId: string,
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<void> {
  const isExplorer =
    subscriptionMapsToExplorer(subscription) &&
    subscriptionIsActive(subscription.status);

  await patchProfileEntitlements(userId, {
    plan_tier: isExplorer ? "explorer" : "free",
    stripe_customer_id: customerId,
    stripe_subscription_id: isExplorer ? subscription.id : null,
  });
}

export async function markSeriousMovePurchased(
  userId: string,
  customerId?: string,
): Promise<void> {
  await patchProfileEntitlements(userId, {
    serious_move_purchased_at: new Date().toISOString(),
    ...(customerId ? { stripe_customer_id: customerId } : {}),
  });
}

export function resolveCheckoutProductFromSession(
  session: Stripe.Checkout.Session,
): "explorer" | "serious_move" | null {
  const fromMeta = session.metadata?.product;
  if (fromMeta === "explorer" || fromMeta === "serious_move") return fromMeta;

  if (session.mode === "subscription") return "explorer";
  if (session.mode === "payment") {
    try {
      const seriousPrice = priceIdForProduct("serious_move");
      const linePrice =
        typeof session.line_items?.data?.[0]?.price === "object"
          ? session.line_items.data[0].price?.id
          : undefined;
      if (linePrice === seriousPrice) return "serious_move";
    } catch {
      /* env may be unset in tests */
    }
    return "serious_move";
  }
  return null;
}
