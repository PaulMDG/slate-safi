import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toEmbedUrl } from "./video-player";

export type HeroSlideView = {
  id: string;
  image_url: string;
  video_url: string | null;
  video_start?: number | null;
  video_end?: number | null;
  eyebrow: string | null;
  title: string | null;
  logline: string | null;
  cta_label: string | null;
  cta_url: string | null;
};

function CtaButton({ label, url }: { label: string; url: string }) {
  const className = "group gap-3 h-auto rounded-md bg-sunshine px-6 py-3.5 text-sm font-semibold text-sunshine-foreground hover:bg-sunshine/90";
  const inner = (
    <>
      <Play className="h-4 w-4 fill-current" />
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </>
  );
  if (/^https?:\/\//i.test(url)) {
    return (
      <Button asChild className={className}><a href={url} target="_blank" rel="noreferrer">
        {inner}
      </a></Button>
    );
  }
  return (
    <Button asChild className={className}><Link to={url}>
      {inner}
    </Link></Button>
  );
}

/** Builds a muted autoplay loop embed URL for background playback. */
function backgroundEmbedSrc(embed: string, start?: number | null, end?: number | null): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    controls: "0",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0",
  });
  const id = embed.match(/\/embed\/([^/?#]+)/)?.[1];
  if (embed.includes("youtube") && id) params.set("playlist", id);
  if (start && start > 0) params.set("start", String(start));
  if (end && end > (start ?? 0)) params.set("end", String(end));
  const hash = embed.includes("vimeo") && start ? `#t=${start}s` : "";
  return `${embed}?${params.toString()}${hash}`;
}

/** Muted, looping background video for the active hero slide. */
function BackgroundVideo({
  url,
  title,
  start,
  end,
}: {
  url: string;
  title: string;
  start?: number | null;
  end?: number | null;
}) {
  const embed = toEmbedUrl(url);
  const from = start && start > 0 ? start : 0;
  const clipMs = end && end > from ? (end - from) * 1000 : 0;
  const [cycle, setCycle] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);
  // Restart embedded clips when they reach their stop time so they loop.
  useEffect(() => {
    if (!embed || !clipMs) return;
    const t = setInterval(() => setCycle((c) => c + 1), clipMs + 800);
    return () => clearInterval(t);
  }, [embed, clipMs]);
  if (embed) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* 16:9 wrapper sized to cover the hero on any screen — never stretched. */}
        <div className="absolute left-1/2 top-1/2 aspect-video w-[max(100vw,177.78vh)] -translate-x-1/2 -translate-y-1/2">
          <iframe
            key={cycle}
            src={backgroundEmbedSrc(embed, from, end)}
            title={`${title} — trailer (muted)`}
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            tabIndex={-1}
            className="h-full w-full border-0"
          />
        </div>
      </div>
    );
  }
  return (
    <video
      ref={ref}
      src={url}
      autoPlay
      muted
      loop
      onLoadedMetadata={(e) => {
        if (from) e.currentTarget.currentTime = from;
      }}
      onTimeUpdate={(e) => {
        if (clipMs && end && e.currentTarget.currentTime >= end) e.currentTarget.currentTime = from;
      }}
      playsInline
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
  );
}

/**
 * Full-bleed cinematic hero slideshow: Ken-Burns imagery, glassy controls,
 * progress rail and keyboard/reduced-motion support.
 */
export function HeroSlideshow({
  slides,
  intervalMs = 6500,
}: {
  slides: HeroSlideView[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const count = slides.length;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing || count < 2) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    // Video slides with a clip length stay up for exactly that clip.
    const s = slides[index];
    const clip =
      s?.video_url && s.video_end && s.video_end > (s.video_start ?? 0)
        ? (s.video_end - (s.video_start ?? 0)) * 1000
        : 0;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % count), clip || Math.max(2500, intervalMs));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [playing, count, intervalMs, index, slides]);

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured films"
      className="relative min-h-[82svh] w-full overflow-hidden bg-cinema"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      tabIndex={-1}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <img
            src={slide.image_url}
            alt={slide.title ? `${slide.title} — key still` : "Featured film still"}
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`h-full w-full object-cover ${
              i === index ? "animate-hero-zoom" : ""
            } motion-reduce:animate-none`}
          />
          {i === index && slide.video_url ? (
            <BackgroundVideo
              url={slide.video_url}
              title={slide.title ?? "Featured film"}
              start={slide.video_start}
              end={slide.video_end}
            />
          ) : null}
        </div>
      ))}

      <div className="cinema-copy relative mx-auto flex min-h-[82svh] max-w-[1400px] flex-col justify-end px-5 pb-16 pt-32 md:px-10 md:pb-24">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`transition-all duration-700 ${
              i === index
                ? "translate-y-0 opacity-100"
                : "pointer-events-none absolute translate-y-4 opacity-0"
            }`}
            aria-hidden={i !== index}
          >
            {slide.eyebrow ? <p className="eyebrow">{slide.eyebrow}</p> : null}
            {slide.title ? (
              <h1 className="mt-5 max-w-4xl text-5xl leading-[0.95] sm:text-7xl lg:text-8xl">
                {slide.title}
              </h1>
            ) : null}
            {slide.logline ? (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-cinema-muted sm:text-lg">
                {slide.logline}
              </p>
            ) : null}
            {slide.cta_label && slide.cta_url ? (
              <div className="mt-10">
                <CtaButton label={slide.cta_label} url={slide.cta_url} />
              </div>
            ) : null}
          </div>
        ))}

        {count > 1 ? (
          <div className="mt-12 flex flex-wrap items-center gap-5">
            <Button variant="ghost" size="icon"
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cinema-border bg-cinema/40 text-cinema-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary"
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
            </Button>
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {slides.map((slide, i) => (
                <Button variant="ghost" size="icon"
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  className="group relative h-[3px] w-14 overflow-hidden rounded-full bg-cinema-border sm:w-20"
                >
                  <span
                    className={`absolute inset-y-0 left-0 bg-primary transition-all duration-500 ${
                      i === index ? "w-full" : "w-0 group-hover:w-1/3"
                    }`}
                  />
                </Button>
              ))}
            </div>
            <p className="font-display text-[0.65rem] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
