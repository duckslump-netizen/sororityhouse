import { createFileRoute, Link } from "@tanstack/react-router";
import { DoorClosed, Flame, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clowns, isOpen, unlockLabel, TOTAL_DOORS } from "@/lib/clowns";
import hallway from "@/assets/funhouse-hall.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chanceys — Can You Talk Your Way Past the Clowns?" },
      {
        name: "description",
        content:
          "Twelve doors, six psycho clowns and one rule: charm your way through or get sent back out the front gate. Start the Chanceys challenge.",
      },
      { property: "og:title", content: "Chanceys — Can You Talk Your Way Past the Clowns?" },
      {
        property: "og:description",
        content:
          "Twelve doors, six psycho clowns. Charm your way through, or get sent back out the front gate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-16 pt-20 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <img
            src={hallway}
            alt=""
            width={1536}
            height={896}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-veil" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[0.65rem] uppercase tracking-[0.45em] text-muted-foreground">
            Step right up
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            Welcome to <span className="text-gradient-neon">Chanceys</span>
          </h1>
          <p className="mt-5 text-xl text-foreground/80 md:text-2xl">
            Can you make it out, or will you crack first?
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/gallery">Meet the clowns</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Open doors */}
      <section className="px-5 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black uppercase tracking-tight">Two doors are open</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Start with the clowns who will actually let you in. Win them over and the next door
            unlatches.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {clowns.filter(isOpen).map((clown) => (
              <article
                key={clown.id}
                className="glass-card overflow-hidden rounded-3xl shadow-soft"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={clown.image}
                    alt={`${clown.name}, ${clown.tag}`}
                    width={768}
                    height={1024}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1 p-5">
                  <p className="text-[0.6rem] uppercase tracking-[0.35em] text-accent">
                    {clown.tag}
                  </p>
                  <h3 className="text-2xl font-black uppercase tracking-tight">{clown.name}</h3>
                  <p className="text-sm text-muted-foreground">{clown.line}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Locked doors */}
      <section className="px-5 pb-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-black uppercase tracking-tight">The rest stay shut</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {clowns.filter((c) => !isOpen(c)).map((clown) => (
              <article
                key={clown.id}
                className="glass-card relative overflow-hidden rounded-2xl"
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={clown.image}
                    alt=""
                    width={768}
                    height={1024}
                    loading="lazy"
                    className="h-full w-full scale-110 object-cover blur-xl brightness-50"
                  />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Lock className="h-6 w-6 text-accent" />
                  <p className="text-lg font-black uppercase tracking-tight">Door {clown.door}</p>
                  <p className="text-xs text-muted-foreground">{unlockLabel(clown.unlock)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Hallway */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-border shadow-glow">
          <div className="relative">
            <img
              src={hallway}
              alt="A dark funhouse corridor lined with doors, two of them open"
              width={1536}
              height={896}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-veil" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-center md:p-10">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/50 px-4 py-1.5 text-[0.6rem] uppercase tracking-[0.35em] text-primary">
                <Flame className="h-3.5 w-3.5" />
                Two open, ten shut
              </div>
              <p className="mx-auto max-w-2xl text-lg font-semibold md:text-2xl">
                Are you charming enough to get through every clown, or will you go to detention?
              </p>
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2 bg-card/60 p-4 md:grid-cols-12">
            {Array.from({ length: TOTAL_DOORS }, (_, i) => {
              const door = i + 1;
              const clown = clowns.find((c) => c.door === door);
              const open = clown ? isOpen(clown) : false;
              return (
                <div
                  key={door}
                  title={clown ? `${clown.name} — ${unlockLabel(clown.unlock)}` : "Coming soon"}
                  className={`flex aspect-[2/3] flex-col items-center justify-center rounded-md border text-[0.6rem] ${
                    open
                      ? "border-primary/60 bg-primary/20 text-primary"
                      : "border-border bg-background/60 text-muted-foreground"
                  }`}
                >
                  <DoorClosed className="h-4 w-4" />
                  <span className="mt-1">{door}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
