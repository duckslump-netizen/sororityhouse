/** Plans sold in the house, keyed by the price id used at checkout. */
export const PLANS = {
  storyline_monthly: {
    priceId: "storyline_monthly",
    name: "Storyline Challenge",
    price: "$14.99",
    tier: 1,
  },
  all_access_monthly: {
    priceId: "all_access_monthly",
    name: "All Site Access",
    price: "$19.99",
    tier: 2,
  },
  // Legacy plans kept so existing members keep the access they paid for.
  founders_monthly: {
    priceId: "founders_monthly",
    name: "Founders",
    price: "$9.99",
    tier: 1,
  },
  full_house_monthly: {
    priceId: "full_house_monthly",
    name: "Full House",
    price: "$14.99",
    tier: 2,
  },
} as const;

export type PlanPriceId = keyof typeof PLANS;

export function isPlanPrice(priceId: string | null | undefined): priceId is PlanPriceId {
  return !!priceId && priceId in PLANS;
}

/** Paid add-ons that sit alongside a plan. */
export const SUGGESTION_PRICE_ID = "suggestion_monthly";
export const TOPUP_PRICE_ID = "topup_1000";
export const SUGGESTION_PRICE = "$4.99";
export const TOPUP_PRICE = "$7";

/** Free trial size before a subscription is required. */
export const FREE_MESSAGE_LIMIT = 25;

/** Messages a paid member can send each calendar month. */
export const MONTHLY_MESSAGE_LIMIT = 2000;

/** Messages added by one top-up purchase. */
export const TOPUP_MESSAGES = 1000;

/** Free messages the referrer earns per wingman who signs up. */
export const WINGMAN_BONUS_MESSAGES = 50;

/** Safety ceiling on house-wide messages per month. */
export const HOUSE_MONTHLY_MESSAGE_CEILING = 250000;
