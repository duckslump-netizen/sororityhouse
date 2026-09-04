import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Welcome to the Sorority House" },
      {
        name: "description",
        content:
          "Create an account or sign in to start your 50 free messages with the girls of the sorority house.",
      },
      { property: "og:title", content: "Sign in — Welcome to the Sorority House" },
      {
        property: "og:description",
        content: "Create an account to start your 50 free messages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/account" });
  }, [loading, user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      void navigate({ to: "/account" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/60 p-8 backdrop-blur">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {mode === "signup" ? "Get your 100 messages" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Free trial. No card until you run out."
            : "Sign in to pick up where you left off."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "One second…" : mode === "signup" ? "Start free" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>

        <Link
          to="/"
          className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Back to the house
        </Link>
      </div>
    </main>
  );
}
