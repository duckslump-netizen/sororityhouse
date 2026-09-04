import { useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/stripe";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your account — Sorority House" },
      {
        name: "description",
        content:
          "Manage your sorority house membership: plan, billing, renewal date and which doors are unlocked.",
      },
      { property: "og:title", content: "Your account — Sorority House" },
      {
        property: "og:description",
        content: "Manage your membership, billing and unlocked doors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { subscription, plan, isActive, isPastDue, tier, loading: subLoading } =
    useSubscription();
  const { openCheckout, openBillingPortal, pending } = useCheckout();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const renews = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Your key</h1>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to the house
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>

      <section className="mt-8 rounded-2xl border border-border/60 bg-card/60 p-6">
        {subLoading ? (
          <p className="text-sm text-muted-foreground">Checking your membership…</p>
        ) : isActive && plan ? (
          <>
            <h2 className="text-xl font-bold">{plan.name} — {plan.price}/mo</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tier >= 2
                ? "All six doors unlocked, shared house conversations included."
                : "Unlimited chat with Dakota, Zoe, Willow and Brittany."}
            </p>
            {isPastDue && (
              <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                Your last payment failed. Update your card to keep your access.
              </p>
            )}
            {subscription?.cancel_at_period_end && renews && (
              <p className="mt-3 text-sm text-muted-foreground">
                Cancelled — your access stays open until {renews}.
              </p>
            )}
            {!subscription?.cancel_at_period_end && renews && (
              <p className="mt-3 text-sm text-muted-foreground">Renews {renews}.</p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={openBillingPortal} disabled={pending === "portal"}>
                {pending === "portal" ? "Opening…" : "Manage billing"}
              </Button>
              {tier < 2 && (
                <Button
                  variant="secondary"
                  onClick={openBillingPortal}
                  disabled={pending === "portal"}
                >
                  Upgrade to Full House
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Free trial</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              50 messages. They get the last word.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={() => openCheckout(PLANS.founders_monthly.priceId)}
                disabled={!!pending}
              >
                Founders — $9.99/mo
              </Button>
              <Button
                variant="secondary"
                onClick={() => openCheckout(PLANS.full_house_monthly.priceId)}
                disabled={!!pending}
              >
                Full House — $14.99/mo
              </Button>
            </div>
          </>
        )}
      </section>

      <button
        type="button"
        onClick={() => void signOut().then(() => navigate({ to: "/" }))}
        className="mt-8 text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Sign out
      </button>
    </main>
  );
}
