import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, MapPin, Ticket } from "lucide-react";
import { listScreenings } from "@/lib/content.functions";
import type { ScreeningListing } from "@/lib/content.types";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/screenings")({
  loader: (): Promise<ScreeningListing[]> => listScreenings(),
  head: () =>
    socialMeta({
      title: "Screenings & Tickets — Slate Safi",
      description:
        "Premiere and screening dates for Slate Safi films across Kenyan cinemas. Pick your cinema and book tickets through their own ticketing system.",
      path: "/screenings",
      image: "https://dvlfzfvbxntgfkpuliyb.supabase.co/storage/v1/object/public/media/films/heroes/1787781256896-hq720.jpg",
    }),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load the screening dates</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">Page not found</h1>
    </div>
  ),
  component: ScreeningsPage,
});

const KIND_LABEL: Record<string, string> = {
  premiere: "Premiere",
  screening: "Screening",
  festival: "Festival",
  special: "Special event",
};

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

function ScreeningsPage() {
  const all: ScreeningListing[] = Route.useLoaderData();
  const now = Date.now();
  const isLive = (s: ScreeningListing) =>
    new Date(s.ends_at ?? s.starts_at).getTime() >= now - 6 * 60 * 60 * 1000;

  const upcoming = all.filter(isLive);
  const past = all.filter((s) => !isLive(s)).reverse();

  const grouped = upcoming.reduce<Record<string, ScreeningListing[]>>((acc, s) => {
    const key = new Date(s.starts_at).toISOString().slice(0, 10);
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-36 md:px-10 md:pt-44">
      <p className="eyebrow">Where to watch</p>
      <h1 className="mt-5 max-w-3xl text-5xl leading-[0.92] sm:text-7xl">Screenings & tickets</h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Slate Safi films play in cinemas across Kenya. Choose your cinema below and you'll be taken
        to that cinema's own ticketing system to complete your booking.
      </p>

      {upcoming.length === 0 ? (
        <div className="mt-16 rounded-sm border border-border p-10">
          <h2 className="text-2xl">No dates announced right now</h2>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground">
            New premiere and screening dates are posted here first. Follow our{" "}
            <Link to="/news" className="text-primary underline-offset-4 hover:underline">
              news feed
            </Link>{" "}
            to hear about them as soon as they're confirmed.
          </p>
        </div>
      ) : (
        <div className="mt-16 space-y-14">
          {Object.entries(grouped).map(([day, rows]) => (
            <section key={day}>
              <h2 className="font-display text-xs font-bold uppercase tracking-[0.22em] text-primary">
                {formatDay(rows[0]!.starts_at)}
              </h2>
              <ul className="mt-6 space-y-4">
                {rows.map((s) => (
                  <ScreeningRow key={s.id} screening={s} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <section className="rule-top mt-24 pt-12">
          <h2 className="eyebrow">Past dates</h2>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            {past.slice(0, 12).map((s) => (
              <li key={s.id}>
                {formatDay(s.starts_at)} — {s.film?.title ?? "Film"} at{" "}
                {s.cinema?.name ?? "cinema"}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ScreeningRow({ screening: s }: { screening: ScreeningListing }) {
  const ticketUrl = s.ticket_url || s.cinema?.ticketing_url || null;
  const city = s.city || s.cinema?.city;

  return (
    <li className="grid gap-6 rounded-sm border border-border p-6 transition-colors hover:border-primary/50 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-3 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="rounded-sm bg-primary/15 px-2 py-1 text-primary">
            {KIND_LABEL[s.kind] ?? s.kind}
          </span>
          <span>{formatTime(s.starts_at)}</span>
          {s.ends_at && <span>through {formatDay(s.ends_at)}</span>}
          {s.sold_out && <span className="text-destructive">Sold out</span>}
        </div>

        <h3 className="mt-4 text-2xl leading-tight">
          {s.film ? (
            <Link
              to="/films/$slug"
              params={{ slug: s.film.slug }}
              className="hover:text-primary"
            >
              {s.film.title}
            </Link>
          ) : (
            "Slate Safi film"
          )}
        </h3>

        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {s.cinema?.name ?? "Cinema"}
          {s.screen_label ? ` · ${s.screen_label}` : ""}
          {city ? ` · ${city}` : ""}
        </p>

        {(s.note || s.cinema?.booking_note) && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {s.note || s.cinema?.booking_note}
          </p>
        )}
      </div>

      <div className="md:text-right">
        {ticketUrl && !s.sold_out ? (
          <a
            href={ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Ticket className="h-3.5 w-3.5" />
            Buy tickets
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {s.sold_out ? "Sold out" : "Tickets soon"}
          </span>
        )}
      </div>
    </li>
  );
}
