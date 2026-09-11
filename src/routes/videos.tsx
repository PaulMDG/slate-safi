import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getHomepage, listVideos } from "@/lib/content.functions";
import type { Homepage, Video } from "@/lib/content.types";
import { VideoOptInModal } from "@/components/site/video-optin-modal";
import { VideoPlayer, toSpotifyEmbed } from "@/components/site/video-player";
import { socialMeta } from "@/lib/seo";

type Data = { videos: Video[]; homepage: Homepage | null };

export const Route = createFileRoute("/videos")({
  loader: async (): Promise<Data> => {
    const [videos, homepage] = await Promise.all([listVideos(), getHomepage()]);
    return { videos, homepage };
  },
  head: () =>
    socialMeta({
      title: "Videos & Trailers — Slate Safi",
      description:
        "Watch trailers, behind-the-scenes footage and clips from Slate Safi's Kenyan features, plus the studio's Spotify soundtrack playlist.",
      path: "/videos",
    }),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load the videos</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  component: VideosPage,
});

function VideosPage() {
  const { videos, homepage }: Data = Route.useLoaderData();
  const featured = videos.find((v) => v.featured) ?? videos[0] ?? null;
  const [active, setActive] = useState<Video | null>(featured);
  const current = active ?? featured;
  const rest = videos.filter((v) => v.id !== current?.id);
  const spotifyEmbed = homepage?.spotify_url ? toSpotifyEmbed(homepage.spotify_url) : null;

  return (
    <div className="pt-32">
      <section className="mx-auto max-w-[1400px] px-5 md:px-10">
        <p className="eyebrow">{homepage?.videos_eyebrow || "Screening room"}</p>
        <h1 className="mt-5 max-w-3xl text-5xl leading-[0.92] sm:text-6xl">
          {homepage?.videos_heading || "Trailers, clips and behind the scenes"}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {homepage?.videos_body ||
            "Watch our work without leaving the site — trailers, festival cuts and set footage from the Slate Safi slate."}
        </p>
      </section>

      {current ? (
        <section className="mx-auto mt-14 max-w-[1400px] px-5 md:px-10">
          <VideoPlayer url={current.video_url} title={current.title} poster={current.poster_url} />
          <div className="mt-6 max-w-3xl">
            {current.category ? (
              <p className="text-xs uppercase tracking-[0.2em] text-primary">{current.category}</p>
            ) : null}
            <h2 className="mt-2 text-3xl leading-tight">{current.title}</h2>
            {current.description ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {current.description}
              </p>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="mx-auto mt-14 max-w-[1400px] px-5 md:px-10">
          <div className="frame rounded-sm border border-border p-10 text-sm text-muted-foreground">
            New videos are on the way — check back shortly.
          </div>
        </section>
      )}

      {rest.length > 0 ? (
        <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-24">
          <h2 className="eyebrow">More to watch</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setActive(v);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group text-left"
              >
                <div className="aspect-video overflow-hidden rounded-sm border border-border bg-secondary">
                  {v.poster_url ? (
                    <img
                      src={v.poster_url}
                      alt={v.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                {v.category ? (
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-primary">
                    {v.category}
                  </p>
                ) : null}
                <h3 className="mt-2 text-lg leading-snug transition-colors group-hover:text-primary">
                  {v.title}
                </h3>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {homepage?.show_spotify !== false && spotifyEmbed ? (
        <section className="rule-top">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-20 md:grid-cols-2 md:px-10 md:py-24">
            <div className="min-w-0">
              <h2 className="eyebrow">Sound</h2>
              <p className="mt-4 text-3xl leading-tight sm:text-4xl">
                {homepage?.spotify_heading || "Listen to the soundtracks"}
              </p>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                {homepage?.spotify_body ||
                  "Original music and score from our films, collected on Spotify."}
              </p>
            </div>
            <iframe
              src={spotifyEmbed}
              title="Slate Safi on Spotify"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="h-[380px] w-full rounded-sm border border-border"
            />
          </div>
        </section>
      ) : null}

      {homepage?.video_optin_enabled !== false ? (
        <VideoOptInModal
          heading={homepage?.video_optin_heading}
          body={homepage?.video_optin_body}
          videoId={current?.id ?? null}
        />
      ) : null}
    </div>
  );
}
