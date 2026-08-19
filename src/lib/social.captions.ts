import { SITE_URL, truncate } from "./seo";

export const PLATFORMS = ["x", "instagram", "linkedin"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABEL: Record<Platform, string> = {
  x: "X / Twitter",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

export const PLATFORM_LIMIT: Record<Platform, number> = {
  x: 280,
  instagram: 2200,
  linkedin: 3000,
};

const HASHTAGS = "#SlateSafi #KenyanCinema #AfricanFilm";

type FilmLike = {
  slug: string;
  title: string;
  tagline: string | null;
  logline: string | null;
  status: string;
  release_year: number | null;
  poster_url: string | null;
  hero_image_url: string | null;
};

type PostLike = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  cover_image_url: string | null;
};

function withLimit(text: string, platform: Platform, link: string) {
  const limit = PLATFORM_LIMIT[platform];
  const reserved = platform === "x" ? link.length + 2 : 0;
  const body = truncate(text, Math.max(40, limit - reserved));
  return platform === "x" ? `${body}\n\n${link}` : `${body}\n\n${link}`;
}

export function captionForFilm(film: FilmLike, platform: Platform): string {
  const link = `${SITE_URL}/films/${film.slug}`;
  const hook = film.tagline || film.logline || "A new film from Slate Safi.";
  const statusLine =
    film.status === "released"
      ? `${film.title}${film.release_year ? ` (${film.release_year})` : ""} is out now.`
      : `${film.title} — ${film.status.replace("-", " ")}.`;

  if (platform === "x") return withLimit(`${statusLine} ${hook}`, "x", link);
  if (platform === "instagram")
    return withLimit(`${statusLine}\n\n${hook}\n\n${HASHTAGS}`, "instagram", link);
  return withLimit(
    `${statusLine}\n\n${hook}\n\nSlate Safi is a Kenyan film production company building stories for a global audience. Full details and press materials:`,
    "linkedin",
    link,
  );
}

export function captionForPost(post: PostLike, platform: Platform): string {
  const link = `${SITE_URL}/news/${post.slug}`;
  const hook = post.excerpt || post.title;
  const label = post.category ? `${post.category}: ` : "";
  if (platform === "x") return withLimit(`${label}${post.title} — ${hook}`, "x", link);
  if (platform === "instagram")
    return withLimit(`${label}${post.title}\n\n${hook}\n\n${HASHTAGS}`, "instagram", link);
  return withLimit(`${label}${post.title}\n\n${hook}`, "linkedin", link);
}

export function mediaForFilm(film: FilmLike): string | null {
  return film.hero_image_url ?? film.poster_url ?? null;
}

export function mediaForPost(post: PostLike): string | null {
  return post.cover_image_url ?? null;
}
