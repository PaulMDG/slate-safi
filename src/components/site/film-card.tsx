import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

type FilmCardProps = {
  slug: string;
  title: string;
  tagline?: string | null;
  status: string;
  release_year?: number | null;
  genre?: string | null;
  image?: string | null;
  priority?: boolean;
};

export function FilmCard({
  slug,
  title,
  tagline,
  status,
  release_year,
  genre,
  image,
  priority,
}: FilmCardProps) {
  return (
    <Link
      to="/films/$slug"
      params={{ slug }}
      className="group relative block overflow-hidden rounded-sm border border-border frame"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={`${title} — film still`}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 veil" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-primary">{status === "released" ? "Released" : "Upcoming"}</span>
            {release_year ? <span>{release_year}</span> : null}
            {genre ? <span className="truncate">{genre}</span> : null}
          </div>
          <h3 className="mt-3 text-3xl leading-none">{title}</h3>
          {tagline ? (
            <p className="mt-3 line-clamp-2 max-w-sm text-sm text-muted-foreground">{tagline}</p>
          ) : null}
          <span className="mt-5 inline-flex items-center gap-1.5 font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] text-foreground">
            View film
            <ArrowUpRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
