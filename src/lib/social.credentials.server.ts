import { ALL_CREDENTIAL_KEYS, CHANNELS, REQUIRED_KEYS } from "./social.channels";

/**
 * API access for each channel can be entered from the dashboard. Values are kept
 * in a server-only table and are never returned to the browser — only whether a
 * key is present. Environment secrets act as a fallback.
 */

export type KeyStatus = Record<string, boolean>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Every stored credential, merged over the environment fallbacks. */
export async function loadCredentialValues(): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const name of ALL_CREDENTIAL_KEYS) {
    const env = process.env[name];
    if (env) out[name] = env;
  }
  try {
    const sb = await admin();
    const { data } = await sb.from("social_credentials").select("key_name,value");
    for (const row of data ?? []) {
      if (row.value) out[row.key_name] = row.value;
    }
  } catch {
    // Fall back to environment-only when the table is unreachable.
  }
  return out;
}

/** Per-key presence, safe to send to the dashboard. */
export async function credentialKeyStatus(): Promise<KeyStatus> {
  const values = await loadCredentialValues();
  return Object.fromEntries(ALL_CREDENTIAL_KEYS.map((name) => [name, Boolean(values[name])]));
}

/** Per-channel "connected" flags derived from the required keys. */
export function channelStatusFrom(values: Record<string, string>): Record<string, boolean> {
  return Object.fromEntries(
    CHANNELS.map((channel) => [
      channel.id,
      (REQUIRED_KEYS[channel.id] ?? []).every((name) => Boolean(values[name])),
    ]),
  );
}

export async function channelStatus(): Promise<Record<string, boolean>> {
  return channelStatusFrom(await loadCredentialValues());
}

/**
 * Saves or clears keys for one channel. An empty string deletes the stored value
 * so the channel falls back to the environment secret (or goes disconnected).
 */
export async function saveCredentials(
  platform: string,
  entries: { key_name: string; value: string }[],
  userId: string,
) {
  const allowed = new Set(
    (CHANNELS.find((c) => c.id === platform)?.keys ?? []).map((k) => k.name),
  );
  const sb = await admin();

  for (const entry of entries) {
    if (!allowed.has(entry.key_name)) continue;
    const value = entry.value.trim();
    if (!value) {
      await sb
        .from("social_credentials")
        .delete()
        .eq("platform", platform)
        .eq("key_name", entry.key_name);
      continue;
    }
    const { error } = await sb.from("social_credentials").upsert(
      {
        platform,
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
