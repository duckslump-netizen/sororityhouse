import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}


function resolvePriceId(item: any): string {
  return (
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id ||
    "unknown"
  );
}

function toIso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("Subscription without userId metadata:", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: item?.price?.product ?? "unknown",
        price_id: resolvePriceId(item),
        status: subscription.status,
        current_period_start: toIso(periodStart),
        current_period_end: toIso(periodEnd),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
}

async function markCanceled(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() } as never)
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}



/** Adds purchased top-up messages to a member's balance. */
async function grantTopUp(session: any) {
  const userId = session.metadata?.userId;
  const messages = Number(session.metadata?.topupMessages ?? 0);
  if (!userId || !messages) return;

  const db = getSupabase();
  const { data: row } = await db
    .from("message_usage")
    .select("bonus_messages")
    .eq("user_id", userId)
    .maybeSingle();

  await db.from("message_usage").upsert(
    {
      user_id: userId,
      bonus_messages: ((row as { bonus_messages?: number } | null)?.bonus_messages ?? 0) + messages,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id" },
  );
}

/** Pays the referrer their wingman reward the first time a friend subscribes. */
async function grantWingmanReward(userId: string) {
  const db = getSupabase();
  const { data: referral } = await db
    .from("referrals")
    .select("id, referrer_id, reward_granted")
    .eq("referred_user_id", userId)
    .maybeSingle();

  const ref = referral as
    | { id: string; referrer_id: string; reward_granted: boolean }
    | null;
  if (!ref || ref.reward_granted) return;

  const { WINGMAN_BONUS_MESSAGES } = await import("@/lib/stripe");
  const { data: row } = await db
    .from("message_usage")
    .select("bonus_messages")
    .eq("user_id", ref.referrer_id)
    .maybeSingle();

  await db.from("message_usage").upsert(
    {
      user_id: ref.referrer_id,
      bonus_messages:
        ((row as { bonus_messages?: number } | null)?.bonus_messages ?? 0) +
        WINGMAN_BONUS_MESSAGES,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "user_id" },
  );

  await db
    .from("referrals")
    .update({ subscribed: true, reward_granted: true } as never)
    .eq("id", ref.id);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    // Created, plan upgrades/downgrades, renewals and scheduled cancellations
    // all land here and keep the entitlement row current.
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as any;
      await upsertSubscription(subscription, env);
      if (["active", "trialing"].includes(subscription.status) && subscription.metadata?.userId) {
        await grantWingmanReward(subscription.metadata.userId);
      }
      break;
    }
    case "customer.subscription.deleted":
      await markCanceled(event.data.object, env);
      break;
    case "checkout.session.completed": {
      const session = event.data.object as any;
      if (session.payment_status !== "unpaid") await grantTopUp(session);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await grantTopUp(event.data.object);
      break;
    case "invoice.paid":
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}


export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
