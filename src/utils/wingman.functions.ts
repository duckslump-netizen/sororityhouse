import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type WingmanStats = {
  code: string;
  signups: number;
  rewarded: number;
  bonusMessages: number;
};

/** Returns the member's invite code and how their wingmen are doing. */
export const getWingmanStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WingmanStats | { error: string }> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("referral_code")
      .eq("id", userId)
      .maybeSingle();

    let code = (profile as { referral_code?: string } | null)?.referral_code ?? "";
    if (!code) {
      code = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
      await supabaseAdmin
        .from("profiles")
        .update({ referral_code: code } as never)
        .eq("id", userId);
    }

    const { data: referrals } = await supabaseAdmin
      .from("referrals")
      .select("reward_granted")
      .eq("referrer_id", userId);

    const { data: usage } = await supabaseAdmin
      .from("message_usage")
      .select("bonus_messages")
      .eq("user_id", userId)
      .maybeSingle();

    const rows = (referrals ?? []) as { reward_granted: boolean }[];
    return {
      code,
      signups: rows.length,
      rewarded: rows.filter((r) => r.reward_granted).length,
      bonusMessages: (usage as { bonus_messages?: number } | null)?.bonus_messages ?? 0,
    };
  });

/** Links the signed-in member to whoever invited them. Runs once per account. */
export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string }) => {
    const code = data.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,16}$/.test(code)) throw new Error("Invalid code");
    return { code };
  })
  .handler(async ({ data, context }): Promise<{ claimed: boolean }> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .maybeSingle();
    if (existing) return { claimed: false };

    const { data: referrer } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", data.code)
      .maybeSingle();

    const referrerId = (referrer as { id: string } | null)?.id;
    if (!referrerId || referrerId === userId) return { claimed: false };

    await supabaseAdmin
      .from("referrals")
      .insert({ referrer_id: referrerId, referred_user_id: userId } as never);
    await supabaseAdmin
      .from("profiles")
      .update({ referred_by: referrerId } as never)
      .eq("id", userId);

    return { claimed: true };
  });
