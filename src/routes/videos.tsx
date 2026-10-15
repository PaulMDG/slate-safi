import { PageIntro } from "@/components/site/page-intro";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Film, Play, Search, X } from "lucide-react";
import { getHomepage, listVideos } from "@/lib/content.functions";
import type { Homepage, Video } from "@/lib/content.types";
import { Button } from "@/components/ui/button";
import { VideoOptInModal } from "@/components/site/video-optin-modal";
import { VideoWatchDialog } from "@/components/site/video-watch-dialog";
import { toSpotifyEmbed } from "@/components/site/video-player";
import { socialMeta } from "@/lib/seo";

 type Data = { videos: Video[]; homepage: Homepage | null };

export const Route = createFileRoute("/videos")({
  loader: async (): Promise<Data> => {
    const [videos, homepage] = await Promise.all([listVideos(), getHomepage()]);
    return { videos, homepage };
  },
  head: () => socialMeta({
    title: "Films & Videos — Slate Safi",
    description: "Watch Slate Safi's film trailers, music videos and behind-the-scenes stories from Kenya.",
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
  const [active, setActive] = useState<Video | null>(null);
  const [category, setCategory] = useState("All videos");
  const [search, setSearch] = useState("");
  const categories = ["All videos", ...new Set(videos.map((v) => v.category?.trim()).filter((value): value is string => Boolean(value)))];
  const visible = videos.filter((v) =>
    (category === "All videos" || v.category?.trim() === category) &&
    `${v.title} ${v.description ?? ""} ${v.category ?? ""}`.toLowerCase().includes(search.toLowerCase().trim()),
  );
  const spotifyEmbed = homepage?.spotify_url ? toSpotifyEmbed(homepage.spotify_url) : null;

  return (
    <div className="pt-28 sm:pt-36">
      <section className="mx-auto max-w-[1400px] px-5 pb-16 md:px-10 md:pb-24">
        <PageIntro eyebrow="Watch / Slate Safi" title={homepage?.videos_heading || "Films, music & stories"} action={
          <Button asChild variant="outline" className="w-fit gap-3"><a href="https://www.youtube.com/@slatesafi" target="_blank" rel="noopener noreferrer">Slate Safi on YouTube <ArrowUpRight /></a></Button>
        }>{homepage?.videos_body || "Trailers, music and a closer look at the people behind our films."}</PageIntro>

        <div className="my-7 grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="flex min-w-0 flex-wrap gap-2" aria-label="Video categories">
            {categories.map((item) => <Button key={item} variant={category === item ? "secondary" : "ghost"} onClick={() => setCategory(item)} aria-pressed={category === item} className={category === item ? "border border-primary/40 text-primary" : "text-muted-foreground"}>{item}</Button>)}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search videos" placeholder="Search videos" className="h-10 w-full rounded-md border border-input bg-surface pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
            {search ? <Button size="icon" variant="ghost" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-1 top-1/2 size-8 -translate-y-1/2"><X /></Button> : null}
          </div>
        </div>

        {visible.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {visible.map((video) => <article key={video.id} className="group min-w-0">
            <Button variant="ghost" onClick={() => setActive(video)} aria-label={`Watch ${video.title}`} className="relative block aspect-[2/3] h-auto w-full overflow-hidden rounded-lg border border-border bg-surface p-0 transition-colors duration-200 hover:bg-secondary focus-visible:ring-2">
              {video.poster_url ? <img src={video.poster_url} alt={`${video.title} poster`} loading="lazy" decoding="async" className="h-full w-full object-contain" /> : <div className="flex h-full flex-col items-center justify-center gap-5 px-5 text-center whitespace-normal"><Film className="!size-10 text-primary/70" /><span className="font-display text-lg font-bold leading-snug text-foreground sm:text-2xl">{video.title}</span><span className="text-xs font-normal text-muted-foreground">Slate Safi</span></div>}
              {video.featured ? <span className="absolute left-3 top-3 rounded-sm bg-sunshine px-2.5 py-1 text-xs font-semibold text-sunshine-foreground">Featured</span> : null}
              <span className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lift)] transition-transform duration-200 group-hover:scale-110 motion-reduce:transition-none"><Play className="!size-5 fill-current" /></span>
            </Button>
            <p className="mt-4 text-xs font-medium text-primary">{video.category || "Video"}</p>
            <h2 className="mt-1.5 text-base leading-snug [letter-spacing:0] sm:text-lg"><Button variant="link" onClick={() => setActive(video)} className="h-auto w-full justify-start whitespace-normal p-0 text-left font-display text-base font-bold leading-snug text-foreground hover:text-primary hover:no-underline sm:text-lg">{video.title}</Button></h2>
            {video.description ? <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">{video.description}</p> : null}
          </article>)}
        </div> : <div className="py-20 text-center"><Film className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-5 text-xl [letter-spacing:0]">{videos.length ? "No matching videos" : "New videos are on the way"}</h2>{videos.length ? <Button variant="link" className="mt-3" onClick={() => { setSearch(""); setCategory("All videos"); }}>Show all videos</Button> : null}</div>}
      </section>

      {homepage?.show_spotify !== false && spotifyEmbed ? (
        <section className="rule-top">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 md:grid-cols-2 md:px-10 md:py-20">
            <div className="min-w-0"><p className="text-sm font-medium text-primary">Soundtracks</p><h2 className="mt-4 text-3xl leading-tight [letter-spacing:0]">{homepage?.spotify_heading || "Also on Spotify"}</h2><p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">{homepage?.spotify_body || "Original music and score from our films, collected on Spotify."}</p></div>
            <iframe src={spotifyEmbed} title="Slate Safi on Spotify" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="h-[380px] w-full rounded-lg border border-border" />
          </div>
        </section>
      ) : null}
      <VideoWatchDialog video={active} onClose={() => setActive(null)} />
      {homepage?.video_optin_enabled !== false ? <VideoOptInModal heading={homepage?.video_optin_heading} body={homepage?.video_optin_body} videoId={active?.id ?? null} /> : null}
    </div>
  );
}
