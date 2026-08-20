import { useMemo } from "react";
import type { AdminSnapshot } from "@/lib/admin.functions";
import type { SocialSnapshot } from "@/lib/social.functions";
import { PLATFORM_LABEL, type Platform } from "@/lib/social.captions";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="frame rounded-sm border border-border p-6">
      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function daysAgo(n: number) {
  return Date.now() - n * 86_400_000;
}

export function OverviewPanel({
  data,
  social,
}: {
  data: AdminSnapshot;
  social: SocialSnapshot | undefined;
}) {
  const stats = useMemo(() => {
    const subs = data.subscribers.filter((s) => !s.unsubscribed && !s.is_spam);
    const subs30 = subs.filter((s) => new Date(s.created_at).getTime() > daysAgo(30));
    const newEnquiries = data.contact.filter((c) => (c.status ?? "new") === "new" && !c.is_spam);
    const flagged = data.contact.filter((c) => c.is_spam);
    const posts = social?.posts ?? [];
    return {
      films: data.films.length,
      publishedFilms: data.films.filter((f) => f.published).length,
      news: data.posts.length,
      draftNews: data.posts.filter((p) => !p.published).length,
      subscribers: subs.length,
      subs30: subs30.length,
      enquiries: data.contact.length,
      newEnquiries: newEnquiries.length,
      flagged: flagged.length,
      queued: posts.filter((p) => p.status === "draft" || p.status === "scheduled").length,
      posted: posts.filter((p) => p.status === "posted").length,
      failed: posts.filter((p) => p.status === "failed").length,
    };
  }, [data, social]);

  const recentEnquiries = data.contact.slice(0, 5);
  const upcoming = (social?.posts ?? [])
    .filter((p) => p.status === "scheduled")
    .sort((a, b) => (a.scheduled_for ?? "").localeCompare(b.scheduled_for ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-14">
      <div>
        <h2 className="eyebrow">Audience</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Newsletter subscribers"
            value={stats.subscribers}
            hint={`+${stats.subs30} in the last 30 days`}
          />
          <Stat
            label="Enquiries"
            value={stats.enquiries}
            hint={`${stats.newEnquiries} awaiting review · ${stats.flagged} flagged as spam`}
          />
          <Stat
            label="Films"
            value={stats.films}
            hint={`${stats.publishedFilms} live on the site`}
          />
          <Stat label="News posts" value={stats.news} hint={`${stats.draftNews} still in draft`} />
        </div>
      </div>

      <div>
        <h2 className="eyebrow">Social publishing</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Queued" value={stats.queued} hint="Drafts and scheduled posts" />
          <Stat label="Published" value={stats.posted} />
          <Stat label="Failed" value={stats.failed} hint="Retry from the Social tab" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {(["x", "instagram", "linkedin"] as Platform[]).map((p) => {
            const connected = social?.credentials[p];
            return (
              <span
                key={p}
                className={`rounded-sm border px-3 py-2 text-[0.6rem] uppercase tracking-[0.18em] ${
                  connected ? "border-primary text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {PLATFORM_LABEL[p]} — {connected ? "connected" : "not connected"}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="eyebrow">Latest enquiries</h2>
          <ul className="mt-6 space-y-3">
            {recentEnquiries.map((row) => (
              <li key={row.id} className="rounded-sm border border-border px-4 py-3 text-sm">
                <span className="font-display font-bold">{row.name}</span>{" "}
                <span className="text-muted-foreground">· {row.inquiry_type}</span>
                <span className="block text-xs text-muted-foreground">
                  {new Date(row.created_at).toISOString().slice(0, 16).replace("T", " ")} UTC
                </span>
              </li>
            ))}
            {recentEnquiries.length === 0 && (
              <li className="text-sm text-muted-foreground">No enquiries yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="eyebrow">Next scheduled posts</h2>
          <ul className="mt-6 space-y-3">
            {upcoming.map((row) => (
              <li key={row.id} className="rounded-sm border border-border px-4 py-3 text-sm">
                <span className="font-display font-bold">
                  {PLATFORM_LABEL[row.platform as Platform]}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {row.scheduled_for
                    ? `${row.scheduled_for.slice(0, 16).replace("T", " ")} UTC`
                    : "unscheduled"}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {row.caption.slice(0, 90)}
                </span>
              </li>
            ))}
            {upcoming.length === 0 && (
              <li className="text-sm text-muted-foreground">Nothing scheduled.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
