import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getPost } from "@/lib/content.functions";
import { NewsletterForm } from "@/components/site/newsletter-form";
import type { Post } from "@/lib/content.types";

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params }): Promise<Post> => {
    const post = await getPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Article unavailable — Slate Safi" }, { name: "robots", content: "noindex" }],
      };
    }
    const description = (loaderData.excerpt ?? "A note from Slate Safi.").slice(0, 158);
    return {
      meta: [
        { title: `${loaderData.title} — Slate Safi` },
        { name: "description", content: description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load this article</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">Article not found</h1>
      <Link to="/news" className="mt-6 inline-block text-sm text-primary">
        Back to news
      </Link>
    </div>
  ),
  component: PostPage,
});

function PostPage() {
  const post = Route.useLoaderData();

  return (
    <article className="mx-auto max-w-[880px] px-5 pt-36 md:pt-44">
      <Link
        to="/news"
        className="inline-flex items-center gap-2 font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> News
      </Link>
      <p className="mt-8 text-xs uppercase tracking-[0.2em] text-primary">
        {post.category} ·{" "}
        {new Date(post.published_at).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
      <h1 className="mt-4 text-4xl leading-[0.98] sm:text-6xl">{post.title}</h1>
      {post.excerpt ? (
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
      ) : null}

      {post.cover_image_url ? (
        <img
          src={post.cover_image_url}
          alt={post.title}
          decoding="async"
          className="mt-10 aspect-[16/9] w-full rounded-sm border border-border object-cover"
        />
      ) : null}

      <div className="mt-12 space-y-6 text-base leading-relaxed text-muted-foreground">
        {(post.body ?? "").split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <p className="mt-12 text-sm text-muted-foreground">
        Words by <span className="text-foreground">{post.author ?? "Slate Safi"}</span>
      </p>

      <div className="rule-top mt-16 pt-12">
        <h2 className="eyebrow">Stay close to the work</h2>
        <p className="mt-4 text-2xl leading-tight sm:text-3xl">Get the next dispatch first.</p>
        <div className="mt-6">
          <NewsletterForm source="article" />
        </div>
      </div>
    </article>
  );
}
