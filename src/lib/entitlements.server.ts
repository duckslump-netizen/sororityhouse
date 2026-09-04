import {
  FREE_MESSAGE_LIMIT,
  HOUSE_MONTHLY_MESSAGE_CEILING,
  MONTHLY_MESSAGE_LIMIT,
  monthlyLimitForPrice,
  PLANS,
  isPlanPrice,
} from "@/lib/stripe";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyClient = any;

/** Tier 2 = every door, tier 1 = storyline doors, tier 0 = free trial. */
export function tierForPrice(priceId: string | null | undefined): 1 | 2 {
  return isPlanPrice(priceId) ? (PLANS[priceId].tier as 1 | 2) : 1;
}

/** Resolves the caller's plan tier from their newest plan subscription. */
export async function resolveTier(
  supabase: AnyClient,
  userId: string,
  isAdmin: boolean,
): Promise<{ tier: 0 | 1 | 2; priceId: string | null }> {
  const { data: rows } = await supabase
    .from("subscriptions")
    .select("price_id, status, current_period_end, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const plan = (rows ?? []).find((r: { price_id: string }) => isPlanPrice(r.price_id));
  const periodOk =
    !plan?.current_period_end || new Date(plan.current_period_end) > new Date();
  const active =
    !!plan &&
    periodOk &&
    ["active", "trialing", "past_due", "canceled"].includes(plan.status);

  if (isAdmin) return { tier: 2, priceId: plan?.price_id ?? null };
  if (!active) return { tier: 0, priceId: null };
  return { tier: tierForPrice(plan.price_id), priceId: plan.price_id };
}

function monthStart(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

/**
 * Checks whether the caller may send one more message.
 * Free members get FREE_MESSAGE_LIMIT in total; paid members get
 * MONTHLY_MESSAGE_LIMIT per month plus any top-up messages they bought.
 */
export async function checkAllowance(
  supabaseAdmin: AnyClient,
  userId: string,
  tier: 0 | 1 | 2,
  isAdmin: boolean,
  priceId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (isAdmin) return { ok: true };

  const { data: usage } = await supabaseAdmin
    .from("message_usage")
    .select("messages_used, bonus_messages")
    .eq("user_id", userId)
    .maybeSingle();

  if (tier === 0) {
    if ((usage?.messages_used ?? 0) >= FREE_MESSAGE_LIMIT) {
      return {
        ok: false,
        error: `Your ${FREE_MESSAGE_LIMIT} free messages are gone. They got the last word.`,
      };
    }
    return { ok: true };
  }

  const { data: month } = await supabaseAdmin
    .from("monthly_message_usage")
    .select("messages_used")
    .eq("user_id", userId)
    .eq("period_start", monthStart())
    .maybeSingle();

  const allowed = monthlyLimitForPrice(priceId) + (usage?.bonus_messages ?? 0);
  if ((month?.messages_used ?? 0) >= allowed) {
    return {
      ok: false,
      error: `You've used all ${allowed.toLocaleString()} of this month's messages. Add 1,000 more from your account page.`,
    };
  }

  // House-wide safety ceiling so a runaway month can't blow up the bill.
  const { count } = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", `${monthStart()}T00:00:00Z`);
  if ((count ?? 0) >= HOUSE_MONTHLY_MESSAGE_CEILING * 2) {
    return { ok: false, error: "The house is at capacity this month. Try again soon." };
  }

  return { ok: true };
}

/** Records one sent message against the right allowance. */
export async function recordUsage(
  supabaseAdmin: AnyClient,
  userId: string,
  tier: 0 | 1 | 2,
): Promise<number | null> {
  if (tier === 0) {
    const { data: total } = await supabaseAdmin.rpc("increment_message_usage", {
      _user_id: userId,
    });
    return typeof total === "number" ? total : null;
  }
  await supabaseAdmin.rpc("increment_monthly_usage", { _user_id: userId });
  return null;
}
