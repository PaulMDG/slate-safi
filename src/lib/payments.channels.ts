/** Client-safe catalogue of the payment credentials the studio can store. */

export type PaymentKeySpec = { name: string; label: string; hint?: string };

export const MPESA_CHANNEL = {
  id: "mpesa",
  label: "M-Pesa (Safaricom Daraja)",
  docs:
    "developer.safaricom.co.ke — create an app for Lipa Na M-Pesa Online (STK Push) and copy the consumer key, consumer secret, short code and passkey.",
  keys: [
    { name: "MPESA_CONSUMER_KEY", label: "Consumer key" },
    { name: "MPESA_CONSUMER_SECRET", label: "Consumer secret" },
    { name: "MPESA_SHORTCODE", label: "Business short code", hint: "Paybill or till number" },
    { name: "MPESA_PASSKEY", label: "Lipa Na M-Pesa passkey" },
    {
      name: "MPESA_ENVIRONMENT",
      label: "Environment",
      hint: "sandbox or production (defaults to sandbox)",
    },
    {
      name: "MPESA_CALLBACK_URL",
      label: "Callback URL override",
      hint: "Optional — defaults to this site's /api/public/mpesa/callback",
    },
  ] satisfies PaymentKeySpec[],
};

export const MPESA_KEYS = MPESA_CHANNEL.keys.map((k) => k.name);

/** All of these must be present before M-Pesa checkout can run. */
export const MPESA_REQUIRED_KEYS = [
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PASSKEY",
];

export const EMAIL_CHANNEL = {
  id: "ticket_email",
  label: "Ticket email delivery",
  docs:
    "Tickets are emailed from your own sending address. Paste an email API key and the from address you want tickets to come from.",
  keys: [
    { name: "TICKET_EMAIL_API_KEY", label: "Email API key" },
    {
      name: "TICKET_EMAIL_FROM",
      label: "From address",
      hint: "Slate Safi <tickets@slatesafi.app>",
    },
  ] satisfies PaymentKeySpec[],
};

export const EMAIL_KEYS = EMAIL_CHANNEL.keys.map((k) => k.name);

export const PAYMENT_CHANNELS = [MPESA_CHANNEL, EMAIL_CHANNEL];

export const ALL_PAYMENT_KEYS = [...MPESA_KEYS, ...EMAIL_KEYS];
