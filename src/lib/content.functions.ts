import { createServerFn } from "@tanstack/react-start";
import { slugInput, emailSchema, contactSchema } from "./content.schemas";
import type {
  FilmSummary,
  FilmDetail,
  PressItem,
  PostSummary,
  Post,
  Homepage,
} from "./content.types";

export const listFilms = createServerFn({ method: "GET" }).handler(
  async (): Promise<FilmSummary[]> => {
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
  },
);

export const getFilm = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slugInput.parse(data))
  .handler(async ({ data }): Promise<FilmDetail | null> => {
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

export const listPress = createServerFn({ method: "GET" }).handler(
  async (): Promise<PressItem[]> => {
    const { publicSupabase } = await import("./content.server");
    const { data, error } = await publicSupabase()
      .from("press_items")
      .select("id, kind, title, outlet, quote, year")
      .eq("published", true)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const listPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<PostSummary[]> => {
    const { publicSupabase } = await import("./content.server");
    const { data, error } = await publicSupabase()
      .from("posts")
      .select("id, slug, title, excerpt, cover_image_url, author, category, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => slugInput.parse(data))
  .handler(async ({ data }): Promise<Post | null> => {
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
    const { requestMetadata, scoreSubmission, checkRateLimit } = await import("./spam.server");

    const meta = requestMetadata();
    const verdict = scoreSubmission({
      honeypot: data.honeypot,
      elapsed_ms: data.elapsed_ms,
      text: data.email,
      email: data.email,
    });
    if (verdict.blocked) return { ok: true };

    const allowed = await checkRateLimit("newsletter", meta.ip_address, 5);
    if (!allowed) throw new Error("Too many attempts. Please try again later.");

    const { error } = await publicSupabase()
      .from("newsletter_subscribers")
      .insert({
        email: data.email.toLowerCase(),
        source: data.source ?? "website",
        spam_score: verdict.spam_score,
        is_spam: verdict.is_spam,
        ...meta,
      });
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => contactSchema.parse(data))
  .handler(async ({ data }) => {
    const { publicSupabase } = await import("./content.server");
    const { requestMetadata, scoreSubmission, checkRateLimit } = await import("./spam.server");

    const meta = requestMetadata();
    const verdict = scoreSubmission({
      honeypot: data.honeypot,
      elapsed_ms: data.elapsed_ms,
      text: `${data.name} ${data.organisation ?? ""} ${data.message}`,
      email: data.email,
    });
    if (verdict.blocked) return { ok: true };

    const allowed = await checkRateLimit("contact", meta.ip_address, 4);
    if (!allowed) throw new Error("Too many attempts. Please try again later.");

    const { error } = await publicSupabase()
      .from("contact_submissions")
      .insert({
        name: data.name,
        email: data.email.toLowerCase(),
        organisation: data.organisation || null,
        inquiry_type: data.inquiry_type,
        message: data.message,
        spam_score: verdict.spam_score,
        is_spam: verdict.is_spam,
        status: verdict.is_spam ? "spam" : "new",
        ...meta,
      });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const getHomepage = createServerFn({ method: "GET" }).handler(
  async (): Promise<Homepage | null> => {
    const { publicSupabase } = await import("./content.server");
    const { data, error } = await publicSupabase()
      .from("homepage_content")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
);
