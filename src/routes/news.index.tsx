import { createFileRoute, Link } from "@tanstack/react-router";
import { listPosts } from "@/lib/content.functions";
import type { PostSummary } from "@/lib/content.types";
import { SITE_URL, socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/news/")({
  loader: (): Promise<PostSummary[]> => listPosts(),
  head: () => {
    const social = socialMeta({
      title: "News & Notes — Slate Safi",
      description:
        "Production updates, festival selections and studio notes from Slate Safi, the Nairobi film production company behind Boda Love.",
      path: "/news",
      image: "https://dvlfzfvbxntgfkpuliyb.supabase.co/storage/v1/object/public/media/films/heroes/1787821966566-flyer-2-by-3.png",
    });
    return {
      ...social,
      links: [
        ...social.links,
        {
          rel: "alternate",
          type: "application/rss+xml",
          title: "Slate Safi — News",
          href: `${SITE_URL}/rss.xml`,
        },
      ],
    };
  },

  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load the news</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  component: NewsIndex,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function NewsIndex() {
  const posts: PostSummary[] = Route.useLoaderData();
  const [lead, ...rest] = posts;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-8 pt-36 md:px-10 md:pt-44">
      <p className="eyebrow">Newsroom</p>
      <h1 className="mt-5 text-5xl leading-[0.92] sm:text-7xl">News &amp; notes</h1>

      {lead ? (
        <Link
          to="/news/$slug"
          params={{ slug: lead.slug }}
          className="group mt-14 grid gap-8 md:grid-cols-2 md:items-center"
        >
          <div className="aspect-[16/10] overflow-hidden rounded-sm border border-border">
            {lead.cover_image_url ? (
              <img
                src={lead.cover_image_url}
                alt={lead.title}
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">
              {lead.category} · {formatDate(lead.published_at)}
            </p>
            <h2 className="mt-4 text-3xl leading-tight transition-colors group-hover:text-primary sm:text-4xl">
              {lead.title}
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {lead.excerpt}
            </p>
          </div>
        </Link>
      ) : null}

      <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((post) => (
          <Link
            key={post.id}
            to="/news/$slug"
            params={{ slug: post.slug }}
            className="group min-w-0"
          >
            <div className="aspect-[16/10] overflow-hidden rounded-sm border border-border">
              {post.cover_image_url ? (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : null}
            </div>
            <p className="mt-5 text-xs uppercase tracking-[0.2em] text-primary">
              {post.category} · {formatDate(post.published_at)}
            </p>
            <h3 className="mt-2 text-xl leading-snug transition-colors group-hover:text-primary">
              {post.title}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
