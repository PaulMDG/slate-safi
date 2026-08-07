export const SITE_URL = "https://slate-safi.lovable.app";
export const SITE_NAME = "Slate Safi";

/** Turns a stored image path into an absolute URL crawlers can fetch. */
export function absoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function truncate(text: string | null | undefined, max = 158): string {
  const value = (text ?? "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/** Social image + canonical/og:url tags for a leaf route. */
export function socialMeta({
  title,
  description,
  path,
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article" | "video.movie";
}) {
  const url = `${SITE_URL}${path}`;
  const img = absoluteUrl(image);
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:site_name", content: SITE_NAME },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      ...(img
        ? [
            { property: "og:image", content: img },
            { property: "og:image:alt", content: title },
            { name: "twitter:image", content: img },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
