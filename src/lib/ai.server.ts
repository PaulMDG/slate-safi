/** AI marketing copy generation via the Lovable AI gateway. */

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

export type MarketingKit = {
  titles: string[];
  seo_title: string;
  seo_description: string;
  keywords: string[];
  hashtags: Record<string, string[]>;
  captions: Record<string, string>;
  trends: { topic: string; why: string; action: string }[];
  best_times: string[];
};

const EMPTY: MarketingKit = {
  titles: [],
  seo_title: "",
  seo_description: "",
  keywords: [],
  hashtags: {},
  captions: {},
  trends: [],
  best_times: [],
};

function parseJson(text: string): unknown {
  const cleaned = text
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("The AI response could not be read. Try again.");
  }
}

async function callGateway(system: string, user: string): Promise<unknown> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project yet.");

  const response = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (response.status === 429) throw new Error("AI rate limit reached — try again in a moment.");
  if (response.status === 402) throw new Error("AI credits are exhausted for this workspace.");
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI request failed: ${response.status} ${detail.slice(0, 200)}`);
  }
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return parseJson(body.choices?.[0]?.message?.content ?? "");
}

function asStrings(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, limit);
}

const SYSTEM = `You are the head of marketing for Slate Safi, a Kenyan film production company
whose work targets international festival and streaming audiences. You write with confidence,
specificity and cultural pride — never generic hype, never emoji spam.
Reply with JSON only, no code fences, using exactly this shape:
{
  "titles": [5 alternative headline options],
  "seo_title": "under 60 characters, includes the main keyword",
  "seo_description": "under 155 characters",
  "keywords": [8 search keywords or phrases],
  "hashtags": { "x": [3 tags], "instagram": [12 tags], "linkedin": [4 tags] },
  "captions": { "x": "under 240 characters", "instagram": "under 700 characters", "linkedin": "under 900 characters" },
  "trends": [4 items: { "topic": "", "why": "", "action": "" }],
  "best_times": [3 suggested posting windows in East Africa Time with the audience reason]
}
Hashtags include the leading #. Captions exclude the link — it is appended automatically.
Trends are current, plausible discovery angles for African cinema, festivals and streaming
audiences, each with a concrete action the studio can take this week.`;

export type KitInput = {
  kind: "film" | "post" | "topic";
  title: string;
  summary?: string | null;
  extra?: string | null;
  angle?: string | null;
  audience?: string | null;
};

export async function generateMarketingKit(input: KitInput): Promise<MarketingKit> {
  const lines = [
    `Content type: ${input.kind}`,
    `Working title: ${input.title}`,
    input.summary ? `Summary: ${input.summary}` : "",
    input.extra ? `Extra detail: ${input.extra}` : "",
    input.angle ? `Marketing angle requested: ${input.angle}` : "",
    `Audience: ${input.audience || "international film audiences, festival programmers, streamers, Kenyan cinema fans"}`,
    "Optimise for discovery: search visibility, hashtag reach and shareability.",
  ].filter(Boolean);

  const raw = (await callGateway(SYSTEM, lines.join("\n"))) as Record<string, unknown>;
  const hashtags = (raw["hashtags"] ?? {}) as Record<string, unknown>;
  const captions = (raw["captions"] ?? {}) as Record<string, unknown>;
  const trendsRaw = Array.isArray(raw["trends"]) ? (raw["trends"] as Record<string, unknown>[]) : [];

  const kit: MarketingKit = {
    ...EMPTY,
    titles: asStrings(raw["titles"], 6),
    seo_title: typeof raw["seo_title"] === "string" ? raw["seo_title"].slice(0, 120) : "",
    seo_description:
      typeof raw["seo_description"] === "string" ? raw["seo_description"].slice(0, 300) : "",
    keywords: asStrings(raw["keywords"], 12),
    hashtags: {
      x: asStrings(hashtags["x"], 6),
      instagram: asStrings(hashtags["instagram"], 20),
      linkedin: asStrings(hashtags["linkedin"], 8),
    },
    captions: {
      x: typeof captions["x"] === "string" ? captions["x"] : "",
      instagram: typeof captions["instagram"] === "string" ? captions["instagram"] : "",
      linkedin: typeof captions["linkedin"] === "string" ? captions["linkedin"] : "",
    },
    trends: trendsRaw
      .map((t) => ({
        topic: typeof t["topic"] === "string" ? t["topic"] : "",
        why: typeof t["why"] === "string" ? t["why"] : "",
        action: typeof t["action"] === "string" ? t["action"] : "",
      }))
      .filter((t) => t.topic)
      .slice(0, 6),
    best_times: asStrings(raw["best_times"], 4),
  };
  return kit;
}

/** Rewrites the queued captions for one film/article using AI copy. */
export function composeCaption(
  caption: string,
  hashtags: string[],
  link: string,
  limit: number,
): string {
  const tags = hashtags.join(" ");
  const reserved = link.length + 2 + (tags ? tags.length + 2 : 0);
  const body = caption.slice(0, Math.max(40, limit - reserved)).trim();
  return [body, tags, link].filter(Boolean).join("\n\n");
}
