import { z } from "zod";

export const slugInput = z.object({ slug: z.string().min(1).max(120) });

/** Invisible anti-spam fields shared by every public form. */
const spamFields = {
  honeypot: z.string().max(200).optional(),
  elapsed_ms: z.number().int().nonnegative().max(86_400_000).optional(),
};

export const emailSchema = z.object({
  email: z.string().trim().email().max(255),
  source: z.string().trim().max(60).optional(),
  ...spamFields,
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  organisation: z.string().trim().max(160).optional(),
  inquiry_type: z.enum(["partnership", "distribution", "press", "general"]),
  message: z.string().trim().min(10).max(4000),
  ...spamFields,
});

export const idInput = z.object({ id: z.string().uuid() });

export const filmSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  title: z.string().trim().min(1).max(160),
  tagline: z.string().trim().max(240).optional().nullable(),
  logline: z.string().trim().max(600).optional().nullable(),
  synopsis: z.string().trim().max(6000).optional().nullable(),
  status: z.enum(["released", "post-production", "production", "development", "upcoming"]),
  release_year: z.number().int().min(1900).max(2100).optional().nullable(),
  runtime_minutes: z.number().int().min(1).max(600).optional().nullable(),
  genre: z.string().trim().max(120).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  language: z.string().trim().max(120).optional().nullable(),
  poster_url: z.string().trim().max(600).optional().nullable(),
  hero_image_url: z.string().trim().max(600).optional().nullable(),
  trailer_url: z.string().trim().max(600).optional().nullable(),
  featured: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});

export const creditSchema = z.object({
  id: z.string().uuid().optional(),
  film_id: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(160),
  credit_type: z.enum(["cast", "crew"]),
  character_name: z.string().trim().max(160).optional().nullable(),
  photo_url: z.string().trim().max(600).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999),
});

export const gallerySchema = z.object({
  id: z.string().uuid().optional(),
  film_id: z.string().uuid(),
  image_url: z.string().trim().min(1).max(600),
  caption: z.string().trim().max(300).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999),
});

export const postSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(400).optional().nullable(),
  body: z.string().trim().max(40000).optional().nullable(),
  cover_image_url: z.string().trim().max(600).optional().nullable(),
  author: z.string().trim().max(160).optional().nullable(),
  category: z.string().trim().max(80).optional().nullable(),
  published: z.boolean(),
  published_at: z.string().trim().min(1).max(40),
});

export const pressSchema = z.object({
  id: z.string().uuid().optional(),
  film_id: z.string().uuid().optional().nullable(),
  kind: z.enum(["laurel", "quote", "award", "coverage"]),
  title: z.string().trim().min(1).max(200),
  outlet: z.string().trim().max(160).optional().nullable(),
  quote: z.string().trim().max(1000).optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  link_url: z.string().trim().max(600).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});

export const submissionStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "reviewed", "archived", "spam"]),
  internal_notes: z.string().trim().max(2000).optional().nullable(),
});

export const homepageSchema = z.object({
  id: z.string().uuid().optional(),
  hero_eyebrow: z.string().trim().max(120).optional().nullable(),
  hero_status_label: z.string().trim().max(120).optional().nullable(),
  hero_title: z.string().trim().max(160).optional().nullable(),
  hero_logline: z.string().trim().max(600).optional().nullable(),
  hero_cta_label: z.string().trim().max(80).optional().nullable(),
  hero_cta_url: z.string().trim().max(600).optional().nullable(),
  hero_image_url: z.string().trim().max(600).optional().nullable(),
  slate_eyebrow: z.string().trim().max(120).optional().nullable(),
  slate_heading: z.string().trim().max(240).optional().nullable(),
  news_eyebrow: z.string().trim().max(120).optional().nullable(),
  news_heading: z.string().trim().max(240).optional().nullable(),
  newsletter_eyebrow: z.string().trim().max(120).optional().nullable(),
  newsletter_heading: z.string().trim().max(240).optional().nullable(),
  newsletter_body: z.string().trim().max(600).optional().nullable(),
  partner_eyebrow: z.string().trim().max(120).optional().nullable(),
  partner_heading: z.string().trim().max(240).optional().nullable(),
  partner_body: z.string().trim().max(900).optional().nullable(),
  partner_cta_label: z.string().trim().max(80).optional().nullable(),
  slideshow_interval_ms: z.number().int().min(2000).max(30000),
  show_slideshow: z.boolean(),
  show_laurels: z.boolean(),
  show_quotes: z.boolean(),
  show_news: z.boolean(),
  show_newsletter: z.boolean(),
  show_partner: z.boolean(),
});

export const slideSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().trim().min(1).max(600),
  eyebrow: z.string().trim().max(120).optional().nullable(),
  title: z.string().trim().max(160).optional().nullable(),
  logline: z.string().trim().max(600).optional().nullable(),
  cta_label: z.string().trim().max(80).optional().nullable(),
  cta_url: z.string().trim().max(600).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});


export const cinemaSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(160),
  chain: z.string().trim().max(160).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  ticketing_url: z.string().trim().max(600).optional().nullable(),
  booking_note: z.string().trim().max(400).optional().nullable(),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});

export const screeningSchema = z.object({
  id: z.string().uuid().optional(),
  film_id: z.string().uuid(),
  cinema_id: z.string().uuid(),
  kind: z.enum(["premiere", "screening", "festival", "special"]),
  starts_at: z.string().trim().min(1).max(40),
  ends_at: z.string().trim().max(40).optional().nullable(),
  screen_label: z.string().trim().max(120).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  ticket_url: z.string().trim().max(600).optional().nullable(),
  note: z.string().trim().max(400).optional().nullable(),
  sold_out: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
  published: z.boolean(),
});
