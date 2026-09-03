import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import heroLoft from "@/assets/hero-loft.jpg";
import dakota from "@/assets/dakota.jpg";
import zoe from "@/assets/zoe.jpg";
import willow from "@/assets/willow.jpg";
import brittany from "@/assets/brittany.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apartment 4 — Can You Get Past Their Defenses?" },
      {
        name: "description",
        content:
          "Four roommates. One social experiment. Chat free for 100 messages and see if you can get past Dakota, Zoe, Willow and Brittany's personal defenses.",
      },
      { property: "og:title", content: "Apartment 4 — Can You Get Past Their Defenses?" },
      {
        property: "og:description",
        content:
          "A conversation experiment with four roommates. 100 free messages, then subscribe to keep talking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const roommates = [
  {
    name: "Dakota",
    img: dakota,
    tag: "The gatekeeper",
    line: "Warm on the outside, but trust must be earned.",
  },
  {
    name: "Zoe",
    img: zoe,
    tag: "The mirage",
    line: "Everyone sees her, but almost nobody gets past the image.",
  },
  {
    name: "Willow",
    img: willow,
    tag: "The quiet lock",
    line: "Gentle and observant, but she opens only with patience.",
  },
  {
    name: "Brittany",
    img: brittany,
    tag: "The sweet trap",
    line: "Seems like the easiest — her friendliness is the hardest wall.",
  },
];


const steps = [
  { n: "01", t: "Pick a roommate", d: "Four personalities, four very different sets of walls." },
  { n: "02", t: "Start talking", d: "Your first 100 messages are free. No card, no catch." },
  { n: "03", t: "Get past the guard", d: "Earn trust, and the conversation changes. Push, and it closes." },
];

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
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
          <h1 className="mt-5 text-6xl leading-[0.92] sm:text-8xl">
            Can you <span className="text-gradient-neon">get through them all?</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
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
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {roommates.map((r) => (
            <button
              key={r.name}
              type="button"
              className="group text-center"
            >
              <div className="overflow-hidden rounded-2xl border border-border shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
                <img
                  src={r.img}
                  alt={`Portrait of ${r.name}`}
                  loading="lazy"
                  width={768}
                  height={960}
                  className="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-4 text-3xl">{r.name}</h3>
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-accent">{r.tag}</p>
            </button>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          No card required. The trial ends at message 100.
        </p>
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

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-4xl sm:text-5xl">100 free messages. Prove you can get through.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Trial</p>
            <p className="mt-4 font-display text-6xl">Free</p>
            <p className="mt-1 text-sm text-muted-foreground">Up to 100 messages, total.</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>All four roommates unlocked</li>
              <li>No card required</li>
              <li>Live message counter</li>
            </ul>
            <Button variant="neon" size="lg" className="mt-8 w-full">
              Start the trial
            </Button>
          </div>
          <div className="relative rounded-2xl border border-primary/50 bg-card p-8 shadow-glow">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Full access</p>
            <p className="mt-4 font-display text-6xl">
              $19<span className="font-sans text-base text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Unlimited messages. Cancel anytime.</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Unlimited conversation with all four</li>
              <li>Memory of everything you've told them</li>
              <li>Deeper storylines as trust builds</li>
            </ul>
            <Button variant="hero" size="lg" className="mt-8 w-full">
              Subscribe
            </Button>
          </div>
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
