import { absoluteUrl } from "./seo";
import type { Platform } from "./social.captions";

export type PublishResult = { externalId: string | null; externalUrl: string | null };

export class MissingCredentials extends Error {
  constructor(platform: Platform, names: string[]) {
    super(`${platform} is not connected yet. Missing: ${names.join(", ")}.`);
    this.name = "MissingCredentials";
  }
}

function required(platform: Platform, names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const name of names) {
    const value = process.env[name];
    if (!value) missing.push(name);
    else out[name] = value;
  }
  if (missing.length) throw new MissingCredentials(platform, missing);
  return out;
}

export function credentialStatus(): Record<Platform, boolean> {
  return {
    x: Boolean(process.env["X_ACCESS_TOKEN"]),
    instagram: Boolean(
      process.env["INSTAGRAM_ACCESS_TOKEN"] && process.env["INSTAGRAM_USER_ID"],
    ),
    linkedin: Boolean(
      process.env["LINKEDIN_ACCESS_TOKEN"] && process.env["LINKEDIN_AUTHOR_URN"],
    ),
  };
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
