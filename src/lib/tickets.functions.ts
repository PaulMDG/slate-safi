import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  bookingSchema,
  paymentCredentialsSchema,
  referenceInput,
  ticketIdInput,
} from "./tickets.schemas";
import type { AdminTicket, BookingResult, ScreeningOffer, TicketStatus } from "./tickets.server";

export type { AdminTicket, BookingResult, ScreeningOffer, TicketStatus };

export const getScreeningOffer = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<ScreeningOffer | null> => {
    const { loadOffer } = await import("./tickets.server");
    return loadOffer(data.id);
  });

export const bookTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data }): Promise<BookingResult> => {
    const { scoreSubmission, checkRateLimit, requestMetadata } = await import("./spam.server");
    const meta = requestMetadata();
    const verdict = scoreSubmission({
      honeypot: data.honeypot,
      elapsed_ms: data.elapsed_ms,
      text: `${data.name} ${data.email}`,
      email: data.email,
    });
    if (verdict.blocked) throw new Error("Could not process this booking.");
    const allowed = await checkRateLimit("tickets", meta.ip_address, 8);
    if (!allowed) throw new Error("Too many attempts. Please try again in a few minutes.");

    const { createBooking } = await import("./tickets.server");
    return createBooking(data);
  });

export const getTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => referenceInput.parse(data))
  .handler(async ({ data }): Promise<TicketStatus | null> => {
    const { ticketStatus } = await import("./tickets.server");
    return ticketStatus(data.reference);
  });

export type TicketAdminSnapshot = {
  tickets: AdminTicket[];
  keyStatus: Record<string, boolean>;
  mpesaReady: boolean;
  emailReady: boolean;
  callbackUrl: string;
};

export const loadTicketAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TicketAdminSnapshot> => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase as any, context.userId);
    const { listTickets } = await import("./tickets.server");
    const { paymentKeyStatus } = await import("./payments.credentials.server");
    const { MPESA_REQUIRED_KEYS } = await import("./payments.channels");
    const { siteUrl } = await import("./mpesa.server");
    const keyStatus = await paymentKeyStatus();
    return {
      tickets: await listTickets(context.supabase as any),
      keyStatus,
      mpesaReady: MPESA_REQUIRED_KEYS.every((k) => keyStatus[k]),
      emailReady: Boolean(keyStatus["TICKET_EMAIL_API_KEY"] && keyStatus["TICKET_EMAIL_FROM"]),
      callbackUrl: `${siteUrl()}/api/public/mpesa/callback`,
    };
  });

export const savePaymentCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => paymentCredentialsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase as any, context.userId);
    const { savePaymentKeys } = await import("./payments.credentials.server");
    return savePaymentKeys(data.entries, context.userId);
  });

export const resendTicketEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => referenceInput.parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase as any, context.userId);
    const { deliverTicket } = await import("./tickets.server");
    const result = await deliverTicket(data.reference.toUpperCase());
    if (!result.ok) throw new Error(result.error);
    return { ok: true };
  });

export const setTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    ticketIdInput
      .extend({ status: z.enum(["pending", "paid", "issued", "failed", "cancelled"]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase as any, context.userId);
    const { error } = await (context.supabase as any)
      .from("tickets")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkInTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ticketIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./admin.server");
    await assertAdmin(context.supabase as any, context.userId);
    const { error } = await (context.supabase as any)
      .from("tickets")
      .update({ checked_in_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
