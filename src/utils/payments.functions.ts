import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type CheckoutSessionResult = { url: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

/**
 * Decides whether the app talks to the test or live payment environment.
 * Live is only used once the live connection and its webhook secret exist.
 */
export const getPaymentsEnvironment = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ environment: StripeEnv }> => {
    const liveReady =
      !!process.env["STRIPE_LIVE_API_KEY"] &&
      !!process.env["PAYMENTS_LIVE_WEBHOOK_SECRET"] &&
      process.env["NODE_ENV"] === "production";
    return { environment: liveReady ? "live" : "sandbox" };
  },
);

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");

  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length && found.data[0]) return found.data[0].id;

  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      await stripe.customers.update(customer.id, {
        metadata: { ...customer.metadata, userId: options.userId },
      });
      return customer.id;
    }
  }

  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

/**
 * Creates a hosted checkout session for a plan. Sign-in required, so every
 * purchase is tied to a real account and can drive entitlements.
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    const { supabase, userId } = context;

    // A member who already subscribes changes plans in the portal, not here.
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      existing &&
      ["active", "trialing", "past_due"].includes(existing.status) &&
      (!existing.current_period_end ||
        new Date(existing.current_period_end) > new Date())
    ) {
      return {
        error: "You already have an active plan. Use Manage billing to change it.",
      };
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const stripe = createStripeClient(data.environment);

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Price not found");

      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email ?? undefined,
        userId,
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: "subscription",
        success_url: `${data.returnUrl}?status=success`,
        cancel_url: `${data.returnUrl}?status=cancelled`,
        customer: customerId,
        metadata: { userId },
        subscription_data: { metadata: { userId } },
      });

      if (!session.url) throw new Error("Checkout session has no URL");
      return { url: session.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Opens the billing portal where members change plan, update cards, or cancel.
 * Upgrades apply immediately (prorated); downgrades and cancellations take
 * effect at the end of the paid period.
 */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return { error: "No subscription found for this account yet." };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
