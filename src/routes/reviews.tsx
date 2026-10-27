import { PageIntro } from "@/components/site/page-intro";
import { Button } from "@/components/ui/button";
import { listReviews } from "@/lib/content.functions";
import type { ReviewSummary } from "@/lib/content.types";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/reviews")({
  loader: (): Promise<ReviewSummary[]> => listReviews(),
  head: () => {
    const social = socialMeta({
      title: "Reviews — Slate Safi",
      description:
        "What critics are saying about Slate Safi films — press reviews and coverage from Kenyan and international media.",
      path: "/reviews",
    });
    return { ...social, links: [...social.links] };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load the reviews</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  component: ReviewsPage,
});

function ReviewCard({ review }: { review: ReviewSummary }) {
  return (
    <article className="flex h-full flex-col rounded-sm border border-border bg-secondary p-8 shadow-sm transition-shadow hover:shadow-md sm:p-10">
      <span aria-hidden className="block font-serif text-6xl leading-none text-festival">
        “
      </span>
      <h2 className="mt-2 text-2xl leading-snug font-medium text-balance sm:text-3xl">
        {review.title}
      </h2>
      {review.quote ? (
        <p className="mt-5 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {review.quote}
        </p>
      ) : null}
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <div className="min-w-0">
          {review.film ? (
            <Link
              to="/films/$slug"
              params={{ slug: review.film.slug }}
              className="group flex items-center gap-3"
            >
              {review.film.poster_url ? (
                <img
                  src={review.film.poster_url}
                  alt={`Poster for ${review.film.title}`}
                  loading="lazy"
                  className="h-16 w-11 rounded-sm border border-border object-contain"
                />
              ) : null}
              <span className="text-sm">
                <span className="block font-medium transition-colors group-hover:text-primary">
                  {review.film.title}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {review.outlet}
                  {review.year ? ` · ${review.year}` : ""}
                </span>
              </span>
            </Link>
          ) : (
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {review.outlet}
              {review.year ? ` · ${review.year}` : ""}
            </p>
          )}
        </div>
        {review.link_url ? (
          <a href={review.link_url} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              Read the full review
              <ExternalLink className="size-4" />
            </Button>
          </a>
        ) : null}
      </footer>
    </article>
  );
}

function ReviewsPage() {
  const reviews: ReviewSummary[] = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-8 pt-28 md:px-10 md:pt-36">
      <PageIntro eyebrow="Critical reception" title="What the critics are saying">
        Press reviews and coverage of Slate Safi films, from Kenyan newspapers to international
        festival coverage.
      </PageIntro>

      {reviews.length === 0 ? (
        <p className="mt-16 text-sm text-muted-foreground">
          Reviews are being added — check back soon.
        </p>
      ) : (
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
