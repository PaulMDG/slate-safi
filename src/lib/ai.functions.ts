import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiKitSchema, aiQueueSchema, credentialsSchema } from "./social.schemas";
import type { MarketingKit } from "./ai.server";

type SupabaseLike = { from: (table: string) => any };
type Ctx = { supabase: SupabaseLike; userId: string };

async function assertAdmin(context: Ctx) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: admin access required.");
}

/** Generates titles, SEO copy, hashtags, captions and trend angles for one item. */
export const generateMarketingKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => aiKitSchema.parse(data))
  .handler(async ({ data, context }): Promise<MarketingKit> => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { generateMarketingKit: run } = await import("./ai.server");

    let title = data.topic ?? "";
    let summary: string | null = null;
    let extra: string | null = null;

    if (data.source_type !== "topic" && data.source_id) {
      const table = data.source_type === "film" ? "films" : "posts";
      const { data: row } = await ctx.supabase
        .from(table)
        .select("*")
        .eq("id", data.source_id)
        .maybeSingle();
      if (!row) throw new Error("That record no longer exists.");
      title = row.title;
      summary = data.source_type === "film" ? (row.tagline ?? row.logline) : row.excerpt;
      extra =
        data.source_type === "film"
          ? [row.logline, row.synopsis, `Status: ${row.status}`].filter(Boolean).join("\n")
          : [row.category, row.body?.slice?.(0, 1200)].filter(Boolean).join("\n");
    }

    if (!title) throw new Error("Give the AI a title or pick a film / article first.");

    const kit = await run({
      kind: data.source_type,
      title,
      summary,
      extra,
      angle: data.angle ?? null,
      audience: data.audience ?? null,
    });

    await ctx.supabase.from("social_events").insert({
      kind: "ai",
      message: `AI marketing kit generated for “${title}”.`,
    });
    return kit;
  });

/** Turns AI captions into queued posts for the selected channels. */
export const queueAiCaptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => aiQueueSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { composeCaption } = await import("./ai.server");
    const { PLATFORM_LIMIT, mediaForFilm, mediaForPost } = await import("./social.captions");
    const { taggedLink } = await import("./social.automation");
    const { loadAutomation } = await import("./social.server");
    const { SITE_URL } = await import("./seo");

    const table = data.source_type === "film" ? "films" : "posts";
    const { data: row } = await ctx.supabase
      .from(table)
      .select("*")
      .eq("id", data.source_id)
      .maybeSingle();
    if (!row) throw new Error("That record no longer exists.");

    const settings = await loadAutomation(ctx.supabase as any);
    const baseLink = `${SITE_URL}/${data.source_type === "film" ? "films" : "news"}/${row.slug}`;
    const media = data.source_type === "film" ? mediaForFilm(row) : mediaForPost(row);
    const scheduledFor = data.schedule ? new Date().toISOString() : null;

    const rows = data.items.map((item) => ({
      platform: item.platform,
      status: data.schedule ? "scheduled" : "draft",
      caption: composeCaption(
        item.caption,
        item.hashtags ?? [],
        taggedLink(baseLink, item.platform, settings),
        PLATFORM_LIMIT[item.platform],
      ),
      media_url: media,
      link_url: taggedLink(baseLink, item.platform, settings),
      source_type: data.source_type,
      source_id: data.source_id,
      scheduled_for: scheduledFor,
      posted_at: null,
      external_id: null,
      external_url: null,
      error: null,
      attempts: 0,
    }));

    const { error } = await ctx.supabase
      .from("social_posts")
      .upsert(rows, { onConflict: "platform,source_type,source_id" });
    if (error) throw new Error((error as { message: string }).message);

    await ctx.supabase.from("social_events").insert({
      kind: "ai",
      message: `AI captions queued to ${rows.length} channel(s) for “${row.title}”.`,
    });
    return { created: rows.length };
  });

/** Stores or clears the API access keys for one channel. */
export const saveChannelCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => credentialsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as Ctx;
    await assertAdmin(ctx);
    const { saveCredentials, credentialKeyStatus } = await import("./social.credentials.server");
    await saveCredentials(data.platform, data.entries, ctx.userId);
    return { ok: true, keys: await credentialKeyStatus() };
  });
