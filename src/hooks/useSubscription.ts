import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, PLANS, type PlanPriceId } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionRow = {
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    let env: "sandbox" | "live";
    try {
      env = getStripeEnvironment();
    } catch {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("price_id, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load]);

  const periodActive =
    !subscription?.current_period_end ||
    new Date(subscription.current_period_end) > new Date();

  const isActive =
    !!subscription &&
    periodActive &&
    ["active", "trialing", "past_due", "canceled"].includes(subscription.status) &&
    (subscription.status !== "canceled" || !!subscription.current_period_end);

  const plan =
    subscription && subscription.price_id in PLANS
      ? PLANS[subscription.price_id as PlanPriceId]
      : null;

  return {
    subscription,
    loading: loading || authLoading,
    isActive,
    isPastDue: subscription?.status === "past_due",
    plan: isActive ? plan : null,
    tier: isActive ? (plan?.tier ?? 0) : 0,
    refresh: load,
  };
}
