import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createCheckoutSession, createPortalSession } from "@/utils/payments.functions";
import { usePaymentsEnvironment } from "@/hooks/usePaymentsEnvironment";

export function useCheckout() {
  const environment = usePaymentsEnvironment();
  const startCheckout = useServerFn(createCheckoutSession);
  const startPortal = useServerFn(createPortalSession);
  const [pending, setPending] = useState<string | null>(null);

  async function openCheckout(priceId: string) {
    if (!environment) return;
    setPending(priceId);
    try {
      const result = await startCheckout({
        data: {
          priceId,
          returnUrl: `${window.location.origin}/checkout/return`,
          environment,
        },
      });
      if ("error" in result) throw new Error(result.error);
      window.location.href = result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setPending(null);
    }
  }

  async function openBillingPortal() {
    if (!environment) return;
    setPending("portal");
    try {
      const result = await startPortal({
        data: { returnUrl: `${window.location.origin}/account`, environment },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank", "noopener");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing");
    } finally {
      setPending(null);
    }
  }

  return { openCheckout, openBillingPortal, pending, environment };
}
