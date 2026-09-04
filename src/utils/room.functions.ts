import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSharedPrompt } from "@/lib/personalities";
import { characters } from "@/lib/characters";

/** Room transcripts are stored in `messages` under this pseudo-character id. */
export const ROOM_ID = "house-room";

const FULL_HOUSE_ONLY = ["sasha", "piper"];

export type RoomTurn = { speaker: string; content: string };

type RoomResult =
  | { turns: RoomTurn[]; messagesUsed: number | null; limited: false }
  | { error: string; limited?: boolean };

/**
 * The shared house room: the girls the user can access are all in one
 * conversation. Each answers in her own voice, using her personality file.
 */
export const sendRoomMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { content: string }) => {
    const content = data.content.trim();
    if (!content) throw new Error("Message is empty");
    if (content.length > 2000) throw new Error("Message is too long");
    return { content };
  })
  .handler(async ({ data, context }): Promise<RoomResult> => {
    const { supabase, userId } = context;

    // Owner/admin accounts can test the room for free.
    const { isAdminUser } = await import("@/lib/roles.server");
    const isAdmin = await isAdminUser(userId);

    const { checkAllowance, recordUsage, resolveTier, tierForPrice } = await import(
      "@/lib/entitlements.server"
    );
    const { tier } = await resolveTier(supabase, userId, isAdmin === true);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: settings } = await supabaseAdmin
      .from("character_settings")
      .select("character_id, price_id, enabled")
      .eq("enabled", true);

    const enabledIds = new Set(
      (settings ?? []).map((s: { character_id: string }) => s.character_id),
    );
    const priceById = new Map(
      (settings ?? []).map((s: { character_id: string; price_id: string | null }) => [
        s.character_id,
        s.price_id,
      ]),
    );

    const present = characters.filter((c) => {
      if (settings && settings.length > 0 && !enabledIds.has(c.id)) return false;
      const priceId = priceById.get(c.id);
      const requiredTier = priceId
        ? tierForPrice(priceId)
        : FULL_HOUSE_ONLY.includes(c.id)
          ? 2
          : 1;
      return requiredTier <= Math.max(tier, 1);
    });

    if (present.length < 2) {
      return { error: "Nobody else is in the common room right now.", limited: true };
    }

    let messagesUsed: number | null = null;
    const allowance = await checkAllowance(supabaseAdmin, userId, tier, isAdmin === true);
    if (!allowance.ok) {
      return { error: allowance.error, limited: true };
    }


    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("user_id", userId)
      .eq("character_id", ROOM_ID)
      .order("created_at", { ascending: false })
      .limit(30);

    const priorTurns = (history ?? [])
      .slice()
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const roster = present.map((c) => c.name).join(", ");
    const systemPrompt = [
      buildSharedPrompt(present.map((c) => c.id)),
      `# ROOM FORMAT
Girls present: ${roster}.
The user has walked into the common room where these girls are hanging out.
Reply as one to three of them — only the ones who would actually speak up.
Put each turn on its own line, formatted exactly as "Name: what she says".
Never write a line for anyone who is not in the roster above.
Keep each turn short, like real texting between roommates. They can talk to
each other, not only to the user.`,
    ].join("\n\n---\n\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: systemPrompt },
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
      return { error: "The room went quiet. Try again." };
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = payload.choices?.[0]?.message?.content?.trim();
    if (!raw) return { error: "The room went quiet. Try again." };

    const names = new Set(present.map((c) => c.name.toLowerCase()));
    const turns: RoomTurn[] = [];
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = /^\*{0,2}([A-Za-z]+)\*{0,2}\s*:\s*(.+)$/.exec(trimmed);
      if (match && names.has(match[1]!.toLowerCase())) {
        const speaker = present.find(
          (c) => c.name.toLowerCase() === match[1]!.toLowerCase(),
        )!.name;
        turns.push({ speaker, content: match[2]!.trim() });
      } else if (turns.length > 0) {
        turns[turns.length - 1]!.content += `\n${trimmed}`;
      }
    }
    if (turns.length === 0) {
      turns.push({ speaker: present[0]!.name, content: raw });
    }

    await supabaseAdmin.from("messages").insert([
      { user_id: userId, character_id: ROOM_ID, role: "user", content: data.content },
      {
        user_id: userId,
        character_id: ROOM_ID,
        role: "assistant",
        content: turns.map((t) => `${t.speaker}: ${t.content}`).join("\n"),
      },
    ]);

    messagesUsed = await recordUsage(supabaseAdmin, userId, tier);


    return { turns, messagesUsed, limited: false };
  });
