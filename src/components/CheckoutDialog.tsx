import { useCallback, useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  priceId: string | null;
  onClose: () => void;
};

export function CheckoutDialog({ priceId, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const createSession = useServerFn(createCheckoutSession);

  const fetchClientSecret = useCallback(async () => {
    setError(null);
    const result = await createSession({
      data: {
        priceId: priceId as string,
        returnUrl: `${window.location.origin}/checkout/return`,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    return result.clientSecret;
  }, [priceId, createSession]);

  return (
    <Dialog open={!!priceId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Get your key to the house</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          priceId && (
            <EmbeddedCheckoutProvider
              stripe={getStripe()}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
