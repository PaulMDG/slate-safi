import { createFileRoute, Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/awards")({
  head: () =>
    socialMeta({
      title: "Awards & Recognition — Slate Safi",
      description:
        "International festival awards and African film honours for Sleeping Warrior (2021) and Boda Love (2024–2025), from Cannes World Film Festival to the Africa Movie Academy Awards.",
      path: "/awards",
      image:
        "https://dvlfzfvbxntgfkpuliyb.supabase.co/storage/v1/object/public/media/films/heroes/1787781256896-hq720.jpg",
    }),
  component: AwardsPage,
});

const POSTERS: Record<string, string> = {
  "sleeping-warrior":
    "https://dvlfzfvbxntgfkpuliyb.supabase.co/storage/v1/object/public/media/films/posters/1787786983419-sleeping-warrior.jpg",
  "boda-love":
    "https://dvlfzfvbxntgfkpuliyb.supabase.co/storage/v1/object/public/media/films/posters/1787780264244-boda-love.jpg",
};

type Honour = {
  year: string;
  title: string;
  outlet: string;
  body: string;
};

const SLEEPING_WARRIOR: Honour[] = [
  {
    year: "2021",
    title: "Best Documentary",
    outlet: "Cannes World Film Festival",
    body: "Sleeping Warrior received the Best Documentary award at the Cannes World Film Festival in 2021.",
  },
  {
    year: "2021",
    title: "Best Documentary Feature",
    outlet: "Chicago Indie Film Awards",
    body: "The film was awarded Best Documentary Feature at the Chicago Indie Film Awards. The festival's April 2021 winners announcement lists Sleeping Warrior, directed by Janet Wells and Mwaura Timothy, as the winner.",
  },
  {
    year: "2021",
    title: "Best Documentary Film Cinematography",
    outlet: "European Cinematography Awards",
    body: "Cinematographer Timothy Mwaura received the Best Documentary Film Cinematography award for Sleeping Warrior. The European Cinematography Awards' 2021 winners listing identifies Sleeping Warrior and Mwaura Timothy as the winner.",
  },
  {
    year: "2021",
    title: "Festival Awards & Official Selections",
    outlet: "International festival circuit",
    body: "During its 2021 festival journey, Sleeping Warrior received numerous laurels and recognitions across international festivals, including festivals in Toronto, Chicago, Houston, Cannes, Barcelona and Ghana. The film's official website records 13 official festival selections and six finalist placements, alongside its three specifically identified major awards.",
  },
  {
    year: "Recognition",
    title: "Award for the Advancement of Sport",
    outlet: "International Olympic Committee",
    body: "Sleeping Warrior also received an award from the International Olympic Committee for the advancement of sport. Our official history places the film's release and award-winning festival run in 2021, though no specific award date is published.",
  },
];

const BODA_LOVE: Honour[] = [
  {
    year: "2024",
    title: "Best Soundtrack",
    outlet: "Africa Movie Academy Awards (AMAA)",
    body: "Boda Love received four nominations at the Africa Movie Academy Awards and won Best Soundtrack. The award recognised the film's music, with particular credit to musician Billy Black, whose original music contributed to the film's soundtrack.",
  },
  {
    year: "2024",
    title: "Best Film",
    outlet: "Mombasa International Film Festival",
    body: "Boda Love won Best Film at the 2024 Mombasa International Film Festival.",
  },
  {
    year: "2024",
    title: "Best Actor",
    outlet: "Mombasa International Film Festival",
    body: "Duncan Murunyu Mungai, who plays Jabari, won Best Actor for his performance in Boda Love.",
  },
  {
    year: "2024",
    title: "Best Director",
    outlet: "Mombasa International Film Festival",
    body: "Boda Love received the Best Director award at the 2024 Mombasa International Film Festival, recognising the film's direction by Janet Wells and Grace Irungu.",
  },
  {
    year: "2024",
    title: "Best Screenplay",
    outlet: "Mombasa International Film Festival",
    body: "The film's screenplay was recognised with the Best Screenplay award at the 2024 Mombasa International Film Festival.",
  },
  {
    year: "2025",
    title: "Best Film",
    outlet: "Kitale Film Week",
    body: "Boda Love won Best Film at Kitale Film Week in 2025, competing against films from across Africa.",
  },
  {
    year: "2025",
    title: "Best Screenplay",
    outlet: "Kitale Film Week",
    body: "The film also won Best Screenplay at Kitale Film Week in 2025.",
  },
];

const GLANCE: { film: string; slug: string; year: string; award: string; org: string }[] = [
  {
    film: "Sleeping Warrior",
    slug: "sleeping-warrior",
    year: "2021",
    award: "Best Documentary",
    org: "Cannes World Film Festival",
  },
  {
    film: "Sleeping Warrior",
    slug: "sleeping-warrior",
    year: "2021",
    award: "Best Documentary Feature",
    org: "Chicago Indie Film Awards",
  },
  {
    film: "Sleeping Warrior",
    slug: "sleeping-warrior",
    year: "2021",
    award: "Best Documentary Film Cinematography",
    org: "European Cinematography Awards",
  },
  {
    film: "Sleeping Warrior",
    slug: "sleeping-warrior",
    year: "—",
    award: "Award for Advancement of Sport",
    org: "International Olympic Committee",
  },
  {
    film: "Boda Love",
    slug: "boda-love",
    year: "2024",
    award: "Best Soundtrack",
    org: "Africa Movie Academy Awards",
  },
  {
    film: "Boda Love",
    slug: "boda-love",
    year: "2024",
    award: "Best Film",
    org: "Mombasa International Film Festival",
  },
  {
    film: "Boda Love",
    slug: "boda-love",
    year: "2024",
    award: "Best Actor",
    org: "Mombasa International Film Festival",
  },
  {
    film: "Boda Love",
    slug: "boda-love",
    year: "2024",
    award: "Best Director",
    org: "Mombasa International Film Festival",
  },
  {
    film: "Boda Love",
    slug: "boda-love",
    year: "2024",
    award: "Best Screenplay",
    org: "Mombasa International Film Festival",
  },
  {
    film: "Boda Love",
    slug: "boda-love",
    year: "2025",
    award: "Best Film",
    org: "Kitale Film Week",
  },
  {
    film: "Boda Love",
    slug: "boda-love",
    year: "2025",
    award: "Best Screenplay",
    org: "Kitale Film Week",
  },
];

function HonourList({ items }: { items: Honour[] }) {
  return (
    <ul className="mt-10 grid gap-6 md:grid-cols-2">
      {items.map((h) => (
        <li
          key={`${h.title}-${h.outlet}-${h.year}`}
          className="frame min-w-0 rounded-sm border border-border p-7"
        >
          <div className="flex items-center gap-3">
            <Award className="h-4 w-4 shrink-0 text-primary" />
            <span className="font-display text-[0.65rem] font-bold uppercase tracking-[0.22em] text-primary">
              {h.year}
            </span>
          </div>
          <h3 className="mt-4 text-2xl leading-tight">{h.title}</h3>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {h.outlet}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{h.body}</p>
        </li>
      ))}
    </ul>
  );
}

function AwardsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-24 pt-36 md:px-10 md:pt-44">
      <p className="eyebrow">Awards &amp; recognition</p>
      <h1 className="mt-5 max-w-3xl text-5xl leading-[0.92] sm:text-7xl">
        Celebrating stories that make an impact
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Our films have received recognition from international film festivals and major African film
        awards, celebrating excellence in documentary filmmaking, cinematography, storytelling,
        music, acting and direction.
      </p>

      <section className="rule-top mt-20 pt-12">
        <div className="grid items-start gap-10 md:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0">
            <h2 className="eyebrow">Sleeping Warrior</h2>
            <p className="mt-4 max-w-2xl text-3xl leading-tight sm:text-4xl">
              Internationally recognised documentary — 2021
            </p>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Sleeping Warrior is a feature-length documentary following Africa's first female
              lacrosse team and their journey from Kenya to the 2019 World Lacrosse Championships in
              Canada.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Released in 2021, the documentary went on to receive recognition from film festivals
              around the world. Contemporary reporting from May 2021 records awards already received
              in Toronto, Chicago and Houston, with the Cannes World Film Festival recognition
              announced on 24 May 2021.
            </p>
          </div>
          <Link
            to="/films/$slug"
            params={{ slug: "sleeping-warrior" }}
            className="block overflow-hidden rounded-sm border border-border"
          >
            <img
              src={POSTERS["sleeping-warrior"]}
              alt="Sleeping Warrior poster"
              loading="lazy"
              decoding="async"
              className="aspect-[2/3] w-full object-cover"
            />
          </Link>
        </div>
        <HonourList items={SLEEPING_WARRIOR} />
        <Link
          to="/films/$slug"
          params={{ slug: "sleeping-warrior" }}
          className="mt-8 inline-flex font-display text-xs font-bold uppercase tracking-[0.18em] text-primary"
        >
          View Sleeping Warrior
        </Link>
      </section>

      <section className="rule-top mt-20 pt-12">
        <div className="grid items-start gap-10 md:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0">
            <h2 className="eyebrow">Boda Love</h2>
            <p className="mt-4 max-w-2xl text-3xl leading-tight sm:text-4xl">
              Award-winning Kenyan romantic comedy — 2024–2025
            </p>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Boda Love is a Kenyan romantic comedy filmed entirely in Nairobi and released
              theatrically in 2024. The film went on to receive major recognition at the Africa Movie
              Academy Awards, Mombasa International Film Festival, and Kitale Film Week.
            </p>
          </div>
          <Link
            to="/films/$slug"
            params={{ slug: "boda-love" }}
            className="block overflow-hidden rounded-sm border border-border"
          >
            <img
              src={POSTERS["boda-love"]}
              alt="Boda Love poster"
              loading="lazy"
              decoding="async"
              className="aspect-[2/3] w-full object-cover"
            />
          </Link>
        </div>
        <HonourList items={BODA_LOVE} />
        <Link
          to="/films/$slug"
          params={{ slug: "boda-love" }}
          className="mt-8 inline-flex font-display text-xs font-bold uppercase tracking-[0.18em] text-primary"
        >
          View Boda Love
        </Link>
      </section>

      <section className="rule-top mt-20 pt-12">
        <h2 className="eyebrow">At a glance</h2>
        <div className="mt-8 overflow-x-auto rounded-sm border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-5 py-4 font-display font-bold">Film</th>
                <th className="px-5 py-4 font-display font-bold">Year</th>
                <th className="px-5 py-4 font-display font-bold">Award / recognition</th>
                <th className="px-5 py-4 font-display font-bold">Festival / organisation</th>
              </tr>
            </thead>
            <tbody>
              {GLANCE.map((row, i) => (
                <tr
                  key={`${row.film}-${row.award}-${row.org}-${i}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-5 py-4">
                    <Link
                      to="/films/$slug"
                      params={{ slug: row.slug }}
                      className="hover:text-primary"
                    >
                      {row.film}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{row.year}</td>
                  <td className="px-5 py-4">{row.award}</td>
                  <td className="px-5 py-4 text-muted-foreground">{row.org}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-5 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          The International Olympic Committee award is confirmed in our official history, but no
          precise award date is published — we list it without a year.
        </p>
      </section>

      <section className="rule-top mt-20 pt-12">
        <h2 className="eyebrow">A legacy of recognition</h2>
        <p className="mt-4 max-w-3xl text-3xl leading-tight sm:text-4xl">
          Two films. Multiple international honours. One commitment to powerful African stories.
        </p>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          From international documentary festivals to some of Africa's most respected film awards,
          these recognitions reflect the ambition behind every production. Kibera Hustle premieres in
          October 2026 and has not yet begun its festival run.
        </p>
        <Link
          to="/screenings"
          className="mt-8 inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
        >
          See screening dates
        </Link>
      </section>
    </div>
  );
}
