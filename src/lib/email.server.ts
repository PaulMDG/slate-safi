import { sendLovableEmail, EmailAPIError } from "@lovable.dev/email-js";

/**
 * All outgoing studio email (ticket confirmations, alerts) goes through Lovable's
 * managed sending on the studio's own verified sender domain. Delivery, retries,
 * suppression and unsubscribes are handled upstream — nothing is queued here.
 */

const SITE_NAME = "Slate Safi";
const SENDER_DOMAIN = "notify.slatesafi.co.ke";
const FROM = `${SITE_NAME} <tickets@slatesafi.co.ke>`;
const REPLY_TO = "slatesafiweb@gmail.com";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  label?: string;
  idempotencyKey?: string;
};

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function emailConfigured() {
  return Boolean(process.env["LOVABLE_API_KEY"]);
}

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Email delivery is not connected yet.");

  try {
    const res = await sendLovableEmail(
      {
        to: payload.to,
        from: FROM,
        sender_domain: SENDER_DOMAIN,
        reply_to: REPLY_TO,
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? stripHtml(payload.html),
        ...(payload.label ? { label: payload.label } : {}),
        ...(payload.idempotencyKey ? { idempotency_key: payload.idempotencyKey } : {}),
      },
      { apiKey },
    );
    if (!res.success) {
      return { ok: false as const, reason: res.status ?? "not_sent" };
    }
    return { ok: true as const, messageId: res.message_id };
  } catch (err) {
    if (err instanceof EmailAPIError) {
      if (err.code === "recipient_suppressed") {
        return { ok: false as const, reason: "recipient_suppressed" };
      }
      const wait = err.retryAfterSeconds ?? 60;
      throw new Error(
        err.status === 429
          ? `Email sending is rate limited — try again in ${wait}s.`
          : `Email send failed: ${err.message}`,
      );
    }
    throw err;
  }
}
