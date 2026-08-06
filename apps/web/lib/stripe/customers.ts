import "server-only";

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/client";

export async function getOrCreateStripeCustomer(input: {
  userId: string;
  email: string | null;
}): Promise<{ customerId: string }> {
  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", input.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load profile for Stripe customer: ${error.message}`);
  }

  if (profile?.stripe_customer_id) {
    return { customerId: profile.stripe_customer_id };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: input.email ?? profile?.email ?? undefined,
    metadata: { supabase_user_id: input.userId },
  });

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId);

  if (updateError) {
    throw new Error(`Could not save Stripe customer id: ${updateError.message}`);
  }

  return { customerId: customer.id };
}

export function customerIdFromStripe(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if ("deleted" in customer && customer.deleted) return null;
  return customer.id;
}
