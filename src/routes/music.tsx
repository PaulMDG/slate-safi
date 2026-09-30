import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Music2, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { getHomepage, listMusic } from "@/lib/content.functions";
import type { Homepage, MusicTrack } from "@/lib/content.types";
import { toSpotifyEmbed } from "@/components/site/video-player";
import { socialMeta } from "@/lib/seo";

type Data = { tracks: MusicTrack[]; homepage: Homepage | null };

export const Route = createFileRoute("/music")({
  loader: async (): Promise<Data> => {
    const [tracks, homepage] = await Promise.all([listMusic(), getHomepage()]);
    return { tracks, homepage };
  },
  head: () =>
    socialMeta({
      title: "Music & Soundtracks — Slate Safi",
      description:
        "Listen to original music and scores from Slate Safi films, streamed directly on the site.",
      path: "/music",
    }),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load the music</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  component: MusicPage,
});

function fmt(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function MusicPage() {
  const { tracks, homepage }: Data = Route.useLoaderData();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const current = tracks[index] ?? null;
  const spotifyEmbed = homepage?.spotify_url ? toSpotifyEmbed(homepage.spotify_url) : null;

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !playing) return;
    void a.play().catch(() => setPlaying(false));
  }, [index, playing]);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function select(i: number) {
    if (i === index) return toggle();
    setIndex(i);
    setTime(0);
    setPlaying(true);
  }

  const step = (d: number) => tracks.length && select((index + d + tracks.length) % tracks.length);

  return (
    <div className="pt-32">
      <section className="mx-auto max-w-[1400px] px-5 md:px-10">
        <p className="eyebrow">Sound</p>
        <h1 className="mt-5 max-w-3xl text-5xl leading-[0.92] sm:text-6xl">
          {homepage?.spotify_heading || "Music & soundtracks"}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {homepage?.spotify_body ||
            "Original music and score from our films — press play and listen right here."}
        </p>
      </section>

      {current ? (
        <section className="mx-auto mt-14 grid max-w-[1400px] gap-10 px-5 md:grid-cols-[minmax(0,380px)_1fr] md:px-10">
          <div className="rounded-sm border border-border bg-secondary/40 p-5">
            <div className="aspect-square overflow-hidden rounded-sm bg-secondary">
              {current.cover_url ? (
                <img src={current.cover_url} alt={current.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Music2 className="h-16 w-16" />
                </div>
              )}
            </div>
            <h2 className="mt-5 text-2xl leading-tight">{current.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[current.artist, current.album].filter(Boolean).join(" · ")}
            </p>
            <input
              type="range"
              aria-label="Seek"
              min={0}
              max={duration || 0}
              step={0.1}
              value={time}
              onChange={(e) => {
                const t = Number(e.target.value);
                if (audioRef.current) audioRef.current.currentTime = t;
                setTime(t);
              }}
              className="mt-5 w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fmt(time)}</span>
              <span>{fmt(duration)}</span>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
              <button type="button" aria-label="Previous track" onClick={() => step(-1)} className="text-muted-foreground hover:text-primary">
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label={playing ? "Pause" : "Play"}
                onClick={toggle}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
              >
                {playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
              </button>
              <button type="button" aria-label="Next track" onClick={() => step(1)} className="text-muted-foreground hover:text-primary">
                <SkipForward className="h-5 w-5" />
              </button>
            </div>
            {current.downloadable ? (
              <a
                href={current.audio_url}
                download
                className="mt-5 flex items-center justify-center gap-2 rounded-sm border border-border px-4 py-2.5 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Download className="h-3.5 w-3.5" /> Download this track
              </a>
            ) : null}
            <audio
              ref={audioRef}
              src={current.audio_url}
              preload="metadata"
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => (index < tracks.length - 1 ? select(index + 1) : setPlaying(false))}
            />
          </div>

          <ol className="divide-y divide-border border-y border-border">
            {tracks.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  className={`flex w-full items-center gap-4 py-4 text-left transition-colors hover:text-primary ${i === index ? "text-primary" : ""}`}
                >
                  <span className="w-6 text-xs text-muted-foreground">
                    {i === index && playing ? <Pause className="h-3.5 w-3.5" /> : String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{t.title}</span>
                    {t.artist ? <span className="block truncate text-xs text-muted-foreground">{t.artist}</span> : null}
                  </span>
                </button>
                {i === index && t.description ? (
                  <p className="pb-4 pl-10 text-sm text-muted-foreground">{t.description}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="mx-auto mt-14 max-w-[1400px] px-5 md:px-10">
          <div className="rounded-sm border border-border p-10 text-sm text-muted-foreground">
            New music is on the way — check back shortly.
          </div>
        </section>
      )}

      {spotifyEmbed ? (
        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10">
          <h2 className="eyebrow">Also on Spotify</h2>
          <iframe
            src={spotifyEmbed}
            title="Slate Safi on Spotify"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="mt-6 h-[380px] w-full rounded-sm border border-border"
          />
        </section>
      ) : (
        <div className="py-20" />
      )}
    </div>
  );
}
