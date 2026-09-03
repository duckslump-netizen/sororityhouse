/** Plans sold in the house, keyed by the price id used at checkout. */
export const PLANS = {
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

/** Free trial size before a subscription is required. */
export const FREE_MESSAGE_LIMIT = 100;
