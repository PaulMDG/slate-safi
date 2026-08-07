import { getRequest } from "@tanstack/react-start/server";

export type SubmissionMetadata = {
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
};

/** Best-effort request fingerprint stored alongside submissions for review. */
export function requestMetadata(): SubmissionMetadata {
  try {
    const req = getRequest();
    const h = req.headers;
    const forwarded = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for") ?? "";
    return {
      ip_address: forwarded.split(",")[0]?.trim() || null,
      user_agent: h.get("user-agent")?.slice(0, 500) ?? null,
      referrer: h.get("referer")?.slice(0, 500) ?? null,
      country: h.get("cf-ipcountry") ?? null,
    };
  } catch {
    return { ip_address: null, user_agent: null, referrer: null, country: null };
  }
}

const LINK_RE = /https?:\/\//gi;
const SPAM_WORDS = [
  "seo service",
  "crypto",
  "bitcoin",
  "casino",
  "viagra",
  "loan offer",
  "backlink",
  "rank your site",
  "telegram",
  "escort",
  "investment opportunity",
];

export type SpamVerdict = { spam_score: number; is_spam: boolean; blocked: boolean };

/**
 * Heuristic scoring: honeypot, submit timing, link stuffing and keywords.
 * Honeypot or absurdly fast submits are hard-blocked; the rest is scored so a
 * human can review borderline messages in the admin inbox.
 */
export function scoreSubmission(input: {
  honeypot?: string;
  elapsed_ms?: number;
  text?: string;
  email?: string;
}): SpamVerdict {
  let score = 0;
  let blocked = false;

  if (input.honeypot && input.honeypot.trim().length > 0) {
    score += 100;
    blocked = true;
  }
  if (typeof input.elapsed_ms === "number") {
    if (input.elapsed_ms < 1200) {
      score += 60;
      blocked = true;
    } else if (input.elapsed_ms < 3000) {
      score += 20;
    }
  }

  const text = input.text ?? "";
  const links = text.match(LINK_RE)?.length ?? 0;
  if (links >= 4) score += 40;
  else if (links >= 2) score += 20;

  const haystack = `${text} ${input.email ?? ""}`.toLowerCase();
  const hits = SPAM_WORDS.filter((word) => haystack.includes(word)).length;
  score += hits * 15;

  if (text.length > 40 && text === text.toUpperCase()) score += 10;
  if (/(.)\1{9,}/.test(text)) score += 15;

  return { spam_score: Math.min(score, 100), is_spam: score >= 50, blocked };
}

const WINDOW_MS = 10 * 60 * 1000;

/** Sliding-window throttle per IP + form. Returns false when over the limit. */
export async function checkRateLimit(
  form: string,
  bucketKey: string | null,
  limit = 5,
): Promise<boolean> {
  if (!bucketKey) return true;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("form_rate_limits")
      .select("id, hits, window_start")
      .eq("bucket_key", bucketKey)
      .eq("form_name", form)
      .maybeSingle();

    const now = Date.now();
    if (!existing) {
      await supabaseAdmin
        .from("form_rate_limits")
        .insert({ bucket_key: bucketKey, form_name: form, hits: 1 });
      return true;
    }

    const windowStart = new Date(existing.window_start).getTime();
    if (now - windowStart > WINDOW_MS) {
      await supabaseAdmin
        .from("form_rate_limits")
        .update({ hits: 1, window_start: new Date(now).toISOString() })
        .eq("id", existing.id);
      return true;
    }

    if (existing.hits >= limit) return false;
    await supabaseAdmin
      .from("form_rate_limits")
      .update({ hits: existing.hits + 1 })
      .eq("id", existing.id);
    return true;
  } catch {
    // Never block a genuine submission because throttling bookkeeping failed.
    return true;
  }
}
