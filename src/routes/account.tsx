import { useCallback, useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import { useMessageUsage } from "@/hooks/useMessageUsage";
import { Button } from "@/components/ui/button";
import {
  PLANS,
  FREE_MESSAGE_LIMIT,
  SUGGESTION_PRICE,
  SUGGESTION_PRICE_ID,
  TOPUP_PRICE,
  TOPUP_PRICE_ID,
} from "@/lib/stripe";
import { getWingmanStats, claimReferral, type WingmanStats } from "@/utils/wingman.functions";
import {
  getSuggestionState,
  submitSuggestion,
  type SuggestionState,
} from "@/utils/suggestions.functions";

export const Route = createFileRoute("/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your account — Sorority House" },
      {
        name: "description",
        content:
          "Manage your sorority house membership: plan, messages, top-ups, invite rewards and the girls you've suggested.",
      },
      { property: "og:title", content: "Your account — Sorority House" },
      {
        property: "og:description",
        content: "Manage your membership, messages, invite rewards and suggestions.",
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
  const { remaining, monthlyRemaining, monthlyLimit, bonus } = useMessageUsage();

  const loadStats = useServerFn(getWingmanStats);
  const claim = useServerFn(claimReferral);
  const loadSuggestions = useServerFn(getSuggestionState);
  const sendSuggestion = useServerFn(submitSuggestion);

  const [wingman, setWingman] = useState<WingmanStats | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionState | null>(null);
  const [form, setForm] = useState({ name: "", vibe: "", notes: "", visibility: "private" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const refreshSuggestions = useCallback(async () => {
    const state = await loadSuggestions({ data: undefined });
    setSuggestions(state);
  }, [loadSuggestions]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      // A code saved when they arrived from a friend's link is claimed once.
      const stored = window.localStorage.getItem("wingman_code");
      if (stored) {
        try {
          await claim({ data: { code: stored } });
        } catch {
          /* invalid code — ignore */
        }
        window.localStorage.removeItem("wingman_code");
      }
      const stats = await loadStats({ data: undefined });
      if (!("error" in stats)) setWingman(stats);
      await refreshSuggestions();
    })();
  }, [user, claim, loadStats, refreshSuggestions]);

  if (loading || !user) return null;

  const renews = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString()
    : null;

  const inviteLink = wingman
    ? `${window.location.origin}/?ref=${wingman.code}`
    : "";

  async function suggest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || sending) return;
    setSending(true);
    try {
      const result = await sendSuggestion({ data: form });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("She's on the list.");
      setForm({ name: "", vibe: "", notes: "", visibility: "private" });
      await refreshSuggestions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send that.");
    } finally {
      setSending(false);
    }
  }

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
            <h2 className="text-xl font-bold">
              {plan.name} — {plan.price}/mo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {tier >= 2
                ? "Every door open, shared house conversations included."
                : "Work your way through the challenge, one door at a time."}
            </p>
            {monthlyRemaining !== null && (
              <p className="mt-2 text-sm text-muted-foreground">
                {monthlyRemaining.toLocaleString()} of {monthlyLimit.toLocaleString()}{" "}
                messages left this month
                {bonus > 0 ? ` (includes ${bonus.toLocaleString()} bonus)` : ""}.
              </p>
            )}
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
                  Upgrade to All Site Access
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => openCheckout(TOPUP_PRICE_ID)}
                disabled={!!pending}
              >
                Add 1,000 messages — {TOPUP_PRICE}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold">Free trial</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {remaining ?? FREE_MESSAGE_LIMIT} messages left. They get the last word.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                onClick={() => openCheckout(PLANS.storyline_monthly.priceId)}
                disabled={!!pending}
              >
                Storyline Challenge — $14.99/mo
              </Button>
              <Button
                variant="secondary"
                onClick={() => openCheckout(PLANS.all_access_monthly.priceId)}
                disabled={!!pending}
              >
                All Site Access — $19.99/mo
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-6">
        <h2 className="text-xl font-bold">Bring a wingman, not a woman</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Every friend who signs up with your link earns you 50 bonus messages.
        </p>
        {wingman ? (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <code className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {inviteLink}
              </code>
              <Button
                variant="secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteLink);
                  toast.success("Invite link copied.");
                }}
              >
                Copy link
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {wingman.signups} signed up · {wingman.rewarded} rewarded ·{" "}
              {wingman.bonusMessages.toLocaleString()} bonus messages earned.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Loading your invite link…</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card/60 p-6">
        <h2 className="text-xl font-bold">Suggest a girl</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {suggestions?.hasAddOn
            ? "Your suggestion add-on is active — send a girl our way."
            : `Add suggestions for ${SUGGESTION_PRICE}/mo. Share a girl with the house and you earn a free request.`}
          {suggestions && suggestions.freeSuggestions > 0
            ? ` You have ${suggestions.freeSuggestions} free request${suggestions.freeSuggestions === 1 ? "" : "s"}.`
            : ""}
        </p>

        {!suggestions?.hasAddOn && (
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => openCheckout(SUGGESTION_PRICE_ID)}
            disabled={!!pending}
          >
            Add suggestions — {SUGGESTION_PRICE}/mo
          </Button>
        )}

        <form onSubmit={suggest} className="mt-5 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Her name"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.vibe}
            onChange={(e) => setForm({ ...form, vibe: e.target.value })}
            placeholder="Her vibe in a few words"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Anything else we should know about her"
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                checked={form.visibility === "private"}
                onChange={() => setForm({ ...form, visibility: "private" })}
              />
              Keep her private
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                checked={form.visibility === "shared"}
                onChange={() => setForm({ ...form, visibility: "shared" })}
              />
              Share her with the house (earns a free request)
            </label>
          </div>
          <Button type="submit" disabled={sending || !form.name.trim()}>
            {sending ? "Sending…" : "Send suggestion"}
          </Button>
        </form>

        {suggestions && suggestions.mine.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Your suggestions
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {suggestions.mine.map((s) => (
                <li key={s.id}>
                  {s.name} — {s.visibility === "shared" ? "shared" : "private"} · {s.status}
                </li>
              ))}
            </ul>
          </div>
        )}

        {suggestions && suggestions.shared.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Shared with the house
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {suggestions.shared.map((s) => (
                <li key={s.id}>
                  {s.name}
                  {s.vibe ? ` — ${s.vibe}` : ""}
                </li>
              ))}
            </ul>
          </div>
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
