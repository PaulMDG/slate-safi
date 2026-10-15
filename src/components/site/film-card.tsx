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
    <Link to="/films/$slug" params={{ slug }} className="group block min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-[var(--shadow-lift)]">
        {image ? <img src={image} alt={`${title} — film poster`} loading={priority ? "eager" : "lazy"} decoding="async" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none" /> : <div className="grid h-full place-items-center p-6 font-display text-3xl font-bold">{title}</div>}
        <span className="absolute left-4 top-4 rounded-sm bg-sunshine px-3 py-1.5 text-xs font-semibold text-sunshine-foreground">{status === "released" ? "Released" : "Upcoming"}</span>
        <span className="absolute bottom-4 right-4 grid size-11 place-items-center rounded-full bg-surface text-primary transition-transform group-hover:-translate-y-1"><ArrowUpRight className="size-5" /></span>
      </div>
      <div className="pt-5">
        <p className="text-xs font-medium text-muted-foreground">{[release_year, genre].filter(Boolean).join(" · ")}</p>
        <h3 className="mt-2 text-2xl leading-tight transition-colors group-hover:text-primary">{title}</h3>
        {tagline ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tagline}</p> : null}
      </div>
    </Link>
  );
}
