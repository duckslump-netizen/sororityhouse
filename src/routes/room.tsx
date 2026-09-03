import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { characters } from "@/lib/characters";
import { FREE_MESSAGE_LIMIT } from "@/lib/stripe";
import { sendRoomMessage, ROOM_ID, type RoomTurn } from "@/utils/room.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/room")({
  ssr: false,
  head: () => {
    const title = "The common room — Sorority House";
    const description =
      "Walk into the common room and talk to the whole house at once. Every girl answers in her own voice.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: RoomPage,
});

type Entry =
  | { id: string; kind: "user"; content: string }
  | { id: string; kind: "girl"; speaker: string; content: string };

function parseAssistant(id: string, content: string): Entry[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => {
      const idx = line.indexOf(":");
      const speaker = idx > 0 ? line.slice(0, idx).trim() : "";
      const known = characters.find((c) => c.name === speaker);
      return {
        id: `${id}-${i}`,
        kind: "girl" as const,
        speaker: known?.name ?? characters[0]!.name,
        content: known ? line.slice(idx + 1).trim() : line,
      };
    });
}

function RoomPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isActive } = useSubscription();
  const send = useServerFn(sendRoomMessage);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [used, setUsed] = useState<number | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const [{ data: history }, { data: usage }] = await Promise.all([
        supabase
          .from("messages")
          .select("id, role, content")
          .eq("user_id", user.id)
          .eq("character_id", ROOM_ID)
          .order("created_at", { ascending: true }),
        supabase
          .from("message_usage")
          .select("messages_used")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      const restored: Entry[] = [];
      for (const row of history ?? []) {
        if (row.role === "user") {
          restored.push({ id: row.id, kind: "user", content: row.content });
        } else {
          restored.push(...parseAssistant(row.id, row.content));
        }
      }
      setEntries(restored);
      setUsed(usage?.messages_used ?? 0);
    })();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, sending]);

  useEffect(() => {
    if (!sending) inputRef.current?.focus();
  }, [sending]);

  const remaining =
    isActive || used === null ? null : Math.max(0, FREE_MESSAGE_LIMIT - used);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    setSending(true);
    setEntries((m) => [...m, { id: `local-${Date.now()}`, kind: "user", content }]);
    try {
      const result = await send({ data: { content } });
      if ("error" in result) {
        if (result.limited) setBlocked(result.error);
        else toast.error(result.error);
        return;
      }
      const stamp = Date.now();
      setEntries((m) => [
        ...m,
        ...result.turns.map((t: RoomTurn, i: number) => ({
          id: `local-${stamp}-${i}`,
          kind: "girl" as const,
          speaker: t.speaker,
          content: t.content,
        })),
      ]);
      if (typeof result.messagesUsed === "number") setUsed(result.messagesUsed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The room went quiet.");
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) return null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6">
      <header className="flex items-center gap-4 border-b border-border/60 pb-4">
        <div className="flex -space-x-3">
          {characters.slice(0, 4).map((c) => (
            <img
              key={c.id}
              src={c.img}
              alt={`Portrait of ${c.name}`}
              width={80}
              height={80}
              className="h-10 w-10 rounded-full border border-border/60 object-cover"
            />
          ))}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight">The common room</h1>
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-accent">
            Everyone's listening
          </p>
        </div>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          The house
        </Link>
      </header>

      {remaining !== null && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {remaining} of {FREE_MESSAGE_LIMIT} free messages left across the house.
        </p>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto py-6">
        {entries.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            You just walked in. Everyone looks up.
          </p>
        )}
        {entries.map((e) =>
          e.kind === "user" ? (
            <div
              key={e.id}
              className="ml-auto max-w-[80%] rounded-2xl bg-primary/20 px-4 py-3 text-sm leading-relaxed text-foreground"
            >
              {e.content}
            </div>
          ) : (
            <div key={e.id} className="mr-auto flex max-w-[85%] gap-3">
              <img
                src={characters.find((c) => c.name === e.speaker)?.img}
                alt={`Portrait of ${e.speaker}`}
                width={64}
                height={64}
                className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover"
              />
              <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
                <p className="text-[0.6rem] uppercase tracking-[0.25em] text-accent">
                  {e.speaker}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{e.content}</p>
              </div>
            </div>
          ),
        )}
        {sending && <p className="mr-auto text-xs text-muted-foreground">The room stirs…</p>}
        <div ref={bottomRef} />
      </div>

      {blocked ? (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 text-center">
          <p className="text-sm text-muted-foreground">{blocked}</p>
          <Button className="mt-4" onClick={() => void navigate({ to: "/account" })}>
            See plans
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2 border-t border-border/60 pt-4">
          <input
            ref={inputRef}
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            placeholder="Say something to the room…"
            maxLength={2000}
            className="flex-1 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <Button type="submit" disabled={sending || !draft.trim()}>
            Send
          </Button>
        </form>
      )}
    </main>
  );
}
