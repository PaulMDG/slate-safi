import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/seo";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { publicSupabase } = await import("@/lib/content.server");
        const supabase = publicSupabase();

        const [films, posts] = await Promise.all([
          supabase
            .from("films")
            .select("slug, updated_at")
            .eq("published", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("posts")
            .select("slug, updated_at")
            .eq("published", true)
            .order("published_at", { ascending: false }),
        ]);

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/films", changefreq: "weekly", priority: "0.9" },
          { path: "/screenings", changefreq: "daily", priority: "0.9" },
          { path: "/news", changefreq: "weekly", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.7" },
          { path: "/partner", changefreq: "monthly", priority: "0.7" },
          ...(films.data ?? []).map((f) => ({
            path: `/films/${f.slug}`,
            lastmod: f.updated_at ? new Date(f.updated_at).toISOString() : undefined,
            changefreq: "monthly" as const,
            priority: "0.9",
          })),
          ...(posts.data ?? []).map((p) => ({
            path: `/news/${p.slug}`,
            lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${SITE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
