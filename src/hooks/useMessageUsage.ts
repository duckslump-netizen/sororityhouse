import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FREE_MESSAGE_LIMIT } from "@/lib/stripe";

/** Free-trial counter for the signed-in member (own row only, via RLS). */
export function useMessageUsage() {
  const { user, loading: authLoading } = useAuth();
  const [used, setUsed] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setUsed(null);
      return;
    }
    const { data } = await supabase
      .from("message_usage")
      .select("messages_used")
      .eq("user_id", user.id)
      .maybeSingle();
    setUsed(data?.messages_used ?? 0);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void load();
  }, [authLoading, load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`message_usage:${user.id}`)
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
  }, [user, load]);

  const remaining =
    used === null ? null : Math.max(0, FREE_MESSAGE_LIMIT - used);

  return { used, remaining, limit: FREE_MESSAGE_LIMIT, refresh: load };
}
