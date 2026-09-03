import { useEffect, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search["status"] === "string" ? (search["status"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Checkout complete — Sorority House" },
      {
        name: "description",
        content: "Confirmation page after joining the sorority house membership.",
      },
      { property: "og:title", content: "Checkout complete — Sorority House" },
      { property: "og:description", content: "Your membership confirmation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { status } = useSearch({ from: "/checkout/return" });
  const { isActive, refresh } = useSubscription();
  const [waited, setWaited] = useState(false);

  // The webhook writes the membership row moments after payment, so poll briefly.
  useEffect(() => {
    if (status !== "success") return;
    const interval = setInterval(() => void refresh(), 1500);
    const timer = setTimeout(() => {
      clearInterval(interval);
      setWaited(true);
    }, 12000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [status, refresh]);

  const cancelled = status === "cancelled";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-black tracking-tight">
          {cancelled
            ? "Checkout cancelled"
            : isActive
              ? "You're in."
              : waited
                ? "Almost there"
                : "Confirming your payment…"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {cancelled
            ? "No charge was made. The door is still there when you're ready."
            : isActive
              ? "Your doors are unlocked. Good luck getting through them."
              : waited
                ? "Payment received. Your membership will appear on your account page shortly."
                : "Hold on while we hand you your key."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link to="/account">Go to my account</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/">Back to the house</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
