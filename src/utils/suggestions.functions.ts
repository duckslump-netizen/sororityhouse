import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Suggestion = {
  id: string;
  name: string;
  vibe: string;
  visibility: string;
  status: string;
  created_at: string;
};

export type SuggestionState = {
  hasAddOn: boolean;
  freeSuggestions: number;
  mine: Suggestion[];
  shared: Suggestion[];
};

/** Everything the account page needs for the Suggest a Girl panel. */
export const getSuggestionState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SuggestionState> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { SUGGESTION_PRICE_ID } = await import("@/lib/stripe");

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("price_id, status, current_period_end")
      .eq("user_id", userId)
      .eq("price_id", SUGGESTION_PRICE_ID);

    const hasAddOn = (subs ?? []).some(
      (s: { status: string; current_period_end: string | null }) =>
        ["active", "trialing", "past_due"].includes(s.status) &&
        (!s.current_period_end || new Date(s.current_period_end) > new Date()),
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("free_suggestions")
      .eq("id", userId)
      .maybeSingle();

    const { data: mine } = await supabaseAdmin
      .from("girl_suggestions")
      .select("id, name, vibe, visibility, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: shared } = await supabaseAdmin
      .from("girl_suggestions")
      .select("id, name, vibe, visibility, status, created_at")
      .eq("visibility", "shared")
      .order("created_at", { ascending: false })
      .limit(20);

    return {
      hasAddOn,
      freeSuggestions:
        (profile as { free_suggestions?: number } | null)?.free_suggestions ?? 0,
      mine: (mine ?? []) as Suggestion[],
      shared: (shared ?? []) as Suggestion[],
    };
  });

/**
 * Records a suggested girl. Needs the add-on or a free request.
 * Sharing her with the house earns one free request back.
 */
export const submitSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { name: string; vibe: string; notes: string; visibility: string }) => {
      const name = data.name.trim();
      if (!name || name.length > 60) throw new Error("Give her a name");
      const visibility = data.visibility === "shared" ? "shared" : "private";
      return {
        name,
        vibe: data.vibe.trim().slice(0, 200),
        notes: data.notes.trim().slice(0, 1000),
        visibility,
      };
    },
  )
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { SUGGESTION_PRICE_ID } = await import("@/lib/stripe");

    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("price_id", SUGGESTION_PRICE_ID);

    const hasAddOn = (subs ?? []).some(
      (s: { status: string; current_period_end: string | null }) =>
        ["active", "trialing", "past_due"].includes(s.status) &&
        (!s.current_period_end || new Date(s.current_period_end) > new Date()),
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("free_suggestions")
      .eq("id", userId)
      .maybeSingle();
    const free = (profile as { free_suggestions?: number } | null)?.free_suggestions ?? 0;

    if (!hasAddOn && free < 1) {
      return { error: "Add Suggest a Girl to your membership to send a request." };
    }

    await supabaseAdmin.from("girl_suggestions").insert({
      user_id: userId,
      name: data.name,
      vibe: data.vibe,
      notes: data.notes,
      visibility: data.visibility,
    } as never);

    // Sharing her with the house pays for itself: one free request back.
    let nextFree = free;
    if (!hasAddOn) nextFree -= 1;
    if (data.visibility === "shared") nextFree += 1;
    if (nextFree !== free) {
      await supabaseAdmin
        .from("profiles")
        .update({ free_suggestions: Math.max(0, nextFree) } as never)
        .eq("id", userId);
    }

    return { ok: true };
  });
