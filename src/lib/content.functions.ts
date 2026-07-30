import { createServerFn } from "@tanstack/react-start";
import { slugInput, emailSchema, contactSchema } from "./content.schemas";

export const listFilms = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("./content.server");
  const { data, error } = await publicSupabase()
    .from("films")
    .select(
      "id, slug, title, tagline, logline, status, release_year, runtime_minutes, genre, language, poster_url, hero_image_url, featured, sort_order",
    )
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getFilm = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slugInput.parse(data))
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("./content.server");
    const supabase = publicSupabase();
    const { data: film, error } = await supabase
      .from("films")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!film) return null;

    const [credits, gallery, press] = await Promise.all([
      supabase
        .from("film_credits")
        .select("id, name, role, credit_type, character_name, photo_url")
        .eq("film_id", film.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("film_gallery")
        .select("id, image_url, caption")
        .eq("film_id", film.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("press_items")
        .select("id, kind, title, outlet, quote, year")
        .eq("published", true)
        .order("sort_order", { ascending: true }),
    ]);

    return {
      film,
      credits: credits.data ?? [],
      gallery: gallery.data ?? [],
      press: press.data ?? [],
    };
  });

export const listPress = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("./content.server");
  const { data, error } = await publicSupabase()
    .from("press_items")
    .select("id, kind, title, outlet, quote, year")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { publicSupabase } = await import("./content.server");
  const { data, error } = await publicSupabase()
    .from("posts")
    .select("id, slug, title, excerpt, cover_image_url, author, category, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slugInput.parse(data))
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("./content.server");
    const { data: post, error } = await publicSupabase()
      .from("posts")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return post;
  });

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailSchema.parse(data))
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("./content.server");
    const { error } = await publicSupabase()
      .from("newsletter_subscribers")
      .insert({ email: data.email.toLowerCase(), source: data.source ?? "website" });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("./content.server");
    const { error } = await publicSupabase().from("contact_submissions").insert({
      name: data.name,
      email: data.email.toLowerCase(),
      organisation: data.organisation || null,
      inquiry_type: data.inquiry_type,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
