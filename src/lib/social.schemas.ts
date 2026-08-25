import { z } from "zod";

export const platformSchema = z.enum(["x", "instagram", "linkedin"]);

export const socialPostSchema = z.object({
  id: z.string().uuid().optional(),
  platform: platformSchema,
  status: z.enum(["draft", "scheduled", "posting", "posted", "failed", "cancelled"]),
  caption: z.string().trim().min(1).max(4000),
  media_url: z.string().trim().max(600).optional().nullable(),
  link_url: z.string().trim().max(600).optional().nullable(),
  source_type: z.enum(["manual", "film", "post"]),
  source_id: z.string().uuid().optional().nullable(),
  scheduled_for: z.string().trim().max(40).optional().nullable(),
});

export const socialAccountSchema = z.object({
  id: z.string().uuid(),
  handle: z.string().trim().max(120).optional().nullable(),
  display_name: z.string().trim().max(160).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  connected: z.boolean(),
});

export const generateDraftsSchema = z.object({
  source_type: z.enum(["film", "post"]),
  source_id: z.string().uuid(),
  platforms: z.array(platformSchema).min(1),
  scheduled_for: z.string().trim().max(40).optional().nullable(),
});

export const automationSchema = z.object({
  id: z.string().uuid().optional(),
  auto_publish_films: z.boolean(),
  auto_publish_posts: z.boolean(),
  platforms: z.array(platformSchema),
  delay_minutes: z.coerce.number().int().min(0).max(10080),
  evergreen_enabled: z.boolean(),
  evergreen_interval_days: z.coerce.number().int().min(1).max(365),
  evergreen_platforms: z.array(platformSchema),
  daily_cap: z.coerce.number().int().min(0).max(100),
  utm_source: z.string().trim().min(1).max(60),
  utm_medium: z.string().trim().min(1).max(60),
  utm_campaign: z.string().trim().min(1).max(80),
});

export const metricsSchema = z.object({
  post_id: z.string().uuid(),
  impressions: z.coerce.number().int().min(0).max(100000000),
  likes: z.coerce.number().int().min(0).max(100000000),
  comments: z.coerce.number().int().min(0).max(100000000),
  shares: z.coerce.number().int().min(0).max(100000000),
  clicks: z.coerce.number().int().min(0).max(100000000),
});

export const queueContentSchema = z.object({
  source_type: z.enum(["film", "post"]),
  source_id: z.string().uuid(),
});
