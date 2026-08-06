import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAppOrigin,
  getStripe,
  isStripeConfigured,
  priceIdForProduct,
  type CheckoutProduct,
} from "@/lib/stripe/client";
import { getOrCreateStripeCustomer } from "@/lib/stripe/customers";

export const runtime = "nodejs";

function parseProduct(value: unknown): CheckoutProduct | null {
  return value === "explorer" || value === "serious_move" ? value : null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet. Add price and secret env vars." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: { product?: string } = {};
  try {
    body = (await request.json()) as { product?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const product = parseProduct(body.product);
  if (!product) {
    return NextResponse.json(
      { error: "product must be explorer or serious_move." },
      { status: 400 },
    );
  }

  try {
    const { customerId } = await getOrCreateStripeCustomer({
      userId: user.id,
      email: user.email ?? null,
    });
    const stripe = getStripe();
    const origin = getAppOrigin();
    const priceId = priceIdForProduct(product);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: product === "explorer" ? "subscription" : "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/app/settings?checkout=success&product=${product}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        product,
      },
      ...(product === "explorer"
        ? {
            subscription_data: {
              metadata: {
                supabase_user_id: user.id,
                product: "explorer",
              },
            },
          }
        : {
            payment_intent_data: {
              metadata: {
                supabase_user_id: user.id,
                product: "serious_move",
              },
            },
          }),
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout session failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
