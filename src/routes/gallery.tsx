import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { checkIsAdmin } from "@/utils/admin.functions";
import { characters, isOpen, unlockLabel } from "@/lib/characters";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "The House Gallery — Every Girl in the Sorority House" },
      {
        name: "description",
        content:
          "See every roommate in the sorority house in one place: Dakota, Zoe, Willow, Brittany, Sasha and Piper, with the doors that are open and the ones you still have to earn.",
      },
      { property: "og:title", content: "The House Gallery" },
      {
        property: "og:description",
        content:
          "Every roommate in the sorority house, side by side — open doors and locked ones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdminFn = useServerFn(checkIsAdmin);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsOwner(false);
      return;
    }
    let active = true;
    void isAdminFn({})
      .then((res) => {
        if (active) setIsOwner(res.isAdmin);
      })
      .catch(() => {
        if (active) setIsOwner(false);
      });
    return () => {
      active = false;
    };
  }, [user, isAdminFn]);

  return (
    <main className="min-h-screen bg-background px-5 py-16">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/"
          className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground hover:text-accent"
        >
          &larr; Back to the house
        </Link>

        <h1 className="mt-6 text-4xl font-black uppercase tracking-tight md:text-5xl">
          The house gallery
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Every girl in the house, side by side. Two doors are open from the start — the rest stay
          shut until you earn your way in.
          {isOwner ? " You're signed in as the owner, so nothing is hidden." : ""}
        </p>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => {
            const open = isOpen(c);
            const hidden = !open && !isOwner;
            return (
              <article
                key={c.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={c.img}
                    alt={`${c.name}, ${c.tag}`}
                    loading="lazy"
                    className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      hidden ? "blur-xl scale-110" : ""
                    }`}
                  />
                  {hidden && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50">
                      <Lock className="h-7 w-7 text-accent" />
                      <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent">
                        {unlockLabel(c.unlock)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-2xl">{c.name}</h2>
                  <p className="text-[0.65rem] uppercase tracking-[0.3em] text-accent">{c.tag}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.line}</p>

                  <div className="mt-5">
                    {open || isOwner ? (
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() =>
                          void navigate({
                            to: user ? "/chat/$characterId" : "/auth",
                            params: { characterId: c.id },
                          })
                        }
                      >
                        Chat with {c.name}
                      </Button>
                    ) : (
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {unlockLabel(c.unlock)}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
