import { useCallback, useEffect, useId, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FREE_MESSAGE_LIMIT, MONTHLY_MESSAGE_LIMIT } from "@/lib/stripe";

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

/** Free-trial and monthly counters for the signed-in member (own rows only). */
export function useMessageUsage() {
  const { user, loading: authLoading } = useAuth();
  const [used, setUsed] = useState<number | null>(null);
  const [monthlyUsed, setMonthlyUsed] = useState<number | null>(null);
  const [bonus, setBonus] = useState(0);
  const instanceId = useId();

  const load = useCallback(async () => {
    if (!user) {
      setUsed(null);
      setMonthlyUsed(null);
      setBonus(0);
      return;
    }
    const [{ data }, { data: month }] = await Promise.all([
      supabase
        .from("message_usage")
        .select("messages_used, bonus_messages")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("monthly_message_usage")
        .select("messages_used")
        .eq("user_id", user.id)
        .eq("period_start", monthStart())
        .maybeSingle(),
    ]);
    setUsed(data?.messages_used ?? 0);
    setBonus((data as { bonus_messages?: number } | null)?.bonus_messages ?? 0);
    setMonthlyUsed((month as { messages_used?: number } | null)?.messages_used ?? 0);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`message_usage:${user.id}:${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_usage",
          filter: `user_id=eq.${user.id}`,
        },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, load, instanceId]);

  const remaining =
    used === null ? null : Math.max(0, FREE_MESSAGE_LIMIT - used);
  const monthlyLimit = MONTHLY_MESSAGE_LIMIT + bonus;
  const monthlyRemaining =
    monthlyUsed === null ? null : Math.max(0, monthlyLimit - monthlyUsed);

  return {
    used,
    remaining,
    limit: FREE_MESSAGE_LIMIT,
    monthlyUsed,
    monthlyRemaining,
    monthlyLimit,
    bonus,
    refresh: load,
  };
}
