import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Play, Recycle, Save, Trash2, Zap } from "lucide-react";
import {
  clearSocialEvents,
  queueContentNow,
  runAutomationNow,
  runEvergreenNow,
  saveAutomationSettings,
  type SocialSnapshot,
} from "@/lib/social.functions";
import type { AdminSnapshot } from "@/lib/admin.functions";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/social.captions";
import type { AutomationSettings } from "@/lib/social.automation";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground";
const btn =
  "inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-[0.65rem] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50";

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-sm border border-border p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
      />
      <span>
        <span className="block text-sm text-foreground">{label}</span>
        {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}

function PlatformPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: Platform[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((p) => {
        const on = value.includes(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() =>
              onChange(
                (on ? value.filter((v) => v !== p) : [...value, p]).filter((v): v is Platform =>
                  (PLATFORMS as readonly string[]).includes(v),
                ),
              )
            }
            className={`rounded-sm border px-3 py-2 text-[0.65rem] uppercase tracking-[0.18em] transition-colors ${
              on
                ? "border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {PLATFORM_LABEL[p]}
          </button>
        );
      })}
    </div>
  );
}

export function AutomationPanel({
  admin,
  social,
  onDone,
}: {
  admin: AdminSnapshot;
  social: SocialSnapshot;
  onDone: () => unknown;
}) {
  const [draft, setDraft] = useState<AutomationSettings>(social.automation);
  const [busy, setBusy] = useState<string | null>(null);
  const [target, setTarget] = useState("");

  const save = useServerFn(saveAutomationSettings);
  const runAll = useServerFn(runAutomationNow);
  const runEvergreen = useServerFn(runEvergreenNow);
  const queueOne = useServerFn(queueContentNow);
  const clearLog = useServerFn(clearSocialEvents);

  const set = <K extends keyof AutomationSettings>(key: K, value: AutomationSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function run(name: string, fn: () => Promise<unknown>, success: (r: any) => string) {
    setBusy(name);
    try {
      const result = await fn();
      toast.success(success(result));
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That action failed.");
    } finally {
      setBusy(null);
    }
  }

  const contentOptions = [
    ...admin.films.map((f) => ({ value: `film:${f.id}`, label: `Film — ${f.title}` })),
    ...admin.posts.map((p) => ({ value: `post:${p.id}`, label: `News — ${p.title}` })),
  ];

  const missing = PLATFORMS.filter(
    (p) => draft.platforms.includes(p) && !social.credentials[p],
  );

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.16em] text-foreground">
            Auto-publishing rules
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            When a film or article is saved as published, Slate Safi writes the captions, tags the
            links for analytics and queues them for every channel selected here.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Toggle
            label="Auto-post new films"
            hint="Queues captions the moment a film goes live."
            checked={draft.auto_publish_films}
            onChange={(v) => set("auto_publish_films", v)}
          />
          <Toggle
            label="Auto-post news articles"
            hint="Every published article becomes a platform-tailored post."
            checked={draft.auto_publish_posts}
            onChange={(v) => set("auto_publish_posts", v)}
          />
        </div>

        <div className="space-y-2">
          <span className={labelClass}>Channels</span>
          <PlatformPicker value={draft.platforms} onChange={(v) => set("platforms", v)} />
          {missing.length ? (
            <p className="text-xs text-muted-foreground">
              Not connected yet: {missing.map((p) => PLATFORM_LABEL[p]).join(", ")}. Posts still
              queue and will send once the channel is connected in Settings.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className={labelClass}>Delay before posting (minutes)</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={draft.delay_minutes}
              onChange={(e) => set("delay_minutes", Number(e.target.value))}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Daily post cap</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={draft.daily_cap}
              onChange={(e) => set("daily_cap", Number(e.target.value))}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>Evergreen interval (days)</span>
            <input
              className={inputClass}
              type="number"
              min={1}
              value={draft.evergreen_interval_days}
              onChange={(e) => set("evergreen_interval_days", Number(e.target.value))}
            />
          </label>
        </div>

        <Toggle
          label="Evergreen recycling"
          hint="Re-promotes the least recently posted published title on every automation run."
          checked={draft.evergreen_enabled}
          onChange={(v) => set("evergreen_enabled", v)}
        />
        <div className="space-y-2">
          <span className={labelClass}>Evergreen channels</span>
          <PlatformPicker
            value={draft.evergreen_platforms}
            onChange={(v) => set("evergreen_platforms", v)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2">
            <span className={labelClass}>UTM source</span>
            <input
              className={inputClass}
              value={draft.utm_source}
              onChange={(e) => set("utm_source", e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>UTM medium</span>
            <input
              className={inputClass}
              value={draft.utm_medium}
              onChange={(e) => set("utm_medium", e.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className={labelClass}>UTM campaign</span>
            <input
              className={inputClass}
              value={draft.utm_campaign}
              onChange={(e) => set("utm_campaign", e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          onClick={() =>
            run("save", () => save({ data: draft }), () => "Automation rules saved.")
          }
        >
          {busy === "save" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save rules
        </button>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="font-display text-xl font-bold uppercase tracking-[0.16em] text-foreground">
          Run it now
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={btn}
            disabled={busy !== null}
            onClick={() =>
              run(
                "tick",
                () => runAll({ data: undefined }),
                (r) =>
                  r?.capped
                    ? "Daily cap reached — queue held."
                    : `Automation run complete — ${r?.processed ?? 0} post(s) sent.`,
              )
            }
          >
            {busy === "tick" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Run automation
          </button>
          <button
            type="button"
            className={btn}
            disabled={busy !== null}
            onClick={() =>
              run(
                "evergreen",
                () => runEvergreen({ data: undefined }),
                (r) =>
                  r?.created
                    ? `Recycled ${r.title ?? "content"} to ${r.created} channel(s).`
                    : "Nothing to recycle right now.",
              )
            }
          >
            {busy === "evergreen" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Recycle className="h-3.5 w-3.5" />
            )}
            Recycle evergreen
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-2">
            <span className={labelClass}>Queue a specific title</span>
            <select
              className={`${inputClass} min-w-[16rem]`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Select content…</option>
              {contentOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className={btn}
            disabled={busy !== null || !target}
            onClick={() => {
              const [kind, id] = target.split(":");
              return run(
                "queue",
                () =>
                  queueOne({
                    data: { source_type: kind as "film" | "post", source_id: id! },
                  }),
                (r) => (r?.created ? `Queued ${r.created} post(s).` : "Nothing queued."),
              );
            }}
          >
            {busy === "queue" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Queue now
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          For hands-off publishing, point your scheduler at{" "}
          <code className="text-foreground">POST /api/public/social/dispatch</code> every five
          minutes with the <code className="text-foreground">SOCIAL_CRON_SECRET</code> bearer token.
        </p>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.16em] text-foreground">
            Activity log
          </h2>
          <button
            type="button"
            className={btn}
            disabled={busy !== null || !social.events.length}
            onClick={() =>
              run("clear", () => clearLog({ data: undefined }), () => "Log cleared.")
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
        {social.events.length ? (
          <ul className="space-y-2">
            {social.events.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-baseline gap-3 rounded-sm border border-border px-4 py-3 text-sm"
              >
                <span className="text-[0.6rem] uppercase tracking-[0.18em] text-primary">
                  {e.kind}
                </span>
                <span className="text-foreground">{e.message ?? e.platform ?? "—"}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No automation activity yet. Publish a film or run the automation to see entries here.
          </p>
        )}
      </section>
    </div>
  );
}
