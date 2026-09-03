import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, type PlanPriceId } from "@/lib/stripe";
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

  const load = useCallback(async () => {
    if (!user || !environment) {
      setSubscription(null);
      setLoading(!!user && !environment);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("price_id, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
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
    isAdmin,
    subscription,
    loading: loading || authLoading,
    isActive: isActive || isAdmin,
    isPastDue: subscription?.status === "past_due",
    plan: isActive ? plan : null,
    /** 0 = free trial, 1 = Founders (first four), 2 = Full House (all six). */
    tier: isAdmin ? 2 : isActive ? (plan?.tier ?? 0) : 0,
    refresh: load,
  };
}
