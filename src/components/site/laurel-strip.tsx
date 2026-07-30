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
        <h2 className="eyebrow">Selected &amp; awarded</h2>
        <ul className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-5">
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
