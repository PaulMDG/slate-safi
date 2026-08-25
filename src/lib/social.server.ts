import { absoluteUrl } from "./seo";
import type { Platform } from "./social.captions";

export type PublishResult = { externalId: string | null; externalUrl: string | null };

export class MissingCredentials extends Error {
  constructor(platform: Platform, names: string[]) {
    super(`${platform} is not connected yet. Missing: ${names.join(", ")}.`);
    this.name = "MissingCredentials";
  }
}

async function required(platform: Platform, names: string[]): Promise<Record<string, string>> {
  const { loadCredentialValues } = await import("./social.credentials.server");
  const values = await loadCredentialValues();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of names) {
    const value = values[name] ?? process.env[name];
    if (!value) missing.push(name);
    else out[name] = value;
  }
  if (missing.length) throw new MissingCredentials(platform, missing);
  return out;
}

/** Per-channel connection flags, including keys saved from the dashboard. */
export async function credentialStatus(): Promise<Record<string, boolean>> {
  const { channelStatus } = await import("./social.credentials.server");
  return channelStatus();
}


async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  return `${response.status} ${response.statusText}${text ? ` — ${text.slice(0, 400)}` : ""}`;
}

async function publishToX(caption: string): Promise<PublishResult> {
  const env = required("x", ["X_ACCESS_TOKEN"]);
  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env["X_ACCESS_TOKEN"]}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: caption }),
  });
  if (!response.ok) throw new Error(`X rejected the post: ${await readError(response)}`);
  const body = (await response.json()) as { data?: { id?: string } };
  const id = body.data?.id ?? null;
  return { externalId: id, externalUrl: id ? `https://x.com/i/web/status/${id}` : null };
}

async function publishToInstagram(caption: string, mediaUrl: string | null): Promise<PublishResult> {
  const env = required("instagram", ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID"]);
  const image = absoluteUrl(mediaUrl);
  if (!image) throw new Error("Instagram posts need an image. Add a media URL first.");

  const userId = env["INSTAGRAM_USER_ID"];
  const token = env["INSTAGRAM_ACCESS_TOKEN"]!;
  const createUrl = new URL(`https://graph.facebook.com/v21.0/${userId}/media`);
  createUrl.searchParams.set("image_url", image);
  createUrl.searchParams.set("caption", caption);
  createUrl.searchParams.set("access_token", token);

  const created = await fetch(createUrl, { method: "POST" });
  if (!created.ok) throw new Error(`Instagram rejected the image: ${await readError(created)}`);
  const container = (await created.json()) as { id?: string };
  if (!container.id) throw new Error("Instagram did not return a media container id.");

  const publishUrl = new URL(`https://graph.facebook.com/v21.0/${userId}/media_publish`);
  publishUrl.searchParams.set("creation_id", container.id);
  publishUrl.searchParams.set("access_token", token);
  const published = await fetch(publishUrl, { method: "POST" });
  if (!published.ok) throw new Error(`Instagram rejected the post: ${await readError(published)}`);
  const result = (await published.json()) as { id?: string };
  const id = result.id ?? null;
  return { externalId: id, externalUrl: id ? `https://www.instagram.com/p/${id}` : null };
}

async function publishToLinkedIn(
  caption: string,
  linkUrl: string | null,
): Promise<PublishResult> {
  const env = required("linkedin", ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_AUTHOR_URN"]);
  const author = env["LINKEDIN_AUTHOR_URN"];
  const share: Record<string, unknown> = { shareCommentary: { text: caption } };
  if (linkUrl) {
    share["shareMediaCategory"] = "ARTICLE";
    share["media"] = [{ status: "READY", originalUrl: linkUrl }];
  } else {
    share["shareMediaCategory"] = "NONE";
  }

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env["LINKEDIN_ACCESS_TOKEN"]}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: { "com.linkedin.ugc.ShareContent": share },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });
  if (!response.ok) throw new Error(`LinkedIn rejected the post: ${await readError(response)}`);
  const id = response.headers.get("x-restli-id") ?? null;
  return {
    externalId: id,
    externalUrl: id ? `https://www.linkedin.com/feed/update/${id}` : null,
  };
}

export async function publishToPlatform(
  platform: Platform,
  input: { caption: string; mediaUrl: string | null; linkUrl: string | null },
): Promise<PublishResult> {
  if (platform === "x") return publishToX(input.caption);
  if (platform === "instagram") return publishToInstagram(input.caption, input.mediaUrl);
  return publishToLinkedIn(input.caption, input.linkUrl);
}

/** Sends every scheduled post whose time has arrived. Used by the dashboard and the cron route. */
export async function dispatchDuePosts(limit = 10) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: due } = await supabaseAdmin
    .from("social_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  const results: { id: string; platform: string; ok: boolean; error?: string }[] = [];

  for (const row of due ?? []) {
    await supabaseAdmin.from("social_posts").update({ status: "posting" }).eq("id", row.id);
    try {
      const result = await publishToPlatform(row.platform as Platform, {
        caption: row.caption,
        mediaUrl: row.media_url,
        linkUrl: row.link_url,
      });
      await supabaseAdmin
        .from("social_posts")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
          external_id: result.externalId,
          external_url: result.externalUrl,
          error: null,
          attempts: row.attempts + 1,
        })
        .eq("id", row.id);
      results.push({ id: row.id, platform: row.platform, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown publishing error.";
      await supabaseAdmin
        .from("social_posts")
        .update({ status: "failed", error: message, attempts: row.attempts + 1 })
        .eq("id", row.id);
      results.push({ id: row.id, platform: row.platform, ok: false, error: message });
    }
  }

  return { processed: results.length, results };
}

/* ------------------------------------------------------------------ *
 * Automation: auto-queue on publish, evergreen recycling, event log
 * ------------------------------------------------------------------ */

type Sb = { from: (table: string) => any };

export async function loadAutomation(sb: Sb) {
  const { DEFAULT_AUTOMATION } = await import("./social.automation");
  const { data } = await sb.from("social_automation").select("*").limit(1).maybeSingle();
  return { ...DEFAULT_AUTOMATION, ...(data ?? {}) };
}

export async function logSocialEvent(
  sb: Sb,
  event: { kind: string; platform?: string | null; post_id?: string | null; message?: string | null },
) {
  await sb.from("social_events").insert({
    kind: event.kind,
    platform: event.platform ?? null,
    post_id: event.post_id ?? null,
    message: event.message ?? null,
  });
}

/**
 * Builds and queues platform-tailored posts for one film or news article.
 * Called automatically whenever an admin publishes content.
 */
export async function queueForContent(
  sb: Sb,
  input: { sourceType: "film" | "post"; sourceId: string; force?: boolean },
) {
  const { captionForFilm, captionForPost, mediaForFilm, mediaForPost } = await import(
    "./social.captions"
  );
  const { taggedLink, validPlatforms } = await import("./social.automation");
  const { SITE_URL } = await import("./seo");

  const settings = await loadAutomation(sb);
  const isFilm = input.sourceType === "film";
  const enabled = isFilm ? settings.auto_publish_films : settings.auto_publish_posts;
  if (!enabled && !input.force) return { created: 0, skipped: "automation-off" as const };

  const platforms = validPlatforms(settings.platforms);
  if (!platforms.length) return { created: 0, skipped: "no-platforms" as const };

  const { data: row } = await sb
    .from(isFilm ? "films" : "posts")
    .select("*")
    .eq("id", input.sourceId)
    .maybeSingle();
  if (!row) return { created: 0, skipped: "missing" as const };
  if (!row.published && !input.force) return { created: 0, skipped: "unpublished" as const };

  // Never re-queue content that already has posts unless explicitly forced.
  const { data: existing } = await sb
    .from("social_posts")
    .select("id")
    .eq("source_type", input.sourceType)
    .eq("source_id", input.sourceId);
  if (!input.force && (existing ?? []).length) {
    return { created: 0, skipped: "already-queued" as const };
  }

  const scheduledFor = new Date(
    Date.now() + Math.max(0, settings.delay_minutes) * 60_000,
  ).toISOString();
  const media = isFilm ? mediaForFilm(row) : mediaForPost(row);
  const baseLink = `${SITE_URL}/${isFilm ? "films" : "news"}/${row.slug}`;

  const rows = platforms.map((platform) => ({
    platform,
    status: "scheduled",
    caption: isFilm ? captionForFilm(row, platform) : captionForPost(row, platform),
    media_url: media,
    link_url: taggedLink(baseLink, platform, settings),
    source_type: input.sourceType,
    source_id: input.sourceId,
    scheduled_for: scheduledFor,
    posted_at: null,
    external_id: null,
    external_url: null,
    error: null,
    attempts: 0,
  }));

  const { error } = await sb
    .from("social_posts")
    .upsert(rows, { onConflict: "platform,source_type,source_id" });
  if (error) throw new Error((error as { message: string }).message);

  await logSocialEvent(sb, {
    kind: "queued",
    message: `Auto-queued ${rows.length} post(s) for ${isFilm ? "film" : "news"} “${row.title}”.`,
  });
  return { created: rows.length };
}

/** Re-promotes older published content on a rolling schedule. */
export async function runEvergreen(sb: Sb, force = false) {
  const { validPlatforms, taggedLink } = await import("./social.automation");
  const { captionForFilm, captionForPost, mediaForFilm, mediaForPost } = await import(
    "./social.captions"
  );
  const { SITE_URL } = await import("./seo");

  const settings = await loadAutomation(sb);
  if (!settings.evergreen_enabled && !force) return { created: 0, skipped: "evergreen-off" as const };
  const platforms = validPlatforms(settings.evergreen_platforms);
  if (!platforms.length) return { created: 0, skipped: "no-platforms" as const };

  const cutoff = new Date(
    Date.now() - Math.max(1, settings.evergreen_interval_days) * 86_400_000,
  ).toISOString();

  const [films, posts] = await Promise.all([
    sb.from("films").select("*").eq("published", true),
    sb.from("posts").select("*").eq("published", true).lte("published_at", cutoff),
  ]);

  const candidates: { kind: "film" | "post"; row: any }[] = [
    ...(films.data ?? []).map((row: any) => ({ kind: "film" as const, row })),
    ...(posts.data ?? []).map((row: any) => ({ kind: "post" as const, row })),
  ];
  if (!candidates.length) return { created: 0, skipped: "no-content" as const };

  // Pick the item whose last post is oldest (or never posted).
  const { data: recent } = await sb
    .from("social_posts")
    .select("source_type,source_id,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const lastSeen = new Map<string, number>();
  for (const r of recent ?? []) {
    const key = `${r.source_type}:${r.source_id}`;
    if (!lastSeen.has(key)) lastSeen.set(key, new Date(r.created_at).getTime());
  }

  const scored = candidates
    .map((c) => ({ ...c, last: lastSeen.get(`${c.kind}:${c.row.id}`) ?? 0 }))
    .sort((a, b) => a.last - b.last);
  const pick = scored[0]!;
  const intervalMs = Math.max(1, settings.evergreen_interval_days) * 86_400_000;
  if (!force && pick.last > Date.now() - intervalMs) {
    return { created: 0, skipped: "too-soon" as const };
  }

  const isFilm = pick.kind === "film";
  const baseLink = `${SITE_URL}/${isFilm ? "films" : "news"}/${pick.row.slug}`;
  const media = isFilm ? mediaForFilm(pick.row) : mediaForPost(pick.row);
  const rows = platforms.map((platform) => ({
    platform,
    status: "scheduled",
    caption: isFilm ? captionForFilm(pick.row, platform) : captionForPost(pick.row, platform),
    media_url: media,
    link_url: taggedLink(baseLink, platform, { ...settings, utm_campaign: `${settings.utm_campaign}-evergreen` }),
    source_type: pick.kind,
    source_id: pick.row.id,
    scheduled_for: new Date().toISOString(),
    posted_at: null,
    external_id: null,
    external_url: null,
    error: null,
    attempts: 0,
  }));

  const { error } = await sb
    .from("social_posts")
    .upsert(rows, { onConflict: "platform,source_type,source_id" });
  if (error) throw new Error((error as { message: string }).message);

  await logSocialEvent(sb, {
    kind: "evergreen",
    message: `Recycled “${pick.row.title}” to ${rows.length} channel(s).`,
  });
  return { created: rows.length, title: pick.row.title as string };
}

/** Full automation tick: evergreen top-up, then send everything that is due. */
export async function runAutomationTick(limit = 20) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sb = supabaseAdmin as unknown as Sb;
  const settings = await loadAutomation(sb);

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { data: recentPosted } = await sb
    .from("social_posts")
    .select("id")
    .eq("status", "posted")
    .gte("posted_at", since);
  const usedToday = (recentPosted ?? []).length;
  const remaining = Math.max(0, settings.daily_cap - usedToday);

  let evergreen: Awaited<ReturnType<typeof runEvergreen>> | null = null;
  if (settings.evergreen_enabled && remaining > 0) {
    evergreen = await runEvergreen(sb);
  }

  if (remaining <= 0) {
    await logSocialEvent(sb, {
      kind: "capped",
      message: `Daily cap of ${settings.daily_cap} posts reached — holding the queue.`,
    });
    return { processed: 0, results: [], capped: true, evergreen };
  }

  const dispatched = await dispatchDuePosts(Math.min(limit, remaining));
  for (const r of dispatched.results) {
    await logSocialEvent(sb, {
      kind: r.ok ? "published" : "failed",
      platform: r.platform,
      post_id: r.id,
      message: r.error ?? null,
    });
  }
  return { ...dispatched, capped: false, evergreen };
}
