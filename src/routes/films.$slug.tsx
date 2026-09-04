import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { getFilm } from "@/lib/content.functions";
import type { FilmDetail } from "@/lib/content.types";
import { SITE_URL, absoluteUrl, socialMeta, truncate } from "@/lib/seo";

export const Route = createFileRoute("/films/$slug")({
  loader: async ({ params }): Promise<FilmDetail> => {
    const result = await getFilm({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Film not found — Slate Safi" }, { name: "robots", content: "noindex" }],
      };
    }
    const { film, credits, press } = loaderData;
    const description = truncate(
      film.logline ?? film.synopsis ?? `${film.title} — a Slate Safi production.`,
    );
    const image = absoluteUrl(film.hero_image_url ?? film.poster_url);
    const social = socialMeta({
      title: `${film.title} (${film.release_year ?? "TBA"}) — Slate Safi`,
      description,
      path: `/films/${params.slug}`,
      image,
      type: "video.movie",
    });
    return {
      ...social,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Movie",
            name: film.title,
            description,
            url: `${SITE_URL}/films/${params.slug}`,
            ...(image ? { image } : {}),
            ...(film.genre ? { genre: film.genre } : {}),
            ...(film.release_year ? { datePublished: String(film.release_year) } : {}),
            ...(film.runtime_minutes ? { duration: `PT${film.runtime_minutes}M` } : {}),
            ...(film.country ? { countryOfOrigin: { "@type": "Country", name: film.country } } : {}),
            ...(film.language ? { inLanguage: film.language } : {}),
            ...(film.trailer_url
              ? { trailer: { "@type": "VideoObject", name: `${film.title} trailer`, url: film.trailer_url } }
              : {}),
            director: credits
              .filter((c) => /director/i.test(c.role))
              .map((c) => ({ "@type": "Person", name: c.name })),
            actor: credits
              .filter((c) => c.credit_type === "cast")
              .map((c) => ({ "@type": "Person", name: c.name })),
            productionCompany: { "@type": "Organization", name: "Slate Safi" },
            ...(press.some((p) => p.kind === "award")
              ? { award: press.filter((p) => p.kind === "award").map((p) => p.title) }
              : {}),
          }),
        },
      ],
    };
  },

  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load this film</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">Film not found</h1>
      <Link to="/films" className="mt-6 inline-block text-sm text-primary">
        Back to all films
      </Link>
    </div>
  ),
  component: FilmDetail,
});

function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host.endsWith("youtube.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/")[2] ?? "";
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/")[2] ?? "";
    } else if (host.endsWith("vimeo.com") && !u.pathname.startsWith("/video/")) {
      return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0] ?? ""}`;
    }
    if (id) {
      const t = u.searchParams.get("t");
      const start = t ? `?start=${parseInt(t, 10) || 0}` : "";
      return `https://www.youtube-nocookie.com/embed/${id}${start}`;
    }
    return url;
  } catch {
    return url;
  }
}

function FilmDetail() {
  const { film, credits, gallery }: FilmDetail = Route.useLoaderData();
  const cast = credits.filter((c) => c.credit_type === "cast");
  const crew = credits.filter((c) => c.credit_type === "crew");

  return (
    <article>
      <section className="relative min-h-[70svh] w-full overflow-hidden">
        {film.hero_image_url ? (
          <img
            src={film.hero_image_url}
            alt={`${film.title} — key still`}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 veil" />
        <div className="relative mx-auto flex min-h-[70svh] max-w-[1400px] flex-col justify-end px-5 pb-14 pt-32 md:px-10">
          <Link
            to="/films"
            className="inline-flex items-center gap-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> All films
          </Link>
          <h1 className="mt-6 max-w-4xl text-5xl leading-[0.9] sm:text-7xl lg:text-8xl">
            {film.title}
          </h1>
          {film.tagline ? (
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              {film.tagline}
            </p>
          ) : null}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            <li className="text-primary">{film.status === "released" ? "Released" : "Upcoming"}</li>
            {film.release_year ? <li>{film.release_year}</li> : null}
            {film.runtime_minutes ? <li>{film.runtime_minutes} min</li> : null}
            {film.genre ? <li>{film.genre}</li> : null}
            {film.language ? <li>{film.language}</li> : null}
          </ul>
        </div>
      </section>

      {film.trailer_url ? (
        <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-20">
          <h2 className="eyebrow">Trailer</h2>
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-sm border border-border bg-surface">
            <iframe
              src={film.trailer_url}
              title={`${film.title} official trailer`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </section>
      ) : null}

      <section className="rule-top">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-[1.6fr_1fr] md:px-10 md:py-20">
          <div className="min-w-0">
            <h2 className="eyebrow">Synopsis</h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
              {(film.synopsis ?? "").split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <dl className="space-y-5 text-sm">
            {[
              ["Status", film.status === "released" ? "Released" : "In post-production"],
              ["Year", film.release_year ? String(film.release_year) : "TBC"],
              ["Runtime", film.runtime_minutes ? `${film.runtime_minutes} minutes` : "TBC"],
              ["Country", film.country ?? "Kenya"],
              ["Language", film.language ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="rule-top pt-4">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-primary">{label}</dt>
                <dd className="mt-1.5 text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {(cast.length > 0 || crew.length > 0) && (
        <section className="rule-top">
          <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-20">
            <h2 className="eyebrow">Cast &amp; crew</h2>
            {cast.length > 0 && (
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {cast.map((person) => (
                  <div
                    key={person.id}
                    className="frame min-w-0 rounded-sm border border-border p-6"
                  >
                    <p className="text-lg leading-tight font-display font-bold">{person.name}</p>
                    {person.character_name ? (
                      <p className="mt-2 text-sm text-primary">as {person.character_name}</p>
                    ) : null}
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {person.role}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {crew.length > 0 && (
              <ul className="mt-10 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {crew.map((person) => (
                  <li
                    key={person.id}
                    className="rule-top grid grid-cols-[minmax(0,1fr)_auto] gap-4 pt-4 text-sm"
                  >
                    <span className="truncate text-muted-foreground">{person.role}</span>
                    <span className="shrink-0 font-display font-bold">{person.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="rule-top">
          <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-20">
            <h2 className="eyebrow">Gallery</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((image) => (
                <figure key={image.id} className="overflow-hidden rounded-sm border border-border">
                  <img
                    src={image.image_url}
                    alt={image.caption ?? `${film.title} still`}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/2] w-full object-cover"
                  />
                  {image.caption ? (
                    <figcaption className="px-4 py-3 text-xs text-muted-foreground">
                      {image.caption}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="rule-top">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
          <div className="frame rounded-sm border border-border p-8 md:p-14">
            <h2 className="eyebrow">Support this film</h2>
            <p className="mt-4 max-w-2xl text-3xl leading-tight sm:text-4xl">
              Help {film.title} reach the next audience.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Festival fees, subtitling and delivery costs are funded by partners and supporters.
              Talk to us about sponsorship, co-production or a one-off contribution.
            </p>
            <Link
              to="/partner"
              className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Heart className="h-4 w-4" /> Support the film
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
