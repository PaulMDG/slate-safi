import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { publicSupabase } = await import("@/lib/content.server");
        const { data } = await publicSupabase()
          .from("posts")
          .select("slug, title, excerpt, author, category, cover_image_url, published_at")
          .eq("published", true)
          .order("published_at", { ascending: false })
          .limit(50);

        const posts = data ?? [];
        const lastBuild = posts[0]?.published_at
          ? new Date(posts[0].published_at).toUTCString()
          : new Date(0).toUTCString();

        const items = posts
          .map((post) => {
            const link = `${SITE_URL}/news/${post.slug}`;
            const image = absoluteUrl(post.cover_image_url);
            return [
              `    <item>`,
              `      <title>${escapeXml(post.title)}</title>`,
              `      <link>${link}</link>`,
              `      <guid isPermaLink="true">${link}</guid>`,
              `      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>`,
              post.author ? `      <dc:creator>${escapeXml(post.author)}</dc:creator>` : null,
              post.category ? `      <category>${escapeXml(post.category)}</category>` : null,
              post.excerpt
                ? `      <description>${escapeXml(post.excerpt)}</description>`
                : null,
              image
                ? `      <enclosure url="${escapeXml(image)}" type="image/jpeg" />`
                : null,
              `    </item>`,
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
          `  <channel>`,
          `    <title>${SITE_NAME} — News</title>`,
          `    <link>${SITE_URL}/news</link>`,
          `    <description>Production news, festival dates and releases from ${SITE_NAME}, the Nairobi film production company.</description>`,
          `    <language>en</language>`,
          `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
          `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
          items,
          `  </channel>`,
          `</rss>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
