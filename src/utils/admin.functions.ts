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

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

/** Is the signed-in user an admin? Used to gate the admin UI. */
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ isAdmin: boolean }> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: data === true };
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
