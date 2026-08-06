import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppOrigin, getStripe, isStripeConfigured } from "@/lib/stripe/client";

export const runtime = "nodejs";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured yet." },
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

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer on this account yet. Start checkout first." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const origin = getAppOrigin();
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/app/settings`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
