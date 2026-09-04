import { Link } from "@tanstack/react-router";
import { useSubscription } from "@/hooks/useSubscription";
import { useMessageUsage } from "@/hooks/useMessageUsage";
import { usePaymentsEnvironment } from "@/hooks/usePaymentsEnvironment";

/**
 * Site-wide membership strip: dunning notice when a renewal fails, the
 * remaining free-message count while on the trial, and a clear test-mode
 * marker so a sandbox purchase is never mistaken for a real one.
 */
export function MembershipBanner() {
  const { isActive, isPastDue, plan, loading } = useSubscription();
  const { remaining, monthlyRemaining } = useMessageUsage();
  const environment = usePaymentsEnvironment();

  if (loading) return null;

  const testMode = environment === "sandbox";
  const showTrial = !isActive && remaining !== null;

  if (!isPastDue && !showTrial && !testMode) return null;

  return (
    <div className="w-full border-b border-border/60 bg-card/80 text-xs backdrop-blur">
      {isPastDue && (
        <div className="bg-destructive/15 px-4 py-2 text-center text-destructive-foreground">
          Your last payment failed — you still have access while we retry.{" "}
          <Link to="/account" className="font-bold underline underline-offset-2">
            Update your card
          </Link>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-muted-foreground">
        {showTrial && (
          <span>
            <span className="font-bold text-foreground">{remaining}</span> free
            messages left.{" "}
            <Link to="/account" className="font-bold text-primary underline underline-offset-2">
              Get your key
            </Link>
          </span>
        )}
        {isActive && plan && (
          <span>
            {plan.name} member — {plan.price}/mo
            {monthlyRemaining !== null && (
              <>
                {" · "}
                <span className="font-bold text-foreground">
                  {monthlyRemaining.toLocaleString()}
                </span>{" "}
                messages left this month
              </>
            )}
          </span>
        )}
        {testMode && (
          <span className="rounded border border-primary/50 px-1.5 py-0.5 uppercase tracking-wide text-primary">
            Test mode — no real charges
          </span>
        )}
      </div>
    </div>
  );
}
