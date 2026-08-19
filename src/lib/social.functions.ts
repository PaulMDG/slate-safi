import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { idInput } from "./content.schemas";
import {
  generateDraftsSchema,
  socialAccountSchema,
  socialPostSchema,
} from "./social.schemas";
import type { Tables } from "@/integrations/supabase/types";
import type { Platform } from "./social.captions";

type SupabaseLike = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  from: (table: string) => any;
};
type Ctx = { supabase: SupabaseLike; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Forbidden: admin access required.");
}

export type SocialSnapshot = {
  accounts: Tables<"social_accounts">[];
  posts: Tables<"social_posts">[];
  credentials: Record<Platform, boolean>;
};

export const loadSocialData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SocialSnapshot> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { credentialStatus } = await import("./social.server");
    const [accounts, posts] = await Promise.all([
      ctx.supabase.from("social_accounts").select("*").order("platform", { ascending: true }),
      ctx.supabase.from("social_posts").select("*").order("created_at", { ascending: false }),
    ]);
    return {
      accounts: accounts.data ?? [],
      posts: posts.data ?? [],
      credentials: credentialStatus(),
    };
  });

export const saveSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => socialPostSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const payload = {
      ...data,
      scheduled_for: data.scheduled_for ? new Date(data.scheduled_for).toISOString() : null,
    };
    if (payload.status === "scheduled" && !payload.scheduled_for) {
      payload.scheduled_for = new Date().toISOString();
    }
    const { error } = await ctx.supabase.from("social_posts").upsert(payload, { onConflict: "id" });
    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });

export const deleteSocialPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase.from("social_posts").delete().eq("id", data.id);
    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });

export const saveSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => socialAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { id, ...rest } = data;
    const { error } = await ctx.supabase.from("social_accounts").update(rest).eq("id", id);
    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });

/** Turns a film or news post into ready-to-review captions, one per platform. */
export const generateSocialDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => generateDraftsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { captionForFilm, captionForPost, mediaForFilm, mediaForPost } = await import(
      "./social.captions"
    );
    const { SITE_URL } = await import("./seo");

    const table = data.source_type === "film" ? "films" : "posts";
    const { data: row, error } = await ctx.supabase
      .from(table)
      .select("*")
      .eq("id", data.source_id)
      .maybeSingle();
    if (error) throw new Error((error as { message: string }).message);
    if (!row) throw new Error("That record no longer exists.");

    const isFilm = data.source_type === "film";
    const link = `${SITE_URL}/${isFilm ? "films" : "news"}/${row.slug}`;
    const media = isFilm ? mediaForFilm(row) : mediaForPost(row);
    const scheduledFor = data.scheduled_for ? new Date(data.scheduled_for).toISOString() : null;

    const rows = data.platforms.map((platform) => ({
      platform,
      status: scheduledFor ? "scheduled" : "draft",
      caption: isFilm ? captionForFilm(row, platform) : captionForPost(row, platform),
      media_url: media,
      link_url: link,
      source_type: data.source_type,
      source_id: data.source_id,
      scheduled_for: scheduledFor,
      posted_at: null,
      external_id: null,
      external_url: null,
      error: null,
      attempts: 0,
    }));

    const { error: upsertError } = await ctx.supabase
      .from("social_posts")
      .upsert(rows, { onConflict: "platform,source_type,source_id" });
    if (upsertError) throw new Error((upsertError as { message: string }).message);
    return { created: rows.length };
  });

/** Publishes one queued post immediately. */
export const publishSocialPostNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { data: row, error } = await ctx.supabase
      .from("social_posts")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error((error as { message: string }).message);
    if (!row) throw new Error("That post no longer exists.");

    const { publishToPlatform } = await import("./social.server");
    try {
      const result = await publishToPlatform(row.platform as Platform, {
        caption: row.caption as string,
        mediaUrl: row.media_url as string | null,
        linkUrl: row.link_url as string | null,
      });
      await ctx.supabase
        .from("social_posts")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
          external_id: result.externalId,
          external_url: result.externalUrl,
          error: null,
          attempts: (row.attempts as number) + 1,
        })
        .eq("id", data.id);
      return { ok: true, url: result.externalUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publishing failed.";
      await ctx.supabase
        .from("social_posts")
        .update({ status: "failed", error: message, attempts: (row.attempts as number) + 1 })
        .eq("id", data.id);
      throw new Error(message);
    }
  });

/** Runs the scheduler on demand from the dashboard. */
export const runSocialQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { dispatchDuePosts } = await import("./social.server");
    return dispatchDuePosts(10);
  });
