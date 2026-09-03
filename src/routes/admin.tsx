import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/stripe";
import {
  checkIsAdmin,
  listCharacterSettings,
  saveCharacterSetting,
  type CharacterSetting,
} from "@/utils/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "House admin — characters, plans & prompts" },
      {
        name: "description",
        content:
          "Admin console for the sorority house: map each girl to a plan, edit her personality prompt and change unlock rules without redeploying.",
      },
      { property: "og:title", content: "House admin — characters, plans & prompts" },
      {
        property: "og:description",
        content: "Map girls to plans, edit prompts and unlock rules live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const EMPTY: CharacterSetting = {
  character_id: "",
  name: "",
  tag: "",
  tagline: "",
  price_id: "founders_monthly",
  unlock_type: "open",
  unlock_character: null,
  unlock_level: 3,
  system_prompt: null,
  sort_order: 99,
  enabled: true,
};

const field =
  "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-primary";
const label = "block text-xs uppercase tracking-widest text-white/50 mb-1";

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdminFn = useServerFn(checkIsAdmin);
  const listFn = useServerFn(listCharacterSettings);
  const saveFn = useServerFn(saveCharacterSetting);

  const statsFn = useServerFn(getAdminStats);

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<CharacterSetting[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [draft, setDraft] = useState<CharacterSetting | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const { isAdmin } = await isAdminFn({});
        setAllowed(isAdmin);
        if (isAdmin) {
          const [settings, s] = await Promise.all([listFn({}), statsFn({})]);
          setRows(settings);
          setStats(s);
        }
      } catch {
        setAllowed(false);
      }
    })();
  }, [user, isAdminFn, listFn, statsFn]);


  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveFn({ data: draft });
      setRows(await listFn({}));
      setDraft(null);
      toast.success("Saved. Live immediately.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading || allowed === null) {
    return <main className="p-10 text-white/60">Loading…</main>;
  }

  if (!allowed) {
    return (
      <main className="mx-auto max-w-lg p-10 text-center">
        <h1 className="mb-3 text-2xl font-bold">Admins only</h1>
        <p className="mb-6 text-white/60">
          This account doesn't have admin access to the house.
        </p>
        <Link to="/">
          <Button variant="outline">Back to the house</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">House admin</h1>
          <p className="text-sm text-white/50">
            Plans, personality prompts and unlock rules — changes go live instantly.
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" size="sm">
            The house
          </Button>
        </Link>
      </header>

      <div className="mb-6 flex justify-end">
        <Button size="sm" onClick={() => setDraft({ ...EMPTY })}>
          Add character
        </Button>
      </div>

      <ul className="space-y-3">
        {rows.map((r) => (
          <li
            key={r.character_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <div>
              <p className="font-semibold">
                {r.name}{" "}
                <span className="text-xs uppercase tracking-widest text-white/40">
                  {r.tag}
                </span>
              </p>
              <p className="text-xs text-white/50">
                {r.price_id ? (PLANS as never as Record<string, { name: string; price: string }>)[r.price_id]?.name ?? r.price_id : "Free"}
                {" · "}
                {r.unlock_type === "trust"
                  ? `trust ${r.unlock_level} with ${r.unlock_character}`
                  : r.unlock_type}
                {" · "}
                {r.enabled ? "visible" : "hidden"}
                {r.system_prompt ? " · custom prompt" : " · file prompt"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDraft({ ...r })}>
              Edit
            </Button>
          </li>
        ))}
      </ul>

      {draft && (
        <section className="mt-8 rounded-xl border border-primary/40 bg-black/60 p-5">
          <h2 className="mb-4 text-lg font-bold">
            {rows.some((r) => r.character_id === draft.character_id)
              ? `Edit ${draft.name}`
              : "New character"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>Character id</span>
              <input
                className={field}
                value={draft.character_id}
                onChange={(e) => setDraft({ ...draft, character_id: e.target.value })}
              />
            </div>
            <div>
              <span className={label}>Name</span>
              <input
                className={field}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <span className={label}>Tag</span>
              <input
                className={field}
                value={draft.tag}
                onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
              />
            </div>
            <div>
              <span className={label}>Plan / Stripe price</span>
              <select
                className={field}
                value={draft.price_id ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, price_id: e.target.value || null })
                }
              >
                <option value="">Free (no plan required)</option>
                {Object.values(PLANS).map((p) => (
                  <option key={p.priceId} value={p.priceId}>
                    {p.name} — {p.price} ({p.priceId})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <span className={label}>Card tagline</span>
              <textarea
                className={field}
                rows={2}
                value={draft.tagline}
                onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
              />
            </div>
            <div>
              <span className={label}>Unlock rule</span>
              <select
                className={field}
                value={draft.unlock_type}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    unlock_type: e.target.value as CharacterSetting["unlock_type"],
                  })
                }
              >
                <option value="open">Open</option>
                <option value="trust">Trust level with another girl</option>
                <option value="subscription">Subscription only</option>
                <option value="coming-soon">Coming soon</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className={label}>Unlock after</span>
                <input
                  className={field}
                  placeholder="dakota"
                  disabled={draft.unlock_type !== "trust"}
                  value={draft.unlock_character ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, unlock_character: e.target.value })
                  }
                />
              </div>
              <div>
                <span className={label}>Trust level</span>
                <input
                  className={field}
                  type="number"
                  min={1}
                  max={4}
                  disabled={draft.unlock_type !== "trust"}
                  value={draft.unlock_level ?? 3}
                  onChange={(e) =>
                    setDraft({ ...draft, unlock_level: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <span className={label}>Sort order</span>
              <input
                className={field}
                type="number"
                value={draft.sort_order}
                onChange={(e) =>
                  setDraft({ ...draft, sort_order: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <input
                id="enabled"
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
              />
              <label htmlFor="enabled" className="text-sm text-white/70">
                Visible in the house
              </label>
            </div>
            <div className="sm:col-span-2">
              <span className={label}>
                Personality prompt override (blank = use her uploaded file)
              </span>
              <textarea
                className={`${field} font-mono text-xs`}
                rows={12}
                value={draft.system_prompt ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, system_prompt: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
