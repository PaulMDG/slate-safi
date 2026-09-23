import type { EmailPayload } from "./email.types";

/**
 * Studio email (ticket confirmations, alerts) goes out through Resend, connected
 * via the Lovable connector gateway. Resend handles delivery, retries and
 * suppression — nothing is queued here.
 *
 * The From address must use a domain verified in Resend. If a From address is
 * saved in the dashboard (TICKET_EMAIL_FROM) it wins; otherwise we fall back to
 * the default below.
 */

const SITE_NAME = "Slate Safi";
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const DEFAULT_FROM = `${SITE_NAME} <tickets@slatesafi.co.ke>`;
const REPLY_TO = "slatesafiweb@gmail.com";

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function emailConfigured() {
  return Boolean(process.env["LOVABLE_API_KEY"] && process.env["RESEND_API_KEY"]);
}

async function fromAddress() {
  try {
    const { loadPaymentValues } = await import("./payments.credentials.server");
    const saved = (await loadPaymentValues())["TICKET_EMAIL_FROM"];
    if (saved) return saved;
  } catch {
    // fall through to the default
  }
  return DEFAULT_FROM;
}

export async function sendEmail(payload: EmailPayload) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) throw new Error("Email delivery is not connected yet.");

  const from = await fromAddress();
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
      ...(payload.idempotencyKey ? { "Idempotency-Key": payload.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text ?? stripHtml(payload.html),
      reply_to: REPLY_TO,
      ...(payload.label ? { tags: [{ name: "label", value: payload.label }] } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend send failed [${res.status}]: ${body}`);
    if (res.status === 403 && /suppress/i.test(body)) {
      return { ok: false as const, reason: "recipient_suppressed" };
    }
    throw new Error(`Email send failed [${res.status}]: ${body.slice(0, 200)}`);
  }
  const data = (await res.json().catch(() => null)) as { id?: string } | null;
  return { ok: true as const, messageId: data?.id ?? null };
}
