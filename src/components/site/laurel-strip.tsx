import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

type PressItem = {
  id: string;
  kind: string;
  title: string;
  outlet: string | null;
  year: number | null;
};

export function LaurelStrip({ items }: { items: PressItem[] }) {
  const laurels = items.filter((i) => i.kind === "laurel");
  if (laurels.length === 0) return null;

  return (
    <section className="rule-top border-b border-border bg-surface/40">
      <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-12">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6">
          <h2 className="eyebrow">Awards &amp; recognition</h2>
          <Link
            to="/awards"
            className="hidden shrink-0 items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.18em] text-primary sm:inline-flex"
          >
            All awards <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {laurels.map((l) => (
            <li key={l.id} className="min-w-0 border-l border-primary/50 pl-4">
              <p className="font-display text-sm font-bold uppercase leading-tight tracking-[0.06em]">
                {l.title}
              </p>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {l.outlet}
                {l.year ? ` · ${l.year}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
