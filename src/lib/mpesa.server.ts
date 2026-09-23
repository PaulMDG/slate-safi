import { MPESA_REQUIRED_KEYS } from "./payments.channels";
import { loadPaymentValues } from "./payments.credentials.server";

/** Safaricom Daraja STK Push (Lipa Na M-Pesa Online). */

export type MpesaConfig = {
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  base: string;
  callbackUrl: string;
};

export function siteUrl() {
  return (process.env["SITE_URL"] || "https://www.slatesafi.app").replace(/\/$/, "");
}

export async function mpesaConfig(): Promise<MpesaConfig | null> {
  const values = await loadPaymentValues();
  if (!MPESA_REQUIRED_KEYS.every((k) => values[k])) return null;
  const env = (values["MPESA_ENVIRONMENT"] || "sandbox").toLowerCase();
  return {
    consumerKey: values["MPESA_CONSUMER_KEY"]!,
    consumerSecret: values["MPESA_CONSUMER_SECRET"]!,
    shortcode: values["MPESA_SHORTCODE"]!,
    passkey: values["MPESA_PASSKEY"]!,
    base: env.startsWith("prod")
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke",
    callbackUrl: values["MPESA_CALLBACK_URL"] || `${siteUrl()}/api/public/mpesa/callback`,
  };
}

/** 2547XXXXXXXX from any of the common local formats. */
export function normalisePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

function timestamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

async function accessToken(cfg: MpesaConfig) {
  const auth = btoa(`${cfg.consumerKey}:${cfg.consumerSecret}`);
  const res = await fetch(`${cfg.base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed (${res.status})`);
  const body = (await res.json()) as { access_token?: string };
  if (!body.access_token) throw new Error("M-Pesa auth returned no token");
  return body.access_token;
}

export async function stkPush(opts: {
  amount: number;
  phone: string;
  reference: string;
  description: string;
}) {
  const cfg = await mpesaConfig();
  if (!cfg) throw new Error("M-Pesa is not connected yet.");
  const token = await accessToken(cfg);
  const stamp = timestamp();
  const password = btoa(`${cfg.shortcode}${cfg.passkey}${stamp}`);

  const res = await fetch(`${cfg.base}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: cfg.shortcode,
      Password: password,
      Timestamp: stamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(opts.amount)),
      PartyA: opts.phone,
      PartyB: cfg.shortcode,
      PhoneNumber: opts.phone,
      CallBackURL: cfg.callbackUrl,
      AccountReference: opts.reference.slice(0, 12),
      TransactionDesc: opts.description.slice(0, 60),
    }),
  });

  const body = (await res.json()) as Record<string, unknown>;
  const code = String(body["ResponseCode"] ?? "");
  if (!res.ok || (code && code !== "0")) {
    throw new Error(
      String(body["errorMessage"] ?? body["ResponseDescription"] ?? "M-Pesa request failed"),
    );
  }
  return {
    checkoutRequestId: String(body["CheckoutRequestID"] ?? ""),
    merchantRequestId: String(body["MerchantRequestID"] ?? ""),
    customerMessage: String(body["CustomerMessage"] ?? "Check your phone to approve the payment."),
  };
}
