type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

/**
 * The publishable payment token tells us which environment this build talks to:
 * pk_test_ = test mode, pk_live_ = real money. No server round-trip needed.
 */
export function getPaymentsEnvironment(): StripeEnv | null {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  return null;
}

export function usePaymentsEnvironment() {
  return getPaymentsEnvironment();
}
