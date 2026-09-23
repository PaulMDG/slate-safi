import { loadPaymentValues } from "./payments.credentials.server";

/**
 * Ticket emails go out through the studio's own sending account. The API key and
 * from address are entered in the dashboard (or supplied as environment secrets).
 */

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function emailConfigured() {
  const values = await loadPaymentValues();
  return Boolean(values["TICKET_EMAIL_API_KEY"] && values["TICKET_EMAIL_FROM"]);
}

export async function sendEmail(payload: EmailPayload) {
  const values = await loadPaymentValues();
  const key = values["TICKET_EMAIL_API_KEY"];
  const from = values["TICKET_EMAIL_FROM"];
  if (!key || !from) {
    throw new Error("Email delivery is not connected yet.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Email send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return { ok: true };
}
