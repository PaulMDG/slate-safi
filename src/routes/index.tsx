import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { getHomepage, listFilms, listPosts, listPress } from "@/lib/content.functions";
import { FilmCard } from "@/components/site/film-card";
import { LaurelStrip } from "@/components/site/laurel-strip";
import { NewsletterForm } from "@/components/site/newsletter-form";
import type { FilmSummary, PressItem, PostSummary, Homepage } from "@/lib/content.types";
import { SITE_URL, socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async (): Promise<{
    films: FilmSummary[];
    press: PressItem[];
    posts: PostSummary[];
    homepage: Homepage | null;
  }> => {
    const [films, press, posts, homepage] = await Promise.all([
      listFilms(),
      listPress(),
      listPosts(),
      getHomepage(),
    ]);
    return { films, press, posts: posts.slice(0, 3), homepage };
  },
  head: () => {
    const social = socialMeta({
      title: "Slate Safi — Kenyan Film Production Company",
      description:
        "Nairobi-based film production company behind Boda Love and Kibera Hustle. Kenyan stories built for global audiences.",
      path: "/",
      image: "/images/boda-love-hero.jpg",
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
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Slate Safi",
            url: SITE_URL,
            description:
              "Independent film production company in Nairobi, Kenya, producing features for international audiences.",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Nairobi",
              addressRegion: "Kilimani",
              addressCountry: "KE",
            },
            email: "partners@slatesafi.co.ke",
          }),
        },
      ],
    };
  },

  errorComponent: () => <LoadFailure />,
  component: Home,
});

function LoadFailure() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load the slate</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  );
}

function Home() {
  const {
    films,
    press,
    posts,
    homepage,
  }: {
    films: FilmSummary[];
    press: PressItem[];
    posts: PostSummary[];
    homepage: Homepage | null;
  } = Route.useLoaderData();
  const hero = films.find((f) => f.featured) ?? films[0];
  const quotes = press.filter((p) => p.kind === "quote");
  const cms = homepage;
  const heroImage = cms?.hero_image_url || hero?.hero_image_url;
  const heroTitle = cms?.hero_title || hero?.title || "Slate Safi";
  const heroLogline = cms?.hero_logline || hero?.logline;

  return (
    <>
      <section className="relative min-h-[92svh] w-full overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${heroTitle} — key still`}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 veil" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-[1400px] flex-col justify-end px-5 pb-16 pt-32 md:px-10 md:pb-24">
          <p className="eyebrow">
            {hero?.status === "released" ? "Now showing" : "In production"} ·{" "}
            {cms?.hero_eyebrow || "Slate Safi"}
          </p>
          <h1 className="mt-5 max-w-4xl text-6xl leading-[0.88] sm:text-7xl lg:text-[7.5rem]">
            {heroTitle}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {heroLogline}
          </p>
          <div className="mt-10">
            {hero ? (
              <Link
                to="/films/$slug"
                params={{ slug: hero.slug }}
                className="inline-flex items-center gap-3 rounded-sm bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Play className="h-4 w-4 fill-current" />
                {cms?.hero_cta_label || "Watch the trailer"}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {cms?.show_laurels !== false && <LaurelStrip items={press} />}

      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
          <div className="min-w-0">
            <h2 className="eyebrow">{cms?.slate_eyebrow || "The slate"}</h2>
            <p className="mt-4 max-w-xl text-3xl leading-tight sm:text-4xl">
              {cms?.slate_heading || "Two features. One point of view."}
            </p>
          </div>
          <Link
            to="/films"
            className="hidden shrink-0 items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.18em] text-primary sm:inline-flex"
          >
            All films <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {films.map((film, i) => (
            <FilmCard
              key={film.id}
              slug={film.slug}
              title={film.title}
              tagline={film.tagline}
              status={film.status}
              release_year={film.release_year}
              genre={film.genre}
              image={film.hero_image_url ?? film.poster_url}
              priority={i === 0}
            />
          ))}
        </div>
      </section>

      {cms?.show_quotes !== false && quotes.length > 0 && (
        <section className="rule-top border-b border-border">
          <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 md:grid-cols-3 md:px-10 md:py-20">
            {quotes.map((q) => (
              <blockquote key={q.id} className="min-w-0">
                <p className="font-display text-xl leading-snug">“{q.quote}”</p>
                <footer className="mt-4 text-xs uppercase tracking-[0.2em] text-primary">
                  {q.outlet}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {cms?.show_news !== false && (
      <section className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
          <div className="min-w-0">
            <h2 className="eyebrow">{cms?.news_eyebrow || "Latest"}</h2>
            <p className="mt-4 text-3xl leading-tight sm:text-4xl">
              {cms?.news_heading || "From the studio"}
            </p>
          </div>
          <Link
            to="/news"
            className="hidden shrink-0 items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.18em] text-primary sm:inline-flex"
          >
            All news <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {posts.map((post) => (
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
                {post.category}
              </p>
              <h3 className="mt-2 text-xl leading-snug transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
      )}

      {cms?.show_newsletter !== false && (
      <section className="rule-top">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 md:grid-cols-2 md:px-10 md:py-28">
          <div className="min-w-0">
            <h2 className="eyebrow">Newsletter</h2>
            <p className="mt-4 text-3xl leading-tight sm:text-4xl">
              {cms?.newsletter_heading || "Festival dates, releases, first looks."}
            </p>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              {cms?.newsletter_body ||
                "A short dispatch for audiences, programmers and press. No more than once a month."}
            </p>
          </div>
          <div className="flex items-center">
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>
      )}

      {cms?.show_partner !== false && (
      <section className="rule-top">
        <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
          <div className="frame rounded-sm border border-border p-8 md:p-16">
            <div className="grid gap-10 md:grid-cols-[1.6fr_1fr] md:items-end">
              <div className="min-w-0">
                <h2 className="eyebrow">Partners &amp; sponsors</h2>
                <p className="mt-4 max-w-2xl text-3xl leading-tight sm:text-5xl">
                  {cms?.partner_heading || "Back a slate that already travels."}
                </p>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {cms?.partner_body ||
                    "Brand partnership, co-production, festival support and distribution — we work with partners across Kenya, the UK, Canada and the US."}
                </p>
              </div>
              <Link
                to="/partner"
                className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
              >
                {cms?.partner_cta_label || "Partner with us"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      )}
    </>
  );
}
