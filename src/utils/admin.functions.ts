import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CharacterSetting {
  character_id: string;
  name: string;
  tag: string;
  tagline: string;
  price_id: string | null;
  unlock_type: "open" | "trust" | "subscription" | "coming-soon";
  unlock_character: string | null;
  unlock_level: number | null;
  system_prompt: string | null;
  sort_order: number;
  enabled: boolean;
}

async function assertAdmin(context: { userId: string }) {
  const { isAdminUser } = await import("@/lib/roles.server");
  if (!(await isAdminUser(context.userId))) throw new Error("Forbidden");
}

/** Is the signed-in user an admin? Used to gate the admin UI. */
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { isAdminUser } = await import("@/lib/roles.server");
    return { isAdmin: await isAdminUser(context.userId) };
  });

/** Full character config, including private personality prompt overrides. */
export const listCharacterSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CharacterSetting[]> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("character_settings")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CharacterSetting[];
  });

/** Create or update one character's config. */
export const saveCharacterSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CharacterSetting) => {
    const id = data.character_id?.trim().toLowerCase();
    if (!id) throw new Error("Character id is required");
    if (!data.name?.trim()) throw new Error("Name is required");
    if (!["open", "trust", "subscription", "coming-soon"].includes(data.unlock_type)) {
      throw new Error("Invalid unlock rule");
    }
    return {
      ...data,
      character_id: id,
      name: data.name.trim(),
      tag: data.tag?.trim() ?? "",
      tagline: data.tagline?.trim() ?? "",
      price_id: data.price_id?.trim() || null,
      unlock_character:
        data.unlock_type === "trust" ? data.unlock_character?.trim() || null : null,
      unlock_level: data.unlock_type === "trust" ? Number(data.unlock_level) || 1 : null,
      system_prompt: data.system_prompt?.trim() || null,
      sort_order: Number(data.sort_order) || 0,
      enabled: !!data.enabled,
    };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("character_settings")
      .upsert(data as never, { onConflict: "character_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface AdminStats {
  members: number;
  plans: { priceId: string; name: string; price: string; count: number }[];
  freeMembers: number;
  cancelling: number;
  pastDue: number;
  mrr: number;
  messagesTotal: number;
  messages24h: number;
  activeChats7d: number;
  activeMembers7d: number;
  perCharacter: { characterId: string; messages: number; chatters: number }[];
}

/** Headline numbers for the house: plan mix and chat activity. */
export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PLANS } = await import("@/lib/stripe");

    const since7d = new Date(Date.now() - 7 * 864e5).toISOString();
    const since24h = new Date(Date.now() - 864e5).toISOString();

    const [membersRes, subsRes, msgTotalRes, msg24hRes, recentRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("subscriptions")
        .select("user_id, price_id, status, current_period_end, cancel_at_period_end"),
      supabaseAdmin.from("messages").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h),
      supabaseAdmin
        .from("messages")
        .select("user_id, character_id")
        .gte("created_at", since7d)
        .limit(20000),
    ]);

    const now = Date.now();
    const activeSubs = (subsRes.data ?? []).filter((s) => {
      const periodOk = !s.current_period_end || new Date(s.current_period_end).getTime() > now;
      return periodOk && ["active", "trialing", "past_due", "canceled"].includes(s.status);
    });

    const plans = Object.values(PLANS).map((p) => ({
      priceId: p.priceId,
      name: p.name,
      price: p.price,
      count: activeSubs.filter((s) => s.price_id === p.priceId).length,
    }));

    const mrr = plans.reduce(
      (sum, p) => sum + p.count * Number(p.price.replace(/[^0-9.]/g, "")),
      0,
    );

    const members = membersRes.count ?? 0;
    const payingUsers = new Set(activeSubs.map((s) => s.user_id)).size;

    const recent = recentRes.data ?? [];
    const chatKeys = new Set(recent.map((m) => `${m.user_id}:${m.character_id}`));
    const chatters = new Set(recent.map((m) => m.user_id));

    const byCharacter = new Map<string, { messages: number; chatters: Set<string> }>();
    for (const m of recent) {
      const entry = byCharacter.get(m.character_id) ?? { messages: 0, chatters: new Set<string>() };
      entry.messages += 1;
      entry.chatters.add(m.user_id);
      byCharacter.set(m.character_id, entry);
    }

    return {
      members,
      plans,
      freeMembers: Math.max(members - payingUsers, 0),
      cancelling: activeSubs.filter((s) => s.cancel_at_period_end || s.status === "canceled").length,
      pastDue: activeSubs.filter((s) => s.status === "past_due").length,
      mrr: Math.round(mrr * 100) / 100,
      messagesTotal: msgTotalRes.count ?? 0,
      messages24h: msg24hRes.count ?? 0,
      activeChats7d: chatKeys.size,
      activeMembers7d: chatters.size,
      perCharacter: [...byCharacter.entries()]
        .map(([characterId, v]) => ({
          characterId,
          messages: v.messages,
          chatters: v.chatters.size,
        }))
        .sort((a, b) => b.messages - a.messages),
    };
  });
