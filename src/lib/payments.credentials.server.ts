import { ALL_PAYMENT_KEYS, PAYMENT_CHANNELS } from "./payments.channels";

/**
 * Payment and ticket-email credentials are entered from the dashboard and kept in
 * the same server-only credential table as the social keys. Values never leave the
 * server — the dashboard only learns whether a key is present.
 */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const PLATFORMS = PAYMENT_CHANNELS.map((c) => c.id);

export async function loadPaymentValues(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const name of ALL_PAYMENT_KEYS) {
    const env = process.env[name];
    if (env) out[name] = env;
  }
  try {
    const sb = await admin();
    const { data } = await sb
      .from("social_credentials")
      .select("key_name,value")
      .in("platform", PLATFORMS);
    for (const row of data ?? []) {
      if (row.value) out[row.key_name] = row.value;
    }
  } catch {
    // Environment-only fallback when the table is unreachable.
  }
  return out;
}

export async function paymentKeyStatus(): Promise<Record<string, boolean>> {
  const values = await loadPaymentValues();
  return Object.fromEntries(ALL_PAYMENT_KEYS.map((name) => [name, Boolean(values[name])]));
}

/** Saves or clears payment keys. An empty value deletes the stored key. */
export async function savePaymentKeys(
  entries: { key_name: string; value: string }[],
  userId: string,
) {
  const sb = await admin();
  for (const entry of entries) {
    const channel = PAYMENT_CHANNELS.find((c) => c.keys.some((k) => k.name === entry.key_name));
    if (!channel) continue;
    const value = entry.value.trim();
    if (!value) {
      await sb
        .from("social_credentials")
        .delete()
        .eq("platform", channel.id)
        .eq("key_name", entry.key_name);
      continue;
    }
    const { error } = await sb.from("social_credentials").upsert(
      {
        platform: channel.id,
        key_name: entry.key_name,
        value,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "platform,key_name" },
    );
    if (error) throw new Error(error.message);
  }
  return { ok: true };
}
