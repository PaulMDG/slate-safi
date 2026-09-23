/**
 * Ticket types can be attached to one screening date, or defined once for a
 * film and/or a cinema so every matching date picks them up automatically.
 * A date-specific set always wins over the reusable ones.
 */
export type TicketTypeRow = {
  id: string;
  name: string;
  description: string | null;
  price_kes: number | string;
  capacity: number | null;
  screening_id: string | null;
  film_id: string | null;
  cinema_id: string | null;
  sort_order: number;
  published: boolean;
};

type ScreeningRef = { id: string; film_id: string | null; cinema_id: string | null };

function byOrder<T extends TicketTypeRow>(rows: T[]) {
  return [...rows].sort(
    (a, b) => a.sort_order - b.sort_order || Number(a.price_kes) - Number(b.price_kes),
  );
}

export function typesForScreening<T extends TicketTypeRow>(
  types: readonly T[],
  screening: ScreeningRef,
): T[] {
  const exact = types.filter((t) => t.screening_id === screening.id);
  if (exact.length) return byOrder(exact);
  return byOrder(
    types.filter(
      (t) =>
        !t.screening_id &&
        (t.film_id || t.cinema_id) &&
        (!t.film_id || t.film_id === screening.film_id) &&
        (!t.cinema_id || t.cinema_id === screening.cinema_id),
    ),
  );
}

/** Lowest price across the resolved types, falling back to the date's own price. */
export function lowestPrice(types: readonly TicketTypeRow[], fallback: number) {
  if (types.length === 0) return fallback;
  return Math.min(...types.map((t) => Number(t.price_kes ?? 0)));
}
