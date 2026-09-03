import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildCharacterPrompt } from "@/lib/personalities";
import { characters } from "@/lib/characters";
import { FREE_MESSAGE_LIMIT } from "@/lib/stripe";

type SendResult =
  | { reply: string; messagesUsed: number | null; limited: false }
  | { error: string; limited?: boolean };

const FULL_HOUSE_ONLY = ["sasha", "piper"];

/**
 * Sends one message to a girl and returns her reply.
 *
 * Gating rules:
 *  - Free trial: FREE_MESSAGE_LIMIT messages total across the house.
 *  - Founders: unlimited chat with the first four girls.
 *  - Full House: unlimited chat with everyone.
 */
export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { characterId: string; content: string }) => {
    if (!characters.some((c) => c.id === data.characterId)) {
      throw new Error("Unknown character");
    }
    const content = data.content.trim();
    if (!content) throw new Error("Message is empty");
    if (content.length > 2000) throw new Error("Message is too long");
    return { characterId: data.characterId, content };
  })
  .handler(async ({ data, context }): Promise<SendResult> => {
    const { supabase, userId } = context;

    // Current entitlement decides both the door and the message allowance.
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("price_id, status, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const periodOk =
      !sub?.current_period_end || new Date(sub.current_period_end) > new Date();
    const active =
      !!sub &&
      periodOk &&
      ["active", "trialing", "past_due", "canceled"].includes(sub.status);
    const tier = active ? (sub?.price_id === "full_house_monthly" ? 2 : 1) : 0;

    if (FULL_HOUSE_ONLY.includes(data.characterId) && tier < 2) {
      return {
        error: "Her door is part of Full House. Upgrade to knock.",
        limited: true,
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let messagesUsed: number | null = null;
    if (tier === 0) {
      const { data: usage } = await supabaseAdmin
        .from("message_usage")
        .select("messages_used")
        .eq("user_id", userId)
        .maybeSingle();
      if ((usage?.messages_used ?? 0) >= FREE_MESSAGE_LIMIT) {
        return {
          error: "Your 100 free messages are gone. They got the last word.",
          limited: true,
        };
      }
    }

    // Recent history keeps her memory of the conversation intact.
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("character_id", data.characterId)
      .order("created_at", { ascending: false })
      .limit(30);

    const priorTurns = (history ?? [])
      .slice()
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildCharacterPrompt(data.characterId) },
          ...priorTurns,
          { role: "user", content: data.content },
        ],
      }),
    });

    if (response.status === 429) {
      return { error: "The house is busy right now. Try again in a moment." };
    }
    if (response.status === 402) {
      return { error: "AI credits are exhausted. Top up to keep chatting." };
    }
    if (!response.ok) {
      console.error("AI gateway error", response.status, await response.text());
      return { error: "She didn't answer. Try again." };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = payload.choices?.[0]?.message?.content?.trim();
    if (!reply) return { error: "She didn't answer. Try again." };

    await supabaseAdmin.from("messages").insert([
      { user_id: userId, character_id: data.characterId, role: "user", content: data.content },
      { user_id: userId, character_id: data.characterId, role: "assistant", content: reply },
    ]);

    if (tier === 0) {
      const { data: total } = await supabaseAdmin.rpc("increment_message_usage", {
        _user_id: userId,
      });
      messagesUsed = typeof total === "number" ? total : null;
    }

    return { reply, messagesUsed, limited: false };
  });
