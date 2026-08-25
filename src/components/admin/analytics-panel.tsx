import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { saveSocialMetrics, type SocialSnapshot } from "@/lib/social.functions";
import { PLATFORM_LABEL, type Platform } from "@/lib/social.captions";
import { buildAnalytics } from "@/lib/social.automation";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary";
const btn =
  "inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="frame rounded-sm border border-border p-6">
      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type Draft = { impressions: string; likes: string; comments: string; shares: string; clicks: string };

export function AnalyticsPanel({
  social,
  onDone,
}: {
  social: SocialSnapshot;
  onDone: () => unknown;
}) {
  const save = useServerFn(saveSocialMetrics);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const analytics = useMemo(
    () => buildAnalytics(social.posts as any, social.metrics as any),
    [social.posts, social.metrics],
  );
  const maxDay = Math.max(1, ...analytics.timeline.map((d) => d.posted));
  const posted = social.posts.filter((p) => p.status === "posted");
  const metricFor = (id: string) => social.metrics.find((m) => m.post_id === id);

  function draftFor(id: string): Draft {
    const m = metricFor(id);
    return (
      drafts[id] ?? {
        impressions: String(m?.impressions ?? 0),
        likes: String(m?.likes ?? 0),
        comments: String(m?.comments ?? 0),
        shares: String(m?.shares ?? 0),
        clicks: String(m?.clicks ?? 0),
      }
    );
  }

  async function submit(id: string) {
    const d = draftFor(id);
    setBusy(id);
    try {
      await save({
        data: {
          post_id: id,
          impressions: Number(d.impressions) || 0,
          likes: Number(d.likes) || 0,
          comments: Number(d.comments) || 0,
          shares: Number(d.shares) || 0,
          clicks: Number(d.clicks) || 0,
        },
      });
      toast.success("Metrics updated.");
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save metrics.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <header>
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.16em] text-foreground">
            Social performance
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Delivery health from the publishing queue, plus reach and engagement per channel.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Posted" value={analytics.totals.posted} hint={`${analytics.totals.postedLast30} in the last 30 days`} />
          <Stat label="Delivery rate" value={`${analytics.totals.successRate}%`} hint={`${analytics.totals.failed} failed`} />
          <Stat label="Impressions" value={analytics.totals.impressions.toLocaleString()} hint={`${analytics.totals.clicks.toLocaleString()} link clicks`} />
          <Stat label="Engagement rate" value={`${analytics.totals.engagementRate}%`} hint={`${analytics.totals.engagements.toLocaleString()} interactions`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="In queue" value={analytics.totals.queued} hint="Drafts + scheduled" />
          <Stat label="Automated posts" value={analytics.totals.automated} hint="Created by automation rules" />
          <Stat label="Channels live" value={Object.values(social.credentials).filter(Boolean).length} hint="Connected via API keys" />
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h3 className="font-display text-lg font-bold uppercase tracking-[0.16em] text-foreground">
          By channel
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Posted</th>
                <th className="py-2 pr-4">Queued</th>
                <th className="py-2 pr-4">Failed</th>
                <th className="py-2 pr-4">Impressions</th>
                <th className="py-2 pr-4">Eng. rate</th>
                <th className="py-2">CTR</th>
              </tr>
            </thead>
            <tbody>
              {analytics.perPlatform.map((p) => (
                <tr key={p.platform} className="border-b border-border/60">
                  <td className="py-3 pr-4 text-foreground">{PLATFORM_LABEL[p.platform as Platform]}</td>
                  <td className="py-3 pr-4">{p.posted}</td>
                  <td className="py-3 pr-4">{p.queued}</td>
                  <td className="py-3 pr-4">{p.failed}</td>
                  <td className="py-3 pr-4">{p.impressions.toLocaleString()}</td>
                  <td className="py-3 pr-4">{p.engagementRate}%</td>
                  <td className="py-3">{p.clickRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h3 className="font-display text-lg font-bold uppercase tracking-[0.16em] text-foreground">
          Last 14 days
        </h3>
        <div className="flex items-end gap-2">
          {analytics.timeline.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-sm bg-primary/70"
                style={{ height: `${8 + (d.posted / maxDay) * 96}px` }}
                title={`${d.date}: ${d.posted} posted`}
              />
              <span className="text-[0.55rem] text-muted-foreground">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h3 className="font-display text-lg font-bold uppercase tracking-[0.16em] text-foreground">
          Record engagement
        </h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Paste the numbers from each platform's insights to keep the dashboard reporting real reach.
        </p>
        {posted.length ? (
          <ul className="space-y-3">
            {posted.map((p) => {
              const d = draftFor(p.id);
              const setField = (key: keyof Draft, value: string) =>
                setDrafts((prev) => ({ ...prev, [p.id]: { ...draftFor(p.id), [key]: value } }));
              return (
                <li key={p.id} className="rounded-sm border border-border p-4">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] text-primary">
                      {PLATFORM_LABEL[p.platform as Platform] ?? p.platform}
                    </span>
                    <span className="line-clamp-1 flex-1 text-sm text-foreground">{p.caption}</span>
                    {p.external_url ? (
                      <a
                        href={p.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-muted-foreground underline"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-6">
                    {(["impressions", "likes", "comments", "shares", "clicks"] as const).map((k) => (
                      <label key={k} className="space-y-1">
                        <span className="block text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                          {k}
                        </span>
                        <input
                          className={inputClass}
                          type="number"
                          min={0}
                          value={d[k]}
                          onChange={(e) => setField(k, e.target.value)}
                        />
                      </label>
                    ))}
                    <div className="flex items-end">
                      <button
                        type="button"
                        className={btn}
                        disabled={busy === p.id}
                        onClick={() => submit(p.id)}
                      >
                        {busy === p.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing has been published yet — once posts go out they appear here for reporting.
          </p>
        )}
      </section>
    </div>
  );
}
