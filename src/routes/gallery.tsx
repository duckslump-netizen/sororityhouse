import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { clowns, isOpen, unlockLabel } from "@/lib/clowns";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "The Clowns | Chanceys" },
      {
        name: "description",
        content:
          "Meet every clown behind the funhouse doors — the greeter, the stitch, the harlequin, the silence, the ringmaster and the porcelain.",
      },
      { property: "og:title", content: "The Clowns | Chanceys" },
      {
        property: "og:description",
        content: "Every clown behind the funhouse doors, and what it takes to get past each one.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-14">
      <div className="mx-auto max-w-6xl">
        <Link to="/" className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Back to Chanceys
        </Link>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-6xl">
          The Clowns
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Six of them. Two will talk to anybody. The rest need convincing.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clowns.map((clown) => {
            const open = isOpen(clown);
            return (
              <article key={clown.id} className="glass-card overflow-hidden rounded-3xl">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={clown.image}
                    alt={open ? `${clown.name}, ${clown.tag}` : ""}
                    width={768}
                    height={1024}
                    loading="lazy"
                    className={`h-full w-full object-cover ${
                      open ? "" : "scale-110 blur-xl brightness-50"
                    }`}
                  />
                  {!open && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                      <Lock className="h-6 w-6 text-accent" />
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Door {clown.door}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-1 p-5">
                  <p className="text-[0.6rem] uppercase tracking-[0.35em] text-accent">
                    {clown.tag}
                  </p>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{clown.name}</h2>
                  <p className="text-sm text-muted-foreground">{clown.line}</p>
                  <p className="pt-2 text-xs uppercase tracking-[0.2em] text-primary">
                    {unlockLabel(clown.unlock)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
