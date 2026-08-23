import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, Loader2, Send, Sparkles, Trash2, Wand2 } from "lucide-react";
import type { AdminSnapshot } from "@/lib/admin.functions";
import {
  deleteSocialPost,
  generateSocialDrafts,
  publishSocialPostNow,
  runSocialQueue,
  saveSocialAccount,
  saveSocialPost,
  type SocialSnapshot,
} from "@/lib/social.functions";
import {
  PLATFORMS,
  PLATFORM_LABEL,
  PLATFORM_LIMIT,
  type Platform,
} from "@/lib/social.captions";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground";

const STATUS_TONE: Record<string, string> = {
  draft: "text-muted-foreground",
  scheduled: "text-primary",
  posting: "text-primary",
  posted: "text-emerald-400",
  failed: "text-destructive",
  cancelled: "text-muted-foreground",
};

type Draft = {
  id?: string;
  platform: Platform;
  status: "draft" | "scheduled" | "posted" | "failed" | "cancelled";
  caption: string;
  media_url: string;
  link_url: string;
  scheduled_for: string;
  source_type: "manual" | "film" | "post";
  source_id: string | null;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

export function SocialPanel({
  admin,
  social,
  onDone,
}: {
  admin: AdminSnapshot;
  social: SocialSnapshot;
  onDone: () => unknown;
}) {
  const save = useServerFn(saveSocialPost);
  const remove = useServerFn(deleteSocialPost);
  const publish = useServerFn(publishSocialPostNow);
  const runQueue = useServerFn(runSocialQueue);
  const generate = useServerFn(generateSocialDrafts);
  const saveAccount = useServerFn(saveSocialAccount);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [genSource, setGenSource] = useState("");
  const [genPlatforms, setGenPlatforms] = useState<Platform[]>([...PLATFORMS]);
  const [genWhen, setGenWhen] = useState("");
  const [filter, setFilter] = useState<"all" | Platform>("all");

  const sources = useMemo(
    () => [
      ...admin.films.map((f) => ({
        value: `film:${f.id}`,
        label: `Film — ${f.title}`,
      })),
      ...admin.posts.map((p) => ({
        value: `post:${p.id}`,
        label: `News — ${p.title}`,
      })),
    ],
    [admin],
  );

  const posts = useMemo(
    () => (filter === "all" ? social.posts : social.posts.filter((p) => p.platform === filter)),
    [social.posts, filter],
  );

  async function onGenerate() {
    const source = genSource || sources[0]?.value;
    if (!source) return toast.error("Add a film or news post first.");
    if (genPlatforms.length === 0) return toast.error("Pick at least one platform.");
    const [type, id] = source.split(":");
    setPending(true);
    try {
      const result = await generate({
        data: {
          source_type: type as "film" | "post",
          source_id: id!,
          platforms: genPlatforms,
          scheduled_for: genWhen ? new Date(genWhen).toISOString() : null,
        },
      });
      toast.success(`${result.created} caption${result.created === 1 ? "" : "s"} ready to review.`);
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate captions.");
    } finally {
      setPending(false);
    }
  }

  async function onSave() {
    if (!draft) return;
    setPending(true);
    try {
      await save({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          platform: draft.platform,
          status: draft.status,
          caption: draft.caption,
          media_url: draft.media_url || null,
          link_url: draft.link_url || null,
          source_type: draft.source_type,
          source_id: draft.source_id,
          scheduled_for: draft.scheduled_for ? new Date(draft.scheduled_for).toISOString() : null,
        },
      });
      toast.success("Saved.");
      setDraft(null);
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  async function onPublish(id: string) {
    setBusyId(id);
    try {
      const result = await publish({ data: { id } });
      toast.success(result.url ? "Published." : "Published (no link returned).");
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publishing failed.");
      await onDone();
    } finally {
      setBusyId(null);
    }
  }

  async function onRemove(id: string) {
    if (!window.confirm("Delete this queued post?")) return;
    try {
      await remove({ data: { id } });
      setDraft(null);
      await onDone();
    } catch {
      toast.error("Could not delete that post.");
    }
  }

  async function onRunQueue() {
    setPending(true);
    try {
      const result = await runQueue({});
      toast.success(
        result.processed === 0
          ? "Nothing due right now."
          : `Processed ${result.processed} scheduled post(s).`,
      );
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Queue run failed.");
    } finally {
      setPending(false);
    }
  }

  async function toggleConnected(id: string, connected: boolean, handle: string | null) {
    try {
      await saveAccount({ data: { id, connected, handle } });
      await onDone();
    } catch {
      toast.error("Could not update that account.");
    }
  }

  return (
    <div className="space-y-14">
      <div>
        <h2 className="eyebrow">Connected accounts</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {social.accounts.map((account) => {
            const ready = social.credentials[account.platform as Platform];
            return (
              <div key={account.id} className="frame rounded-sm border border-border p-5">
                <p className="font-display text-sm font-bold">
                  {PLATFORM_LABEL[account.platform as Platform]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{account.handle ?? "—"}</p>
                <p
                  className={`mt-3 text-[0.6rem] uppercase tracking-[0.18em] ${
                    ready ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {ready ? "API keys present" : "API keys missing"}
                </p>
                <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={account.connected}
                    onChange={(e) =>
                      void toggleConnected(account.id, e.target.checked, account.handle)
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  Enabled for auto-posting
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="frame rounded-sm border border-border p-6">
        <h2 className="eyebrow inline-flex items-center gap-2">
          <Wand2 className="h-3.5 w-3.5" /> Generate captions from content
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="gen-source">
              Film or news post
            </label>
            <select
              id="gen-source"
              value={genSource || sources[0]?.value || ""}
              onChange={(e) => setGenSource(e.target.value)}
              className={`mt-2 ${inputClass}`}
            >
              {sources.map((s) => (
                <option key={s.value} value={s.value} className="bg-background">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="gen-when">
              Schedule for (leave blank to keep as draft)
            </label>
            <input
              id="gen-when"
              type="datetime-local"
              value={genWhen}
              onChange={(e) => setGenWhen(e.target.value)}
              className={`mt-2 ${inputClass}`}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-5">
          {PLATFORMS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={genPlatforms.includes(p)}
                onChange={(e) =>
                  setGenPlatforms((prev) =>
                    e.target.checked ? [...prev, p] : prev.filter((x) => x !== p),
                  )
                }
                className="h-4 w-4 accent-primary"
              />
              {PLATFORM_LABEL[p]}
            </label>
          ))}
        </div>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <button
            onClick={onGenerate}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </button>
          <button
            onClick={onRunQueue}
            disabled={pending}
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
          >
            Run scheduler now
          </button>
          <button
            onClick={() =>
              setDraft({
                platform: "x",
                status: "draft",
                caption: "",
                media_url: "",
                link_url: "",
                scheduled_for: "",
                source_type: "manual",
                source_id: null,
              })
            }
            className="text-xs uppercase tracking-[0.18em] text-primary"
          >
            New manual post
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="eyebrow">Queue ({posts.length})</h2>
            <div className="flex gap-2">
              {(["all", ...PLATFORMS] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-sm px-2 py-1 text-[0.6rem] uppercase tracking-[0.14em] ${
                    filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
          </div>
          <ul className="mt-6 space-y-2">
            {posts.map((row) => (
              <li key={row.id}>
                <div
                  className={`rounded-sm border px-4 py-3 ${
                    draft?.id === row.id ? "border-primary" : "border-border"
                  }`}
                >
                  <button
                    onClick={() =>
                      setDraft({
                        id: row.id,
                        platform: row.platform as Platform,
                        status: row.status as Draft["status"],
                        caption: row.caption,
                        media_url: row.media_url ?? "",
                        link_url: row.link_url ?? "",
                        scheduled_for: toLocalInput(row.scheduled_for),
                        source_type: row.source_type as Draft["source_type"],
                        source_id: row.source_id,
                      })
                    }
                    className="w-full text-left"
                  >
                    <p className="flex items-center justify-between gap-3 text-[0.6rem] uppercase tracking-[0.16em]">
                      <span className="text-foreground">
                        {PLATFORM_LABEL[row.platform as Platform]}
                      </span>
                      <span className={STATUS_TONE[row.status] ?? "text-muted-foreground"}>
                        {row.status}
                      </span>
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{row.caption}</p>
                  </button>
                  {row.error ? (
                    <p className="mt-2 text-xs text-destructive">{row.error}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[0.6rem] uppercase tracking-[0.16em]">
                    {row.status !== "posted" && (
                      <button
                        onClick={() => void onPublish(row.id)}
                        disabled={busyId === row.id}
                        className="inline-flex items-center gap-1.5 text-primary disabled:opacity-50"
                      >
                        {busyId === row.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Post now
                      </button>
                    )}
                    {row.external_url ? (
                      <a
                        href={row.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" /> View
                      </a>
                    ) : null}
                    <button
                      onClick={() => void onRemove(row.id)}
                      className="inline-flex items-center gap-1.5 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {posts.length === 0 && (
              <li className="text-sm text-muted-foreground">Queue is empty.</li>
            )}
          </ul>
        </div>

        <div>
          {draft ? (
            <div className="frame rounded-sm border border-border p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="sp-platform">
                    Platform
                  </label>
                  <select
                    id="sp-platform"
                    value={draft.platform}
                    onChange={(e) => setDraft({ ...draft, platform: e.target.value as Platform })}
                    className={`mt-2 ${inputClass}`}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p} className="bg-background">
                        {PLATFORM_LABEL[p]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="sp-status">
                    Status
                  </label>
                  <select
                    id="sp-status"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft({ ...draft, status: e.target.value as Draft["status"] })
                    }
                    className={`mt-2 ${inputClass}`}
                  >
                    {(["draft", "scheduled", "cancelled", "failed", "posted"] as const).map((s) => (
                      <option key={s} value={s} className="bg-background">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="sp-caption">
                    Caption ({draft.caption.length}/{PLATFORM_LIMIT[draft.platform]})
                  </label>
                  <textarea
                    id="sp-caption"
                    rows={7}
                    value={draft.caption}
                    onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                    className={`mt-2 resize-y ${inputClass}`}
                  />
                  {draft.caption.length > PLATFORM_LIMIT[draft.platform] && (
                    <p className="mt-2 text-xs text-destructive">
                      Too long for {PLATFORM_LABEL[draft.platform]}.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="sp-media">
                    Image URL {draft.platform === "instagram" ? "(required)" : ""}
                  </label>
                  <div className="mt-2">
                    <ImageField
                      id="sp-media"
                      value={draft.media_url}
                      folder="social"
                      onChange={(next) => setDraft({ ...draft, media_url: next })}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="sp-link">
                    Link URL
                  </label>
                  <input
                    id="sp-link"
                    value={draft.link_url}
                    onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="sp-when">
                    Scheduled for
                  </label>
                  <input
                    id="sp-when"
                    type="datetime-local"
                    value={draft.scheduled_for}
                    onChange={(e) => setDraft({ ...draft, scheduled_for: e.target.value })}
                    className={`mt-2 ${inputClass}`}
                  />
                </div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={onSave}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-60"
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
                <button
                  onClick={() => setDraft(null)}
                  className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Generate captions from a film or news post, then review and schedule them here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
