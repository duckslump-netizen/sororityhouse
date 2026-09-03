import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import heroLoft from "@/assets/hero-loft.jpg";
import hallway from "@/assets/hallway.jpg";
import dakota from "@/assets/dakota.jpg";
import zoe from "@/assets/zoe.jpg";
import willow from "@/assets/willow.jpg";
import brittany from "@/assets/brittany.jpg";
import harper from "@/assets/harper.jpg";
import sienna from "@/assets/sienna.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome to the Sorority House — Can You Survive or Thrive?" },
      {
        name: "description",
        content:
          "Ten doors, two open. Chat free for 100 messages and see if you're charming enough to get through Dakota, Zoe and the girls behind the locked doors.",
      },
      { property: "og:title", content: "Welcome to the Sorority House" },
      {
        property: "og:description",
        content:
          "Can you survive or will you thrive? 100 free messages, then subscribe to keep talking.",
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
    locked: false,
    line: "Small-town, down-to-earth, and quietly strong. Dakota is naturally funny and genuinely warm — but trust is earned slowly. Show her you're real, stay consistent, and she may let you see the fiercely loyal heart behind the kindness.",
  },
  {
    name: "Zoe",
    img: zoe,
    tag: "The mirage",
    locked: false,
    line: "Beautiful, intelligent, and impossible to read at first. Zoe is used to people wanting the image they see, so she keeps the real her carefully hidden. Look past the polish, notice what others miss, and you might earn the version of Zoe nobody else gets.",
  },
  {
    name: "Willow",
    img: willow,
    tag: "The quiet lock",
    locked: true,
    line: "Soft-spoken, observant, and gentler than she first appears. Willow notices everything but reveals very little until she feels safe. Be patient, remember the small details, and her carefully guarded world may slowly open to you.",
  },
  {
    name: "Brittany",
    img: brittany,
    tag: "The sweet trap",
    locked: true,
    line: "Warm, charming, and instantly easy to like. Brittany makes everyone feel special — but that effortless sweetness is also her strongest defense. If you want the real Brittany, you'll have to get past the sunshine she gives everyone else.",
  },
  {
    name: "Harper",
    img: harper,
    tag: "The wildcard",
    locked: true,
    line: "Sharp, restless, and always three steps ahead of the conversation. Harper will tease you, test you, and change the subject the second things get real. Keep up with her chaos without losing your nerve, and you might find out what she's actually protecting.",
  },
  {
    name: "Sienna",
    img: sienna,
    tag: "The closed book",
    locked: true,
    line: "Composed, watchful, and impossible to rush. Sienna gives you exactly as much as you've earned and not a word more. Say something true instead of something clever, and the page might finally turn.",
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
          {roommates.map((r) => (
            <button
              key={r.name}
              type="button"
              className="group text-center"
            >
              <div className="relative overflow-hidden rounded-2xl border border-border shadow-soft transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
                <img
                  src={r.img}
                  alt={r.locked ? `Locked door for ${r.name}` : `Portrait of ${r.name}`}
                  loading="lazy"
                  width={768}
                  height={960}
                  className={`h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    r.locked ? "scale-105 blur-lg brightness-75" : ""
                  }`}
                />
                {r.locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40">
                    <Lock className="h-7 w-7 text-accent" aria-hidden="true" />
                    <span className="text-[0.6rem] uppercase tracking-[0.3em] text-accent">
                      Door still shut
                    </span>
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-3xl">{r.name}</h3>
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-accent">{r.tag}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.line}</p>
            </button>
          ))}
        </div>
        <p className="mx-auto mt-10 max-w-2xl text-center text-base text-muted-foreground">
          Six roommates share one house and a whole lot of emotional armor. Dakota and Zoe are the
          two open doors. Willow, Brittany, Harper and Sienna stay behind theirs until you prove
          you're worth it.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="hero" size="lg">
            Start free — 100 messages
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          No card required. The trial ends at message 100.
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
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-accent">
            Two doors open. Eight shut.
          </p>
          <h2 className="mt-5 text-4xl leading-tight sm:text-5xl">
            Are you charming enough to get through everyone — or will you have to{" "}
            <span className="text-gradient-neon">go back to school?</span>
          </h2>
          <p className="mt-6 text-sm text-muted-foreground">
            The fire exit is always right there at the end of the hall.
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

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-4xl sm:text-5xl">You get 100 messages. They get the last word.</h2>
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
