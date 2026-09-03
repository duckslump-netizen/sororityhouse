import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Payments are not configured for this build. Complete go-live in your Lovable project to enable production checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}

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
