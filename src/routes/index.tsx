import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sorority House — Official Merch Store" },
      {
        name: "description",
        content:
          "The Sorority House store. Hoodies, tees and limited drops, shipped straight from the house.",
      },
      { property: "og:title", content: "Sorority House — Official Merch Store" },
      {
        property: "og:description",
        content: "Hoodies, tees and limited drops from the Sorority House store.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground">
        Welcome to
      </p>
      <h1 className="mt-4 text-5xl font-black uppercase tracking-tight md:text-7xl">
        Sorority House
      </h1>
      <p className="mt-5 max-w-md text-base text-muted-foreground">
        A clean slate. The store is still open while the rest gets rebuilt.
      </p>
      <div className="mt-10">
        <Button asChild size="lg">
          <Link to="/shop">Shop the merch</Link>
        </Button>
      </div>
    </main>
  );
}
