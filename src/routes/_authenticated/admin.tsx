import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RecordEditor, type FieldSpec, type RecordValues } from "@/components/admin/record-editor";
import {
  deleteCredit,
  deleteFilm,
  deleteGalleryImage,
  deletePost,
  deleteHomepageSlide,
  deletePressItem,
  loadAdminData,
  saveCredit,
  saveFilm,
  saveGalleryImage,
  saveHomepageSlide,
  savePost,
  savePressItem,
  updateSubmissionStatus,
  type AdminSnapshot,
} from "@/lib/admin.functions";
import { loadSocialData, type SocialSnapshot } from "@/lib/social.functions";
import { OverviewPanel } from "@/components/admin/overview-panel";
import { SocialPanel } from "@/components/admin/social-panel";
import { AutomationPanel } from "@/components/admin/automation-panel";
import { AnalyticsPanel } from "@/components/admin/analytics-panel";
import { AiPanel } from "@/components/admin/ai-panel";
import { SettingsPanel } from "@/components/admin/settings-panel";
import { HomepagePanel } from "@/components/admin/homepage-panel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio dashboard — Slate Safi" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminDashboard,
});

const FILM_FIELDS: readonly FieldSpec[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "slug", label: "Slug", type: "text", placeholder: "boda-love" },
  { key: "tagline", label: "Tagline", type: "text", full: true },
  { key: "logline", label: "Logline", type: "textarea", full: true },
  { key: "synopsis", label: "Synopsis", type: "textarea", full: true },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "released", label: "Released" },
      { value: "post-production", label: "Post-production" },
      { value: "production", label: "In production" },
      { value: "development", label: "Development" },
      { value: "upcoming", label: "Upcoming" },
    ],
  },
  { key: "release_year", label: "Release year", type: "number" },
  { key: "runtime_minutes", label: "Runtime (min)", type: "number" },
  { key: "genre", label: "Genre", type: "text" },
  { key: "country", label: "Country", type: "text" },
  { key: "language", label: "Language", type: "text" },
  { key: "poster_url", label: "Poster", type: "image", full: true, folder: "films/posters" },
  { key: "hero_image_url", label: "Hero image", type: "image", full: true, folder: "films/heroes" },
  { key: "trailer_url", label: "Trailer URL", type: "text", full: true },
  { key: "sort_order", label: "Sort order", type: "number" },
  { key: "featured", label: "Featured on homepage", type: "boolean" },
  { key: "published", label: "Published", type: "boolean" },
];

const CREDIT_FIELDS: readonly FieldSpec[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "role", label: "Role", type: "text" },
  {
    key: "credit_type",
    label: "Type",
    type: "select",
    options: [
      { value: "cast", label: "Cast" },
      { value: "crew", label: "Crew" },
    ],
  },
  { key: "character_name", label: "Character", type: "text" },
  { key: "photo_url", label: "Photo", type: "image", full: true, folder: "credits" },
  { key: "bio", label: "Bio", type: "textarea", full: true },
  { key: "sort_order", label: "Sort order", type: "number" },
];

const GALLERY_FIELDS: readonly FieldSpec[] = [
  { key: "image_url", label: "Image", type: "image", full: true, folder: "gallery", required: true },
  { key: "caption", label: "Caption", type: "text", full: true },
  { key: "sort_order", label: "Sort order", type: "number" },
];

const POST_FIELDS: readonly FieldSpec[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "slug", label: "Slug", type: "text" },
  { key: "excerpt", label: "Excerpt", type: "textarea", full: true },
  { key: "body", label: "Body", type: "textarea", full: true },
  { key: "cover_image_url", label: "Cover image", type: "image", full: true, folder: "news" },
  { key: "author", label: "Author", type: "text" },
  { key: "category", label: "Category", type: "text" },
  { key: "published_at", label: "Published at (ISO)", type: "text" },
  { key: "published", label: "Published", type: "boolean" },
];

const PRESS_FIELDS: readonly FieldSpec[] = [
  { key: "title", label: "Title", type: "text" },
  {
    key: "kind",
    label: "Kind",
    type: "select",
    options: [
      { value: "laurel", label: "Laurel" },
      { value: "award", label: "Award" },
      { value: "quote", label: "Quote" },
      { value: "coverage", label: "Coverage" },
    ],
  },
  { key: "outlet", label: "Outlet", type: "text" },
  { key: "quote", label: "Quote", type: "textarea", full: true },
  { key: "year", label: "Year", type: "number" },
  { key: "link_url", label: "Link URL", type: "text", full: true },
  { key: "sort_order", label: "Sort order", type: "number" },
  { key: "published", label: "Published", type: "boolean" },
];

const SLIDE_FIELDS: readonly FieldSpec[] = [
  {
    key: "image_url",
    label: "Slide image",
    type: "image",
    full: true,
    folder: "homepage",
    required: true,
  },
  { key: "eyebrow", label: "Eyebrow", type: "text" },
  { key: "title", label: "Headline", type: "text" },
  { key: "logline", label: "Logline", type: "textarea", full: true },
  { key: "cta_label", label: "Button label", type: "text" },
  {
    key: "cta_url",
    label: "Button link",
    type: "text",
    placeholder: "https://youtu.be/... or /films/boda-love",
  },
  { key: "sort_order", label: "Sort order", type: "number" },
  { key: "published", label: "Published", type: "boolean" },
];

const TABS = [
  "Overview",
  "Homepage",
  "Films",
  "Cast & crew",
  "Gallery",
  "News",
  "Press",
  "Social",
  "Automation",
  "AI studio",
  "Analytics",
  "Submissions",
  "Settings",
] as const;
type Tab = (typeof TABS)[number];

function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const load = useServerFn(loadAdminData);
  const loadSocial = useServerFn(loadSocialData);
  const [tab, setTab] = useState<Tab>("Overview");
  const [filmId, setFilmId] = useState<string>("");

  const { data, isPending, error, refetch } = useQuery<AdminSnapshot>({
    queryKey: ["admin-data"],
    queryFn: () => load(),
  });

  const socialQuery = useQuery<SocialSnapshot>({
    queryKey: ["admin-social"],
    queryFn: () => loadSocial(),
    enabled: !error,
  });

  async function refetchAll() {
    await Promise.all([refetch(), socialQuery.refetch()]);
  }

  const films = data?.films ?? [];
  const activeFilmId = filmId || films[0]?.id || "";

  const credits = useMemo(
    () => (data?.credits ?? []).filter((c) => c.film_id === activeFilmId),
    [data, activeFilmId],
  );
  const gallery = useMemo(
    () => (data?.gallery ?? []).filter((g) => g.film_id === activeFilmId),
    [data, activeFilmId],
  );

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isPending) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-40 text-center">
        <h1 className="text-3xl">Dashboard unavailable</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          {error instanceof Error && /admin/i.test(error.message)
            ? "This account does not have studio admin access yet."
            : "We couldn't load the dashboard."}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={() => void refetch()} className="text-xs uppercase tracking-[0.18em] text-primary">
            Try again
          </button>
          <button onClick={signOut} className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-32 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Studio dashboard</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Manage the slate</h1>
        </div>
        <div className="flex gap-6 text-xs uppercase tracking-[0.18em]">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            View site
          </Link>
          <button onClick={signOut} className="text-muted-foreground hover:text-primary">
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-sm px-4 py-2 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {(tab === "Cast & crew" || tab === "Gallery") && (
        <div className="mt-8">
          <label className="block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground" htmlFor="film-picker">
            Film
          </label>
          <select
            id="film-picker"
            value={activeFilmId}
            onChange={(e) => setFilmId(e.target.value)}
            className="mt-2 rounded-sm border border-input bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {films.map((f) => (
              <option key={f.id} value={f.id} className="bg-background">
                {f.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-10">
        {tab === "Overview" && <OverviewPanel data={data!} social={socialQuery.data} />}

        {tab === "Homepage" && (
          <div className="space-y-16">
            <HomepagePanel data={data!} onDone={refetch} />
            <div className="rule-top pt-12">
              <CrudSection
                title="Hero slideshow"
                fields={SLIDE_FIELDS}
                rows={data?.slides ?? []}
                label={(r) =>
                  `${(r.title as string) || "Untitled slide"}${r.published ? "" : " (hidden)"}`
                }
                blank={{
                  image_url: "",
                  published: true,
                  sort_order: (data?.slides ?? []).length,
                }}
                save={saveHomepageSlide}
                remove={deleteHomepageSlide}
                onDone={refetch}
              />
            </div>
          </div>
        )}

        {tab === "Films" && (
          <CrudSection
            title="Films"
            fields={FILM_FIELDS}
            rows={films}
            label={(r) => `${r.title as string}${r.published ? "" : " (draft)"}`}
            blank={{
              title: "",
              slug: "",
              status: "upcoming",
              country: "Kenya",
              featured: false,
              published: false,
              sort_order: films.length,
            }}
            save={saveFilm}
            remove={deleteFilm}
            onDone={refetch}
          />
        )}

        {tab === "Cast & crew" && (
          <CrudSection
            title="Cast & crew"
            fields={CREDIT_FIELDS}
            rows={credits}
            label={(r) => `${r.name as string} — ${r.role as string}`}
            blank={{
              film_id: activeFilmId,
              name: "",
              role: "",
              credit_type: "cast",
              sort_order: credits.length,
            }}
            save={saveCredit}
            remove={deleteCredit}
            onDone={refetch}
          />
        )}

        {tab === "Gallery" && (
          <CrudSection
            title="Gallery"
            fields={GALLERY_FIELDS}
            rows={gallery}
            label={(r) => (r.caption as string) || (r.image_url as string)}
            blank={{ film_id: activeFilmId, image_url: "", sort_order: gallery.length }}
            save={saveGalleryImage}
            remove={deleteGalleryImage}
            onDone={refetch}
          />
        )}

        {tab === "News" && (
          <CrudSection
            title="News"
            fields={POST_FIELDS}
            rows={data?.posts ?? []}
            label={(r) => `${r.title as string}${r.published ? "" : " (draft)"}`}
            blank={{
              title: "",
              slug: "",
              category: "News",
              published: false,
              published_at: new Date().toISOString(),
            }}
            save={savePost}
            remove={deletePost}
            onDone={refetch}
          />
        )}

        {tab === "Press" && (
          <CrudSection
            title="Press & laurels"
            fields={PRESS_FIELDS}
            rows={data?.press ?? []}
            label={(r) => `${r.title as string}`}
            blank={{
              kind: "laurel",
              title: "",
              published: true,
              sort_order: (data?.press ?? []).length,
            }}
            save={savePressItem}
            remove={deletePressItem}
            onDone={refetch}
          />
        )}

        {tab === "Social" &&
          (socialQuery.data ? (
            <SocialPanel admin={data!} social={socialQuery.data} onDone={refetchAll} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading social queue…</p>
          ))}

        {tab === "Automation" &&
          (socialQuery.data ? (
            <AutomationPanel admin={data!} social={socialQuery.data} onDone={refetchAll} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading automation…</p>
          ))}

        {tab === "Analytics" &&
          (socialQuery.data ? (
            <AnalyticsPanel social={socialQuery.data} onDone={refetchAll} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading analytics…</p>
          ))}

        {tab === "AI studio" && <AiPanel admin={data!} onDone={refetchAll} />}

        {tab === "Submissions" && <Submissions data={data!} onDone={refetch} />}

        {tab === "Settings" &&
          (socialQuery.data ? (
            <SettingsPanel social={socialQuery.data} onDone={refetchAll} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ))}
      </div>
    </div>
  );
}

type ServerAction = (opts: { data: RecordValues }) => Promise<unknown>;

function CrudSection({
  title,
  fields,
  rows,
  label,
  blank,
  save,
  remove,
  onDone,
}: {
  title: string;
  fields: readonly FieldSpec[];
  rows: RecordValues[];
  label: (row: RecordValues) => string;
  blank: RecordValues;
  save: unknown;
  remove: unknown;
  onDone: () => unknown;
}) {
  const saveFn = useServerFn(save as never) as unknown as ServerAction;
  const removeFn = useServerFn(remove as never) as unknown as ServerAction;
  const [draft, setDraft] = useState<RecordValues | null>(null);
  const [pending, setPending] = useState(false);

  async function onSave() {
    if (!draft) return;
    const missing = fields.find(
      (f) => f.required && String(draft[f.key] ?? "").trim() === "",
    );
    if (missing) {
      toast.error(`${missing.label} is required.`);
      return;
    }
    setPending(true);
    try {
      const payload: RecordValues = {};
      for (const field of fields) payload[field.key] = draft[field.key] ?? null;
      for (const key of ["id", "film_id"]) if (draft[key]) payload[key] = draft[key];
      if (payload["sort_order"] == null) payload["sort_order"] = 0;
      await saveFn({ data: payload });
      toast.success("Saved.");
      setDraft(null);
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  async function onRemove(id: string) {
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      await removeFn({ data: { id } });
      toast.success("Deleted.");
      setDraft(null);
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete.");
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">{title}</h2>
          <button
            onClick={() => setDraft({ ...blank })}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li key={row.id as string}>
              <button
                onClick={() => setDraft({ ...row })}
                className={`w-full rounded-sm border px-4 py-3 text-left text-sm transition-colors ${
                  draft?.id === row.id ? "border-primary" : "border-border hover:border-primary/50"
                }`}
              >
                {label(row)}
              </button>
            </li>
          ))}
          {rows.length === 0 && (
            <li className="text-sm text-muted-foreground">Nothing here yet.</li>
          )}
        </ul>
      </div>

      <div>
        {draft ? (
          <div className="frame rounded-sm border border-border p-6">
            <RecordEditor fields={fields} value={draft} onChange={setDraft} />
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={onSave}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
              <button
                onClick={() => setDraft(null)}
                className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
              >
                Cancel
              </button>
              {draft.id ? (
                <button
                  onClick={() => onRemove(draft.id as string)}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a record to edit, or create a new one.
          </p>
        )}
      </div>
    </div>
  );
}

function Submissions({ data, onDone }: { data: AdminSnapshot; onDone: () => unknown }) {
  const update = useServerFn(updateSubmissionStatus);

  async function setStatus(id: string, status: "new" | "reviewed" | "archived" | "spam") {
    try {
      await update({ data: { id, status } });
      toast.success("Updated.");
      await onDone();
    } catch {
      toast.error("Could not update that submission.");
    }
  }

  return (
    <div className="space-y-14">
      <div>
        <h2 className="eyebrow">Enquiries ({data.contact.length})</h2>
        <div className="mt-6 space-y-4">
          {data.contact.map((row) => (
            <div key={row.id} className="frame rounded-sm border border-border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-display text-base font-bold">
                  {row.name} · <span className="text-muted-foreground">{row.email}</span>
                </p>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  {row.inquiry_type} · {new Date(row.created_at).toLocaleString("en-GB")} · spam{" "}
                  {row.spam_score ?? 0}
                </p>
              </div>
              {row.organisation && (
                <p className="mt-1 text-sm text-muted-foreground">{row.organisation}</p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{row.message}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-[0.65rem] uppercase tracking-[0.18em]">
                <span className="text-primary">{row.status ?? "new"}</span>
                {(["reviewed", "archived", "spam", "new"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(row.id, s)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    Mark {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {data.contact.length === 0 && (
            <p className="text-sm text-muted-foreground">No enquiries yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="eyebrow">Newsletter subscribers ({data.subscribers.length})</h2>
        <ul className="mt-6 divide-y divide-border text-sm">
          {data.subscribers.map((row) => (
            <li key={row.id} className="flex flex-wrap justify-between gap-3 py-3">
              <span>{row.email}</span>
              <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                {row.source ?? "website"} · {new Date(row.created_at).toLocaleDateString("en-GB")}
              </span>
            </li>
          ))}
          {data.subscribers.length === 0 && (
            <li className="py-3 text-muted-foreground">No subscribers yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
