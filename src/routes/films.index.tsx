import { createFileRoute } from "@tanstack/react-router";
import { listFilms } from "@/lib/content.functions";
import { FilmCard } from "@/components/site/film-card";
import type { FilmSummary } from "@/lib/content.types";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/films/")({
  loader: (): Promise<FilmSummary[]> => listFilms(),
  head: () =>
    socialMeta({
      title: "Films — Slate Safi",
      description:
        "The Slate Safi slate: Boda Love (released) and Kibera Hustle (in post-production). Kenyan features made for international audiences.",
      path: "/films",
      image: "https://dvlfzfvbxntgfkpuliyb.supabase.co/storage/v1/object/public/media/films/heroes/1787781256896-hq720.jpg",
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

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
