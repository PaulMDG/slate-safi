import { z } from "zod";

export const slugInput = z.object({ slug: z.string().min(1).max(120) });

export const emailSchema = z.object({
  email: z.string().trim().email().max(255),
  source: z.string().trim().max(60).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  organisation: z.string().trim().max(160).optional(),
  inquiry_type: z.enum(["partnership", "distribution", "press", "general"]),
  message: z.string().trim().min(10).max(4000),
});
