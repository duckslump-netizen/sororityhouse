import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Lock, DoorClosed } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout } from "@/hooks/useCheckout";
import {
  PLANS,
  FREE_MESSAGE_LIMIT,
  SUGGESTION_PRICE,
  TOPUP_PRICE,
} from "@/lib/stripe";
import heroLoft from "@/assets/hero-loft.jpg";
import hallway from "@/assets/hallway.jpg";
import houseGroup from "@/assets/house-group.jpg";
import {
  characters as roommates,
  reservedDoors,
  TOTAL_DOORS,
  isOpen,
  unlockLabel,
} from "@/lib/characters";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome to the Sorority House — Can You Survive or Thrive?" },
      {
        name: "description",
        content:
          "Ten doors, two open. Chat free for 25 messages and see if you're charming enough to get through Dakota, Zoe and the girls behind the locked doors.",
      },
      { property: "og:title", content: "Welcome to the Sorority House" },
      {
        property: "og:description",
        content:
          "Can you survive or will you thrive? 25 free messages, then subscribe to keep talking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});







const steps = [
  { n: "01", t: "Pick a roommate", d: "Four personalities, four very different sets of walls." },
  { n: "02", t: "Start talking", d: "Your first 25 messages are free. No card, no catch." },
  { n: "03", t: "Get past the guard", d: "Earn trust, and the conversation changes. Push, and it closes." },
];

function Index() {
  const openCount = roommates.filter(isOpen).length;
  const { user } = useAuth();
  const { isActive } = useSubscription();
  const { openCheckout, openBillingPortal, pending } = useCheckout();
  const navigate = useNavigate();

  // Someone arriving from a friend's link keeps the code until they sign up.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) window.localStorage.setItem("wingman_code", code.toUpperCase());
  }, []);



  function startTrial() {
    void navigate({ to: user ? "/account" : "/auth" });
  }

  function subscribe(priceId: string) {
    if (!user) {
      void navigate({ to: "/auth" });
      return;
    }
    if (isActive) {
      void openBillingPortal();
      return;
    }
    void openCheckout(priceId);
  }

  return (


    <main className="min-h-screen bg-background text-foreground">
      <nav className="absolute inset-x-0 top-0 z-20 flex justify-end gap-6 px-6 py-5">
        {user && (
          <Link
            to="/room"
            className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            Common room
          </Link>
        )}
        <Link
          to="/shop"
          className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          Merch
        </Link>

        <Link
          to={user ? "/account" : "/auth"}
          className="text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          {user ? "My account" : "Sign in"}
        </Link>
      </nav>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroLoft}
          alt="Neon-lit apartment loft at night"
          width={1600}
          height={1000}
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-veil" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">A social experiment</p>
          <h1 className="mt-5 text-5xl leading-[0.92] sm:text-8xl">
            Welcome to the <span className="text-gradient-neon">sorority house</span>
          </h1>
          <p className="mt-6 text-lg text-foreground sm:text-2xl">
            Can you survive or will you thrive?
          </p>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            Think you're a Casanova? I doubt it.
          </p>
          <p className="mt-2 text-lg text-foreground sm:text-xl">
            No one's made it past two so far.
          </p>

        </div>
      </section>

      {/* Pick your girl */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-4xl sm:text-5xl">Pick your girl</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roommates.map((r) => {
            const locked = !isOpen(r);
            return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                if (!user) return void navigate({ to: "/auth" });
                if (locked) return void navigate({ to: "/account" });
                void navigate({ to: "/chat/$characterId", params: { characterId: r.id } });
              }}
              className="group text-center"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
                <img
                  src={r.img}
                  alt={locked ? `Locked door for ${r.name}` : `Portrait of ${r.name}`}
                  loading="lazy"
                  width={768}
                  height={960}
                  className={`h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    locked ? "scale-105 blur-lg brightness-75" : ""
                  }`}
                />
                {locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40">
                    <Lock className="h-7 w-7 text-accent" aria-hidden="true" />
                    <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent">
                      {unlockLabel(r.unlock)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-3xl">{r.name}</h3>
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-accent">{r.tag}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.line}</p>
            </button>
            );
          })}

        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-base text-muted-foreground">
          Six roommates share one house and a whole lot of emotional armor. Dakota and Zoe are the
          two open doors. Willow, Brittany, Sasha and Piper stay behind theirs until you prove
          you're worth it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="hero" size="lg" onClick={startTrial}>
            {user ? "Go to my account" : "Start free — 25 messages"}
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          No card required. The trial ends at message 50.
        </p>
      </section>

      {/* Hallway */}
      <section className="relative isolate overflow-hidden border-y border-border">
        <img
          src={hallway}
          alt="Sorority house hallway at night with two doors open, eight shut, and a red fire exit sign"
          loading="lazy"
          width={1600}
          height={912}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-veil" />
        <div className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">
            {openCount} {openCount === 1 ? "door" : "doors"} open. {TOTAL_DOORS - openCount} shut.
          </p>
          <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Are you charming enough to get through everyone — or will you have to{" "}
            <span className="text-gradient-neon">go back to school?</span>
          </h2>

          {/* The hall of doors — extras are reserved for future sorority members */}
          <div className="mt-12 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {roommates.map((r) => (
              <div
                key={r.id}
                className={`glass-card flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-xl px-2 ${
                  isOpen(r) ? "border-primary/60 shadow-glow" : ""
                }`}
              >
                {isOpen(r) ? (
                  <DoorClosed className="h-6 w-6 text-primary" aria-hidden="true" />
                ) : (
                  <Lock className="h-5 w-5 text-accent" aria-hidden="true" />
                )}
                <span className="text-lg leading-none">{r.name}</span>
                <span className="text-[0.5rem] uppercase tracking-[0.25em] text-muted-foreground">
                  {unlockLabel(r.unlock)}
                </span>
              </div>
            ))}
            {reservedDoors.map((d) => (
              <div
                key={d.id}
                className="flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 px-2 opacity-60"
              >
                <DoorClosed className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <span className="font-display text-lg leading-none text-muted-foreground">
                  {d.number}
                </span>
                <span className="text-[0.5rem] uppercase tracking-[0.25em] text-muted-foreground">
                  Reserved
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            {TOTAL_DOORS} doors in the house. Six are hers. The rest are waiting on new sisters —
            and the fire exit is always right there at the end of the hall.
          </p>
        </div>

      </section>


      {/* Scoreboard */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="text-center text-4xl sm:text-5xl">The scoreboard</h2>
        <p className="mt-3 text-center text-sm uppercase tracking-[0.3em] text-accent">
          How far have you made it?
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {roommates.map((r) => (
            <div
              key={r.name}
              className="glass-card flex items-center justify-between rounded-2xl px-6 py-5"
            >
              <span className="text-2xl">{r.name} reached</span>
              <span className="text-gradient-neon font-display text-3xl">0/4</span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-primary/40 px-6 py-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Players who reached all six
          </p>
          <p className="text-gradient-neon mt-2 font-display text-6xl">0</p>
        </div>
      </section>



      {/* How it works */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-4xl sm:text-5xl">How the experiment works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="glass-card rounded-2xl p-7">
                <span className="text-gradient-neon font-display text-5xl">{s.n}</span>
                <h3 className="mt-4 text-2xl">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Group photo — locked girls stay blurred */}
      <section className="mx-auto max-w-5xl px-6 pt-24">
        <div className="relative overflow-hidden rounded-3xl border border-border">
          <img
            src={houseGroup}
            alt="The girls of the sorority house with a crowd of unnamed girls behind them, captioned Come get schooled"
            width={1536}
            height={1024}
            loading="lazy"
            className="w-full object-cover"
          />
          {/* The girls on the right stay out of focus until you unlock them —
              the caption along the bottom stays sharp. */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-3/4 w-1/2 backdrop-blur-xl"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 35%), linear-gradient(to bottom, black 70%, transparent)",
              maskImage:
                "linear-gradient(to right, transparent, black 35%), linear-gradient(to bottom, black 70%, transparent)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-6 pt-16">
            <p className="text-sm text-muted-foreground">
              Two faces you can already see. The rest come into focus when you unlock
              them — and new girls move in every month.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-4xl sm:text-5xl">
          You get {FREE_MESSAGE_LIMIT} messages. They get the last word.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-border p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Trial</p>
            <p className="mt-4 font-display text-6xl">Free</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Up to {FREE_MESSAGE_LIMIT} messages, total.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Dakota &amp; Zoe's doors are open</li>
              <li>No card required</li>
              <li>Live message counter</li>
            </ul>
            <Button variant="neon" size="lg" className="mt-8 w-full" onClick={startTrial}>
              Start the trial
            </Button>
          </div>
          <div className="relative rounded-2xl border border-primary/50 bg-card p-8 shadow-glow">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              Storyline challenge
            </p>
            <p className="mt-4 font-display text-6xl">
              $14.99<span className="font-sans text-base text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Work your way through the challenge at your own pace.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Earn each door the hard way</li>
              <li>2,000 messages a month</li>
              <li>They remember everything you tell them</li>
            </ul>
            <Button
              variant="hero"
              size="lg"
              className="mt-8 w-full"
              disabled={!!pending}
              onClick={() => subscribe(PLANS.storyline_monthly.priceId)}
            >
              {pending === PLANS.storyline_monthly.priceId ? "Opening checkout…" : "Subscribe"}
            </Button>
          </div>
          <div className="rounded-2xl border border-accent/50 bg-card p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">All site access</p>
            <p className="mt-4 font-display text-6xl">
              $19.99<span className="font-sans text-base text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Are you the impatient type? Come on in and see the girls — new ones
              moving in monthly.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Every door open from day one</li>
              <li>Shared house conversations with everyone</li>
              <li>2,000 messages a month</li>
            </ul>
            <Button
              variant="neon"
              size="lg"
              className="mt-8 w-full"
              disabled={!!pending}
              onClick={() => subscribe(PLANS.all_access_monthly.priceId)}
            >
              {pending === PLANS.all_access_monthly.priceId
                ? "Opening checkout…"
                : "Get all access"}
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-6">
            <h3 className="text-2xl">Out of messages?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add 1,000 more messages for {TOPUP_PRICE}, any time, from your account
              page.
            </p>
          </div>
          <div className="rounded-2xl border border-border p-6">
            <h3 className="text-2xl">Suggest a girl</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {SUGGESTION_PRICE}/mo lets you pitch a girl for the house — keep her
              private or share her with everyone and earn a free request.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/40 bg-card/60 p-6 text-center">
          <h3 className="text-2xl">Bring a wingman, not a woman</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Share your invite code from your account page. Every friend who signs up
            earns you free messages.
          </p>
        </div>
      </section>


      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-xs text-muted-foreground sm:flex-row">
          <p>Apartment 4 — a conversation experiment.</p>
          <p>Fictional characters. 18+.</p>
        </div>
      </footer>
    </main>
  );
}
