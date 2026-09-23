import type { BookingInput } from "./tickets.schemas";
import { normalisePhone, siteUrl, stkPush, mpesaConfig } from "./mpesa.server";
import { sendEmail } from "./email.server";

type Sb = any;

async function admin(): Promise<Sb> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Sb;
}

const PAID_STATUSES = ["paid", "issued"];
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function code(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export type ScreeningOffer = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  kind: string;
  screen_label: string | null;
  city: string | null;
  note: string | null;
  ticket_terms: string | null;
  sold_out: boolean;
  tickets_enabled: boolean;
  price_kes: number;
  capacity: number | null;
  remaining: number | null;
  film: { title: string; slug: string; poster_url: string | null } | null;
  cinema: { name: string; city: string | null } | null;
};

const SELECT =
  "id, starts_at, ends_at, kind, screen_label, city, note, ticket_terms, sold_out, tickets_enabled, price_kes, capacity, film:films(title, slug, poster_url), cinema:cinemas(name, city)";

async function soldCount(sb: Sb, screeningId: string) {
  const { data } = await sb
    .from("tickets")
    .select("quantity, status")
    .eq("screening_id", screeningId)
    .in("status", PAID_STATUSES);
  return (data ?? []).reduce((sum: number, row: { quantity: number }) => sum + row.quantity, 0);
}

export async function loadOffer(screeningId: string): Promise<ScreeningOffer | null> {
  const sb = await admin();
  const { data } = await sb
    .from("screenings")
    .select(SELECT)
    .eq("id", screeningId)
    .eq("published", true)
    .maybeSingle();
  if (!data) return null;
  const sold = data.capacity ? await soldCount(sb, screeningId) : 0;
  return {
    ...data,
    price_kes: Number(data.price_kes ?? 0),
    remaining: data.capacity ? Math.max(0, data.capacity - sold) : null,
  } as ScreeningOffer;
}

function money(value: number) {
  return `KES ${value.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
  });
}

/** Builds and sends the ticket email, recording the outcome on the ticket row. */
export async function deliverTicket(reference: string) {
  const sb = await admin();
  const { data: ticket } = await sb
    .from("tickets")
    .select("*, screening:screenings(starts_at, screen_label, city, note, ticket_terms, film:films(title), cinema:cinemas(name, city))")
    .eq("reference", reference)
    .maybeSingle();
  if (!ticket) throw new Error("Ticket not found");

  const s = ticket.screening ?? {};
  const film = s.film?.title ?? "Slate Safi screening";
  const venue = [s.cinema?.name, s.screen_label, s.city ?? s.cinema?.city]
    .filter(Boolean)
    .join(" · ");
  const link = `${siteUrl()}/ticket/${ticket.reference}`;
  const paid = Number(ticket.total_kes) > 0;

  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#0b0b0c;color:#f5f3ef;padding:32px">
    <p style="letter-spacing:.2em;text-transform:uppercase;font-size:11px;color:#e0a44b;margin:0">Slate Safi</p>
    <h1 style="font-size:26px;margin:14px 0 6px">${film}</h1>
    <p style="margin:0 0 24px;color:#bdb8b0">${formatWhen(ticket.screening?.starts_at ?? new Date().toISOString())}${venue ? `<br/>${venue}` : ""}</p>
    <div style="border:1px solid #2a2a2c;border-radius:6px;padding:20px;margin-bottom:24px">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#bdb8b0">Your ticket code</p>
      <p style="margin:0;font-size:30px;letter-spacing:.14em;font-weight:bold">${ticket.reference}</p>
      <p style="margin:14px 0 0;color:#bdb8b0;font-size:14px">
        ${ticket.quantity} ${ticket.quantity > 1 ? "tickets" : "ticket"} · ${paid ? money(Number(ticket.total_kes)) : "Free entry"}
        ${ticket.mpesa_receipt ? `<br/>M-Pesa receipt: ${ticket.mpesa_receipt}` : ""}
      </p>
    </div>
    <p style="margin:0 0 24px"><a href="${link}" style="background:#e0a44b;color:#131313;text-decoration:none;padding:14px 22px;border-radius:4px;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;font-size:12px">View ticket &amp; QR code</a></p>
    <p style="color:#bdb8b0;font-size:13px;line-height:1.6">Show the QR code or read out the code above at the door. ${s.ticket_terms ?? ""}</p>
    <p style="color:#6f6b66;font-size:12px;margin-top:28px">Slate Safi · slatesafiweb@gmail.com · +254 758 752424</p>
  </div>`;

  try {
    await sendEmail({
      to: ticket.email,
      subject: `Your ticket for ${film} — ${ticket.reference}`,
      html,
      text: `Your ticket code is ${ticket.reference}. ${film}, ${formatWhen(ticket.screening?.starts_at ?? new Date().toISOString())}. View it at ${link}`,
    });
    await sb
      .from("tickets")
      .update({ email_sent_at: new Date().toISOString(), email_error: null })
      .eq("id", ticket.id);
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";
    await sb.from("tickets").update({ email_error: message }).eq("id", ticket.id);
    return { ok: false as const, error: message };
  }
}

export type BookingResult = {
  reference: string;
  status: string;
  free: boolean;
  message: string;
  emailed: boolean;
};

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const sb = await admin();
  const offer = await loadOffer(input.screening_id);
  if (!offer) throw new Error("This screening is not available.");
  if (!offer.tickets_enabled) throw new Error("Tickets are not on sale for this date.");
  if (offer.sold_out) throw new Error("This screening is sold out.");
  if (offer.remaining !== null && offer.remaining < input.quantity) {
    throw new Error(
      offer.remaining === 0
        ? "This screening is sold out."
        : `Only ${offer.remaining} ticket${offer.remaining === 1 ? "" : "s"} left.`,
    );
  }

  const unit = Number(offer.price_kes ?? 0);
  const total = unit * input.quantity;
  const free = total <= 0;
  const reference = `SS${code(6)}`;

  if (!free) {
    if (!input.phone) throw new Error("Enter the M-Pesa phone number to pay with.");
    if (!(await mpesaConfig())) {
      throw new Error("M-Pesa payments are not connected yet. Please try again later.");
    }
  }

  const { data: ticket, error } = await sb
    .from("tickets")
    .insert({
      reference,
      screening_id: input.screening_id,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone || null,
      quantity: input.quantity,
      unit_price_kes: unit,
      total_kes: total,
      is_free: free,
      status: free ? "issued" : "pending",
      payment_method: free ? "free" : "mpesa",
      qr_token: code(18),
    })
    .select("id, reference")
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (free) {
    const delivery = await deliverTicket(reference);
    return {
      reference,
      status: "issued",
      free: true,
      emailed: delivery.ok,
      message: delivery.ok
        ? "Your ticket is on its way to your inbox."
        : "Your ticket is confirmed — keep this code safe, the email could not be sent.",
    };
  }

  try {
    const push = await stkPush({
      amount: total,
      phone: normalisePhone(input.phone!),
      reference,
      description: `${offer.film?.title ?? "Slate Safi"} ticket`,
    });
    await sb
      .from("tickets")
      .update({
        mpesa_checkout_request_id: push.checkoutRequestId,
        mpesa_merchant_request_id: push.merchantRequestId,
        mpesa_phone: normalisePhone(input.phone!),
      })
      .eq("id", ticket!.id);
    return {
      reference,
      status: "pending",
      free: false,
      emailed: false,
      message: push.customerMessage,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment request failed";
    await sb.from("tickets").update({ status: "failed", payment_error: message }).eq("id", ticket!.id);
    throw new Error(message);
  }
}

export type TicketStatus = {
  reference: string;
  status: string;
  name: string;
  email: string;
  quantity: number;
  total_kes: number;
  is_free: boolean;
  mpesa_receipt: string | null;
  payment_error: string | null;
  email_sent_at: string | null;
  qr_token: string;
  screening: {
    starts_at: string;
    screen_label: string | null;
    city: string | null;
    ticket_terms: string | null;
    film: { title: string; slug: string; poster_url: string | null } | null;
    cinema: { name: string; city: string | null } | null;
  } | null;
};

export async function ticketStatus(reference: string): Promise<TicketStatus | null> {
  const sb = await admin();
  const { data } = await sb
    .from("tickets")
    .select(
      "reference, status, name, email, quantity, total_kes, is_free, mpesa_receipt, payment_error, email_sent_at, qr_token, screening:screenings(starts_at, screen_label, city, ticket_terms, film:films(title, slug, poster_url), cinema:cinemas(name, city))",
    )
    .eq("reference", reference.toUpperCase())
    .maybeSingle();
  if (!data) return null;
  return { ...data, total_kes: Number(data.total_kes ?? 0) } as TicketStatus;
}

/** Applies a Daraja STK callback: marks the ticket paid and emails it. */
export async function applyMpesaCallback(payload: any) {
  const sb = await admin();
  const stk = payload?.Body?.stkCallback ?? {};
  const checkoutId = String(stk.CheckoutRequestID ?? "");
  const resultCode = Number(stk.ResultCode ?? -1);
  const resultDesc = String(stk.ResultDesc ?? "");

  await sb.from("mpesa_callbacks").insert({
    checkout_request_id: checkoutId || null,
    merchant_request_id: String(stk.MerchantRequestID ?? "") || null,
    result_code: Number.isFinite(resultCode) ? resultCode : null,
    result_desc: resultDesc || null,
    payload,
  });

  if (!checkoutId) return { ok: false, reason: "no checkout id" };

  const { data: ticket } = await sb
    .from("tickets")
    .select("id, reference, status")
    .eq("mpesa_checkout_request_id", checkoutId)
    .maybeSingle();
  if (!ticket) return { ok: false, reason: "unknown ticket" };

  if (resultCode !== 0) {
    await sb
      .from("tickets")
      .update({ status: "failed", payment_error: resultDesc || "Payment not completed" })
      .eq("id", ticket.id);
    return { ok: true, status: "failed" };
  }

  const items: { Name?: string; Value?: unknown }[] = stk.CallbackMetadata?.Item ?? [];
  const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value;

  await sb
    .from("tickets")
    .update({
      status: "paid",
      payment_error: null,
      mpesa_receipt: receipt ? String(receipt) : null,
    })
    .eq("id", ticket.id);

  if (ticket.status !== "paid") await deliverTicket(ticket.reference);
  return { ok: true, status: "paid" };
}

export type AdminTicket = {
  id: string;
  reference: string;
  screening_id: string;
  name: string;
  email: string;
  phone: string | null;
  quantity: number;
  total_kes: number;
  status: string;
  is_free: boolean;
  mpesa_receipt: string | null;
  payment_error: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  checked_in_at: string | null;
  created_at: string;
};

export async function listTickets(sb: Sb): Promise<AdminTicket[]> {
  const { data, error } = await sb
    .from("tickets")
    .select(
      "id, reference, screening_id, name, email, phone, quantity, total_kes, status, is_free, mpesa_receipt, payment_error, email_sent_at, email_error, checked_in_at, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: AdminTicket) => ({ ...row, total_kes: Number(row.total_kes) }));
}
