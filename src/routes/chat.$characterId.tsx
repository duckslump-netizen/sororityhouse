import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { characters } from "@/lib/characters";
import { FREE_MESSAGE_LIMIT } from "@/lib/stripe";
import { sendChatMessage } from "@/utils/chat.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/chat/$characterId")({
  ssr: false,
  beforeLoad: ({ params }) => {
    if (!characters.some((c) => c.id === params.characterId)) throw notFound();
  },
  head: ({ params }) => {
    const girl = characters.find((c) => c.id === params.characterId);
    const name = girl?.name ?? "the house";
    const title = `Chat with ${name} — Sorority House`;
    const description = girl
      ? `${name} — ${girl.tag}. See how far honesty actually gets you.`
      : "Chat with the sorority house.";
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
  component: ChatPage,
});

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function ChatPage() {
  const { characterId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { tier, isActive } = useSubscription();
  const send = useServerFn(sendChatMessage);

  const girl = characters.find((c) => c.id === characterId)!;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [used, setUsed] = useState<number | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
          .eq("character_id", characterId)
          .order("created_at", { ascending: true }),
        supabase
          .from("message_usage")
          .select("messages_used")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setMessages((history ?? []) as ChatMessage[]);
      setUsed(usage?.messages_used ?? 0);
    })();
  }, [user, characterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const remaining =
    isActive || used === null ? null : Math.max(0, FREE_MESSAGE_LIMIT - used);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setDraft("");
    setSending(true);
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: "user", content }]);
    try {
      const result = await send({ data: { characterId, content } });
      if ("error" in result) {
        if (result.limited) setBlocked(result.error);
        else toast.error(result.error);
        return;
      }
      setMessages((m) => [
        ...m,
        { id: `local-${Date.now()}-a`, role: "assistant", content: result.reply },
      ]);
      if (typeof result.messagesUsed === "number") setUsed(result.messagesUsed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "She didn't answer.");
    } finally {
      setSending(false);
    }
  }

  if (loading || !user) return null;

  const lockedByPlan = ["sasha", "piper"].includes(characterId) && tier < 2;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6">
      <header className="flex items-center gap-4 border-b border-border/60 pb-4">
        <img
          src={girl.img}
          alt={`Portrait of ${girl.name}`}
          width={96}
          height={96}
          className="h-14 w-14 rounded-full object-cover"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tight">{girl.name}</h1>
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-accent">{girl.tag}</p>
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
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            The door's open. Say something real.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-primary/20 text-foreground"
                : "mr-auto border border-border/60 bg-card/60"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <p className="mr-auto text-xs text-muted-foreground">{girl.name} is typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      {blocked || lockedByPlan ? (
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            {blocked ?? "Her door is part of Full House."}
          </p>
          <Button className="mt-4" onClick={() => void navigate({ to: "/account" })}>
            See plans
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2 border-t border-border/60 pt-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${girl.name}…`}
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
