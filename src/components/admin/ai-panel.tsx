import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Loader2, Send, Sparkles, TrendingUp } from "lucide-react";
import { generateMarketingKit, queueAiCaptions } from "@/lib/ai.functions";
import type { MarketingKit } from "@/lib/ai.server";
import type { AdminSnapshot } from "@/lib/admin.server";
import { PLATFORMS, PLATFORM_LABEL, type Platform } from "@/lib/social.captions";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground";
const primaryBtn =
  "inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50";
const ghostBtn =
  "inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 font-display text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground disabled:opacity-50";

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied.`);
  } catch {
    toast.error("Copying is blocked in this browser.");
  }
}

export function AiPanel({ admin, onDone }: { admin: AdminSnapshot; onDone: () => unknown }) {
  const generate = useServerFn(generateMarketingKit);
  const queue = useServerFn(queueAiCaptions);

  const options = useMemo(
    () => [
      ...admin.films.map((f) => ({ id: f.id, label: `Film — ${f.title}`, type: "film" as const })),
      ...admin.posts.map((p) => ({ id: p.id, label: `News — ${p.title}`, type: "post" as const })),
    ],
    [admin],
  );

  const [target, setTarget] = useState<string>(options[0] ? `${options[0].type}:${options[0].id}` : "topic");
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [audience, setAudience] = useState("");
  const [kit, setKit] = useState<MarketingKit | null>(null);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Platform[]>([...PLATFORMS]);
  const [busy, setBusy] = useState(false);
  const [queueBusy, setQueueBusy] = useState(false);

  const isTopic = target === "topic";
  const [sourceType, sourceId] = isTopic ? ["topic", null] : (target.split(":") as [string, string]);

  async function onGenerate() {
    setBusy(true);
    try {
      const result = await generate({
        data: {
          source_type: sourceType as "film" | "post" | "topic",
          source_id: sourceId,
          topic: isTopic ? topic : null,
          angle: angle || null,
          audience: audience || null,
        },
      });
      setKit(result);
      setCaptions({ ...result.captions });
      toast.success("Marketing kit ready.");
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onQueue(schedule: boolean) {
    if (!kit || isTopic || !sourceId) {
      toast.error("Pick a film or article to queue captions against.");
      return;
    }
    const items = selected
      .map((platform) => ({
        platform,
        caption: (captions[platform] ?? "").trim(),
        hashtags: kit.hashtags[platform] ?? [],
      }))
      .filter((i) => i.caption);
    if (!items.length) {
      toast.error("No captions selected.");
      return;
    }
    setQueueBusy(true);
    try {
      const res = await queue({
        data: {
          source_type: sourceType as "film" | "post",
          source_id: sourceId,
          schedule,
          items,
        },
      });
      toast.success(`${res.created} post(s) ${schedule ? "scheduled" : "saved as drafts"}.`);
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not queue captions.");
    } finally {
      setQueueBusy(false);
    }
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="eyebrow">AI marketing studio</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Generate headline options, SEO copy, hashtags, platform captions and current discovery
          angles for any film, article or free-form idea — then push the captions straight into the
          publishing queue.
        </p>

        <div className="frame mt-8 rounded-sm border border-border p-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="ai-target">
                Subject
              </label>
              <select
                id="ai-target"
                className={`${inputClass} mt-2`}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                {options.map((o) => (
                  <option key={`${o.type}:${o.id}`} value={`${o.type}:${o.id}`}>
                    {o.label}
                  </option>
                ))}
                <option value="topic">Free topic / campaign idea</option>
              </select>
            </div>
            {isTopic && (
              <div>
                <label className={labelClass} htmlFor="ai-topic">
                  Topic
                </label>
                <input
                  id="ai-topic"
                  className={`${inputClass} mt-2`}
                  placeholder="Behind the scenes in Kibera"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="ai-angle">
                Angle (optional)
              </label>
              <input
                id="ai-angle"
                className={`${inputClass} mt-2`}
                placeholder="Festival submission push, streamer acquisition…"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="ai-audience">
                Audience (optional)
              </label>
              <input
                id="ai-audience"
                className={`${inputClass} mt-2`}
                placeholder="Programmers, diaspora audiences, festival press…"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
          </div>

          <button onClick={() => void onGenerate()} disabled={busy} className={`${primaryBtn} mt-6`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate marketing kit
          </button>
        </div>
      </section>

      {kit && (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="frame rounded-sm border border-border p-6">
              <h3 className="font-display text-lg font-bold">Title options</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {kit.titles.map((t) => (
                  <li key={t} className="flex items-start justify-between gap-3">
                    <span>{t}</span>
                    <button className={ghostBtn} onClick={() => void copy(t, "Title")}>
                      <Copy className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="frame rounded-sm border border-border p-6">
              <h3 className="font-display text-lg font-bold">SEO</h3>
              <p className="mt-4 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Meta title ({kit.seo_title.length} chars)
              </p>
              <p className="mt-1 text-sm">{kit.seo_title}</p>
              <p className="mt-4 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Meta description ({kit.seo_description.length} chars)
              </p>
              <p className="mt-1 text-sm">{kit.seo_description}</p>
              <p className="mt-4 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Keywords
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{kit.keywords.join(" · ")}</p>
              <button
                className={`${ghostBtn} mt-5`}
                onClick={() =>
                  void copy(
                    `${kit.seo_title}\n${kit.seo_description}\n${kit.keywords.join(", ")}`,
                    "SEO pack",
                  )
                }
              >
                <Copy className="h-3 w-3" /> Copy SEO pack
              </button>
            </div>
          </section>

          <section>
            <h2 className="eyebrow">Captions &amp; hashtags</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {PLATFORMS.map((platform) => (
                <div key={platform} className="frame rounded-sm border border-border p-6">
                  <label className="flex items-center justify-between gap-3">
                    <span className="font-display text-base font-bold">
                      {PLATFORM_LABEL[platform]}
                    </span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                      checked={selected.includes(platform)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, platform]
                            : prev.filter((p) => p !== platform),
                        )
                      }
                    />
                  </label>
                  <textarea
                    rows={7}
                    className={`${inputClass} mt-4`}
                    value={captions[platform] ?? ""}
                    onChange={(e) =>
                      setCaptions((prev) => ({ ...prev, [platform]: e.target.value }))
                    }
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    {(kit.hashtags[platform] ?? []).join(" ")}
                  </p>
                  <button
                    className={`${ghostBtn} mt-4`}
                    onClick={() =>
                      void copy(
                        `${captions[platform] ?? ""}\n\n${(kit.hashtags[platform] ?? []).join(" ")}`,
                        "Caption",
                      )
                    }
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => void onQueue(false)}
                disabled={queueBusy || isTopic}
                className={primaryBtn}
              >
                {queueBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Save as drafts
              </button>
              <button
                onClick={() => void onQueue(true)}
                disabled={queueBusy || isTopic}
                className={ghostBtn}
              >
                Schedule now
              </button>
              {isTopic && (
                <p className="self-center text-xs text-muted-foreground">
                  Pick a film or article to queue captions.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="eyebrow">Search &amp; trend angles</h2>
            <ul className="mt-6 divide-y divide-border text-sm">
              {kit.trends.map((t) => (
                <li key={t.topic} className="py-4">
                  <p className="flex items-center gap-2 font-display text-base font-bold">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t.topic}
                  </p>
                  <p className="mt-1 text-muted-foreground">{t.why}</p>
                  <p className="mt-1">
                    <span className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                      Do this:{" "}
                    </span>
                    {t.action}
                  </p>
                </li>
              ))}
            </ul>
            {kit.best_times.length > 0 && (
              <p className="mt-6 text-sm text-muted-foreground">
                Best posting windows: {kit.best_times.join(" · ")}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
