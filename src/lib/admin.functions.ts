import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  creditSchema,
  filmSchema,
  gallerySchema,
  idInput,
  postSchema,
  pressSchema,
  submissionStatusSchema,
} from "./content.schemas";
import type { Tables } from "@/integrations/supabase/types";

type AdminContext = { supabase: SupabaseLike; userId: string };
type SupabaseLike = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  from: (table: string) => any;
};

async function assertAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new Error("Forbidden: admin access required.");
}

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await (context.supabase as unknown as SupabaseLike).rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { userId: context.userId, isAdmin: data === true };
  });

export type AdminSnapshot = {
  films: Tables<"films">[];
  credits: Tables<"film_credits">[];
  gallery: Tables<"film_gallery">[];
  posts: Tables<"posts">[];
  press: Tables<"press_items">[];
  contact: Tables<"contact_submissions">[];
  subscribers: Tables<"newsletter_subscribers">[];
};

export const loadAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSnapshot> => {
    const ctx = context as unknown as AdminContext;
    await assertAdmin(ctx);
    const sb = ctx.supabase;
    const [films, credits, gallery, posts, press, contact, subscribers] = await Promise.all([
      sb.from("films").select("*").order("sort_order", { ascending: true }),
      sb.from("film_credits").select("*").order("sort_order", { ascending: true }),
      sb.from("film_gallery").select("*").order("sort_order", { ascending: true }),
      sb.from("posts").select("*").order("published_at", { ascending: false }),
      sb.from("press_items").select("*").order("sort_order", { ascending: true }),
      sb.from("contact_submissions").select("*").order("created_at", { ascending: false }),
      sb.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
    ]);
    return {
      films: films.data ?? [],
      credits: credits.data ?? [],
      gallery: gallery.data ?? [],
      posts: posts.data ?? [],
      press: press.data ?? [],
      contact: contact.data ?? [],
      subscribers: subscribers.data ?? [],
    };
  });

function upsertFn<T extends { id?: string }>(
  table: string,
  parse: (data: unknown) => T,
) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((data: unknown) => parse(data))
    .handler(async ({ data, context }) => {
      const ctx = context as unknown as AdminContext;
      await assertAdmin(ctx);
      const { error } = await ctx.supabase.from(table).upsert(data, { onConflict: "id" });
      if (error) throw new Error((error as { message: string }).message);
      return { ok: true };
    });
}

function deleteFn(table: string) {
  return createServerFn({ method: "POST" })
    .middleware([requireSupabaseAuth])
    .inputValidator((data: unknown) => idInput.parse(data))
    .handler(async ({ data, context }) => {
      const ctx = context as unknown as AdminContext;
      await assertAdmin(ctx);
      const { error } = await ctx.supabase.from(table).delete().eq("id", data.id);
      if (error) throw new Error((error as { message: string }).message);
      return { ok: true };
    });
}

export const saveFilm = upsertFn("films", (d) => filmSchema.parse(d));
export const deleteFilm = deleteFn("films");
export const saveCredit = upsertFn("film_credits", (d) => creditSchema.parse(d));
export const deleteCredit = deleteFn("film_credits");
export const saveGalleryImage = upsertFn("film_gallery", (d) => gallerySchema.parse(d));
export const deleteGalleryImage = deleteFn("film_gallery");
export const savePost = upsertFn("posts", (d) => postSchema.parse(d));
export const deletePost = deleteFn("posts");
export const savePressItem = upsertFn("press_items", (d) => pressSchema.parse(d));
export const deletePressItem = deleteFn("press_items");

export const updateSubmissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submissionStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AdminContext;
    await assertAdmin(ctx);
    const { error } = await ctx.supabase
      .from("contact_submissions")
      .update({ status: data.status, internal_notes: data.internal_notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error((error as { message: string }).message);
    return { ok: true };
  });
