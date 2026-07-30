import { createFileRoute } from "@tanstack/react-router";
import { listFilms } from "@/lib/content.functions";
import { FilmCard } from "@/components/site/film-card";
import type { FilmSummary } from "@/lib/content.types";

export const Route = createFileRoute("/films/")({
  loader: (): Promise<FilmSummary[]> => listFilms(),
  head: () => ({
    meta: [
      { title: "Films — Slate Safi" },
      {
        name: "description",
        content:
          "The Slate Safi slate: Boda Love (2024, released) and Kibera Hustle (2026, in post-production). Kenyan features made for international audiences.",
      },
      { property: "og:title", content: "Films — Slate Safi" },
      {
        property: "og:description",
        content: "Boda Love and Kibera Hustle — the Slate Safi feature slate from Nairobi.",
      },
    ],
  }),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load the films</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  component: FilmsIndex,
});

function FilmsIndex() {
  const films: FilmSummary[] = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-8 pt-36 md:px-10 md:pt-44">
      <p className="eyebrow">The slate</p>
      <h1 className="mt-5 max-w-3xl text-5xl leading-[0.92] sm:text-7xl">Films</h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        Feature work produced in Nairobi with majority-Kenyan crews, financed and distributed across
        five markets.
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
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
    </div>
  );
}
