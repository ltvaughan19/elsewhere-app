import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { customerIdFromStripe } from "@/lib/stripe/customers";
import {
  applySubscriptionToProfile,
  findUserIdByStripeCustomer,
  markSeriousMovePurchased,
  resolveCheckoutProductFromSession,
} from "@/lib/stripe/entitlements";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.supabase_user_id ||
          session.client_reference_id ||
          null;
        if (!userId) break;

        const customerId = customerIdFromStripe(session.customer);
        const product = resolveCheckoutProductFromSession(session);

        if (product === "serious_move") {
          await markSeriousMovePurchased(userId, customerId ?? undefined);
          break;
        }

        if (product === "explorer" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          if (customerId) {
            await applySubscriptionToProfile(userId, subscription, customerId);
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = customerIdFromStripe(subscription.customer);
        if (!customerId) break;

        const userId =
          subscription.metadata?.supabase_user_id ||
          (await findUserIdByStripeCustomer(customerId));
        if (!userId) break;

        await applySubscriptionToProfile(userId, subscription, customerId);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
