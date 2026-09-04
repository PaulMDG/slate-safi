import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { listPress, getFilm } from "@/lib/content.functions";
import type { PressItem, FilmCredit } from "@/lib/content.types";
import { socialMeta } from "@/lib/seo";

type AboutData = { press: PressItem[]; crew: FilmCredit[] };

export const Route = createFileRoute("/about")({
  loader: async (): Promise<AboutData> => {
    const [press, detail] = await Promise.all([
      listPress(),
      getFilm({ data: { slug: "kibera-hustle" } }),
    ]);
    return {
      press,
      crew: (detail?.credits ?? []).filter((c) => c.credit_type === "crew"),
    };
  },
  head: () =>
    socialMeta({
      title: "About Slate Safi — Nairobi Film Production Company",
      description:
        "Slate Safi is an independent Nairobi film production company building Kenyan stories for audiences in East Africa, the UK, Canada and the US.",
      path: "/about",
    }),

  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load this page</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  component: About,
});



const MARKETS = [
  {
    place: "Kenya",
    note: "Production base, Nairobi. Full in-house crew and equipment relationships.",
  },
  {
    place: "Wider Africa",
    note: "Festival and broadcast partners across East and Southern Africa.",
  },
  {
    place: "United Kingdom",
    note: "London EP desk, post facility partnership and sales representation.",
  },
  { place: "Canada", note: "Toronto co-production and diaspora distribution partners." },
  { place: "United States", note: "US festival strategy and streaming acquisition conversations." },
];

function About() {
  const { press, crew } = Route.useLoaderData();
  const quotes = press.filter((p) => p.kind === "quote");
  const laurels = press.filter((p) => p.kind === "laurel");


  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-5 pt-36 md:px-10 md:pt-44">
        <p className="eyebrow">Who we are</p>
        <h1 className="mt-5 max-w-4xl text-5xl leading-[0.92] sm:text-7xl">
          Kenyan stories, built to travel.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Slate Safi is an independent film production company in Nairobi. We develop, produce and
          deliver feature work with majority-Kenyan crews and international finance — films that
          hold up in a Nairobi cinema and in a festival theatre in London, Toronto or Austin.
        </p>
      </section>


      <section className="rule-top">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
          <div className="min-w-0">
            <h2 className="eyebrow">Our story</h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                Slate Safi started in 2019 as three people, one camera package and a stubborn
                belief: that the reason Kenyan features rarely travelled was not talent, it was
                infrastructure — financing, delivery standards and credits that international
                partners recognise.
              </p>
              <p>
                We built the company backwards from that problem. Every production runs to
                international delivery spec. Every department carries a trainee who leaves with a
                named credit. Every film is budgeted assuming a festival run and a foreign sale, not
                hoping for one.
              </p>
              <p>
                Boda Love, our 2024 debut, screened in Durban, Nairobi and London. Kibera Hustle, in
                post-production now, is our most ambitious production to date.
              </p>
            </div>
          </div>
          <div className="min-w-0">
            <h2 className="eyebrow">Mission</h2>
            <p className="mt-6 text-3xl leading-tight sm:text-4xl">
              Make the films East Africa is already good enough to make — and get them seen
              everywhere.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-8">
              {[
                ["94", "Crew on our last production"],
                ["86%", "Kenyan hires"],
                ["5", "Markets we distribute into"],
                ["11", "Trainees credited to date"],
              ].map(([value, label]) => (
                <div key={label} className="rule-top pt-4">
                  <dt className="font-display text-4xl font-extrabold text-primary">{value}</dt>
                  <dd className="mt-2 text-sm text-muted-foreground">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {crew.length > 0 && (
        <section className="rule-top">
          <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
            <h2 className="eyebrow">Crew</h2>
            <p className="mt-4 text-3xl leading-tight sm:text-4xl">
              The team behind Kibera Hustle
            </p>
            <div className="mt-12 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {crew.map((person) => (
                <div key={person.id} className="min-w-0 border-l border-primary/50 pl-5">
                  <p className="font-display text-lg font-bold leading-tight">{person.name}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-primary">
                    {person.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      <section className="rule-top">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
          <h2 className="eyebrow">Reach</h2>
          <p className="mt-4 text-3xl leading-tight sm:text-4xl">
            Five markets, one production base
          </p>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {MARKETS.map((m) => (
              <li key={m.place} className="min-w-0 border-l border-primary/50 pl-5">
                <p className="font-display text-lg font-bold">{m.place}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {(laurels.length > 0 || quotes.length > 0) && (
        <section className="rule-top">
          <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-16 md:grid-cols-2 md:px-10 md:py-24">
            <div className="min-w-0">
              <h2 className="eyebrow">Selections &amp; awards</h2>
              <ul className="mt-8 space-y-5">
                {laurels.map((l) => (
                  <li
                    key={l.id}
                    className="rule-top grid grid-cols-[minmax(0,1fr)_auto] gap-4 pt-4"
                  >
                    <span className="min-w-0">
                      <span className="block font-display text-sm font-bold uppercase tracking-[0.06em]">
                        {l.title}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{l.outlet}</span>
                    </span>
                    <span className="shrink-0 text-xs text-primary">{l.year}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <h2 className="eyebrow">Press</h2>
              <div className="mt-8 space-y-8">
                {quotes.map((q) => (
                  <blockquote key={q.id}>
                    <p className="font-display text-xl leading-snug">“{q.quote}”</p>
                    <footer className="mt-3 text-xs uppercase tracking-[0.2em] text-primary">
                      {q.outlet}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rule-top">
        <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-24">
          <div className="frame rounded-sm border border-border p-8 md:p-14">
            <h2 className="eyebrow">Work with us</h2>
            <p className="mt-4 max-w-2xl text-3xl leading-tight sm:text-4xl">
              Financing, co-production, distribution or press?
            </p>
            <Link
              to="/partner"
              className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start a conversation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
