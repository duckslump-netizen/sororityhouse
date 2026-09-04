import { useEffect, useState, useCallback, useId } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, isPlanPrice, type PlanPriceId } from "@/lib/stripe";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentsEnvironment } from "@/hooks/usePaymentsEnvironment";

export type SubscriptionRow = {
  price_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const environment = usePaymentsEnvironment();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const instanceId = useId();

  const load = useCallback(async () => {
    if (!user || !environment) {
      setSubscription(null);
      setLoading(!!user && !environment);
      return;
    }
    // Add-ons (suggestions, top-ups) also live here, so pick the newest
    // row that is an actual plan.
    const { data } = await supabase
      .from("subscriptions")
      .select("price_id, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(10);
    const rows = (data ?? []) as SubscriptionRow[];
    setSubscription(rows.find((r) => isPlanPrice(r.price_id)) ?? null);
    setLoading(false);
  }, [user, environment]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  // Owner/admin accounts get full access so the product can be tested for free.
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions:${user.id}:${instanceId}`)
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
  }, [user, load, instanceId]);

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
    isAdmin,
    subscription,
    loading: loading || authLoading,
    isActive: isActive || isAdmin,
    isPastDue: subscription?.status === "past_due",
    plan: isActive ? plan : null,
    /** 0 = free trial, 1 = Storyline Challenge, 2 = All Site Access. */
    tier: isAdmin ? 2 : isActive ? (plan?.tier ?? 0) : 0,
    refresh: load,
  };
}
