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
import type { AdminSnapshot } from "./admin.server";

export type { AdminSnapshot };

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isAdmin } = await import("./admin.server");
    return {
      userId: context.userId,
      isAdmin: await isAdmin(context.supabase as any, context.userId),
    };
  });

export const loadAdminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSnapshot> => {
    const { assertAdmin, fetchAdminSnapshot } = await import("./admin.server");
    await assertAdmin(context.supabase as any, context.userId);
    return fetchAdminSnapshot(context.supabase as any);
  });

export const saveFilm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => filmSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { adminUpsert } = await import("./admin.server");
    return adminUpsert(context.supabase as any, context.userId, "films", data);
  });

export const deleteFilm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    const { adminDelete } = await import("./admin.server");
    return adminDelete(context.supabase as any, context.userId, "films", data.id);
  });

export const saveCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => creditSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { adminUpsert } = await import("./admin.server");
    return adminUpsert(context.supabase as any, context.userId, "film_credits", data);
  });

export const deleteCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    const { adminDelete } = await import("./admin.server");
    return adminDelete(context.supabase as any, context.userId, "film_credits", data.id);
  });

export const saveGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => gallerySchema.parse(data))
  .handler(async ({ data, context }) => {
    const { adminUpsert } = await import("./admin.server");
    return adminUpsert(context.supabase as any, context.userId, "film_gallery", data);
  });

export const deleteGalleryImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    const { adminDelete } = await import("./admin.server");
    return adminDelete(context.supabase as any, context.userId, "film_gallery", data.id);
  });

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => postSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { adminUpsert } = await import("./admin.server");
    return adminUpsert(context.supabase as any, context.userId, "posts", data);
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    const { adminDelete } = await import("./admin.server");
    return adminDelete(context.supabase as any, context.userId, "posts", data.id);
  });

export const savePressItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pressSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { adminUpsert } = await import("./admin.server");
    return adminUpsert(context.supabase as any, context.userId, "press_items", data);
  });

export const deletePressItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idInput.parse(data))
  .handler(async ({ data, context }) => {
    const { adminDelete } = await import("./admin.server");
    return adminDelete(context.supabase as any, context.userId, "press_items", data.id);
  });

export const updateSubmissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => submissionStatusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase as any, context.userId);
    const { error } = await (context.supabase as any)
      .from("contact_submissions")
      .update({ status: data.status, internal_notes: data.internal_notes ?? null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
