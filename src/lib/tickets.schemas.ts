import { z } from "zod";

export const bookingSchema = z.object({
  screening_id: z.string().uuid(),
  ticket_type_id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(24).optional().nullable(),
  quantity: z.number().int().min(1).max(10),
  honeypot: z.string().max(200).optional(),
  elapsed_ms: z.number().int().nonnegative().max(86_400_000).optional(),
});

export const referenceInput = z.object({
  reference: z.string().trim().min(4).max(40),
});

export const ticketIdInput = z.object({ id: z.string().uuid() });

export const paymentCredentialsSchema = z.object({
  entries: z
    .array(
      z.object({
        key_name: z.string().trim().min(1).max(120),
        value: z.string().max(4000),
      }),
    )
    .min(1)
    .max(20),
});

export type BookingInput = z.infer<typeof bookingSchema>;
