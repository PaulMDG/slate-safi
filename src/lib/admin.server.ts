import type { Tables } from "@/integrations/supabase/types";

export type SupabaseLike = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  from: (table: string) => any;
};

export type AdminSnapshot = {
  films: Tables<"films">[];
  credits: Tables<"film_credits">[];
  gallery: Tables<"film_gallery">[];
  posts: Tables<"posts">[];
  press: Tables<"press_items">[];
  contact: Tables<"contact_submissions">[];
  subscribers: Tables<"newsletter_subscribers">[];
  homepage: Tables<"homepage_content"> | null;
};

export async function isAdmin(sb: SupabaseLike, userId: string) {
  // Role lookup goes through the user_roles table (RLS: users can read their own
  // roles). The has_role() helper is server-internal and no longer API-callable.
  const { data } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

export async function assertAdmin(sb: SupabaseLike, userId: string) {
  if (!(await isAdmin(sb, userId))) throw new Error("Forbidden: admin access required.");
}

export async function fetchAdminSnapshot(sb: SupabaseLike): Promise<AdminSnapshot> {
  const [films, credits, gallery, posts, press, contact, subscribers, homepage] = await Promise.all([
    sb.from("films").select("*").order("sort_order", { ascending: true }),
    sb.from("film_credits").select("*").order("sort_order", { ascending: true }),
    sb.from("film_gallery").select("*").order("sort_order", { ascending: true }),
    sb.from("posts").select("*").order("published_at", { ascending: false }),
    sb.from("press_items").select("*").order("sort_order", { ascending: true }),
    sb.from("contact_submissions").select("*").order("created_at", { ascending: false }),
    sb.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
    sb.from("homepage_content").select("*").limit(1).maybeSingle(),
  ]);
  return {
    films: films.data ?? [],
    credits: credits.data ?? [],
    gallery: gallery.data ?? [],
    posts: posts.data ?? [],
    press: press.data ?? [],
    contact: contact.data ?? [],
    subscribers: subscribers.data ?? [],
    homepage: homepage.data ?? null,
  };
}

/** Upserts one row on behalf of a verified admin. */
export async function adminUpsert(
  sb: SupabaseLike,
  userId: string,
  table: string,
  row: Record<string, unknown>,
) {
  await assertAdmin(sb, userId);
  const payload = { ...row };
  if (!payload.id) delete payload.id;
  const { error } = await sb.from(table).upsert(payload, { onConflict: "id" });
  if (error) throw new Error((error as { message: string }).message);
  return { ok: true };
}

/** Deletes one row on behalf of a verified admin. */
export async function adminDelete(sb: SupabaseLike, userId: string, table: string, id: string) {
  await assertAdmin(sb, userId);
  const { error } = await sb.from(table).delete().eq("id", id);
  if (error) throw new Error((error as { message: string }).message);
  return { ok: true };
}

/**
 * Upserts a film or post, then hands it to the social automation so a
 * newly published item queues itself across the connected channels.
 */
export async function adminUpsertContent(
  sb: SupabaseLike,
  userId: string,
  table: "films" | "posts",
  row: Record<string, unknown>,
) {
  await assertAdmin(sb, userId);
  const payload = { ...row };
  if (!payload.id) delete payload.id;
  const { data, error } = await sb
    .from(table)
    .upsert(payload, { onConflict: "id" })
    .select("id,published")
    .maybeSingle();
  if (error) throw new Error((error as { message: string }).message);

  let automation: { created: number; skipped?: string; error?: string } = {
    created: 0,
    skipped: "unpublished",
  };
  if (data?.published) {
    try {
      const { queueForContent } = await import("./social.server");
      automation = (await queueForContent(sb as any, {
        sourceType: table === "films" ? "film" : "post",
        sourceId: data.id,
      })) as { created: number; skipped?: string };
    } catch (err) {
      automation = { created: 0, error: err instanceof Error ? err.message : "queue failed" };
    }
  }
  return { ok: true, automation };
}
