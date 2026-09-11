/** Converts YouTube/Vimeo links into embeddable player URLs. */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube-nocookie.com/embed/${v}`;
      const shorts = u.pathname.match(/\/shorts\/([^/]+)/);
      if (shorts) return `https://www.youtube-nocookie.com/embed/${shorts[1]}`;
      const embed = u.pathname.match(/\/embed\/([^/]+)/);
      if (embed) return `https://www.youtube-nocookie.com/embed/${embed[1]}`;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** Renders an uploaded file with native controls, or an embedded player. */
export function VideoPlayer({
  url,
  title,
  poster,
}: {
  url: string;
  title: string;
  poster?: string | null;
}) {
  const embed = toEmbedUrl(url);
  return (
    <div className="aspect-video w-full overflow-hidden rounded-sm border border-border bg-secondary">
      {embed ? (
        <iframe
          src={embed}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      ) : (
        <video
          src={url}
          title={title}
          poster={poster ?? undefined}
          controls
          preload="metadata"
          playsInline
          className="h-full w-full bg-background object-contain"
        />
      )}
    </div>
  );
}

/** Normalises a Spotify link into its embed form. */
export function toSpotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("spotify.com")) return null;
    if (u.pathname.startsWith("/embed/")) return `https://open.spotify.com${u.pathname}`;
    return `https://open.spotify.com/embed${u.pathname}`;
  } catch {
    return null;
  }
}
