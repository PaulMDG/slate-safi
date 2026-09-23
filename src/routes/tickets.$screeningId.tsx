import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Loader2, MapPin, Ticket } from "lucide-react";
import { bookTicket, getScreeningOffer, type ScreeningOffer } from "@/lib/tickets.functions";
import { socialMeta } from "@/lib/seo";

export const Route = createFileRoute("/tickets/$screeningId")({
  loader: ({ params }): Promise<ScreeningOffer | null> =>
    getScreeningOffer({ data: { id: params.screeningId } }),
  head: () =>
    socialMeta({
      title: "Book tickets — Slate Safi",
      description:
        "Reserve your seat for a Slate Safi screening. Pay with M-Pesa or register for free entry and get your ticket by email.",
      path: "/tickets",
    }),
  errorComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">We couldn't load this screening</h1>
      <p className="mt-4 text-sm text-muted-foreground">Please refresh to try again.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-5 py-40 text-center">
      <h1 className="text-3xl">Screening not found</h1>
    </div>
  ),
  component: BookingPage,
});

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground";

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BookingPage() {
  const offer = Route.useLoaderData();
  const navigate = useNavigate();
  const book = useServerFn(bookTicket);
  const startedAt = useRef(Date.now());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!offer) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-40 text-center">
        <h1 className="text-3xl">This screening isn't available</h1>
        <Link to="/screenings" className="mt-6 inline-block text-sm text-primary">
          See all screening dates
        </Link>
      </div>
    );
  }

  const free = Number(offer.price_kes) <= 0;
  const closed = !offer.tickets_enabled || offer.sold_out || offer.remaining === 0;
  const total = Number(offer.price_kes) * quantity;
  const maxQty = Math.min(10, offer.remaining ?? 10) || 1;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await book({
        data: {
          screening_id: offer!.id,
          name,
          email,
          phone: phone || null,
          quantity,
          honeypot,
          elapsed_ms: Date.now() - startedAt.current,
        },
      });
      navigate({ to: "/ticket/$reference", params: { reference: result.reference } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-36 md:px-10 md:pt-44">
      <Link to="/screenings" className="text-[0.6rem] uppercase tracking-[0.18em] text-primary">
        ← All screening dates
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <p className="eyebrow">{free ? "Free registration" : "Buy tickets"}</p>
          <h1 className="mt-5 text-4xl leading-[0.95] sm:text-6xl">
            {offer.film?.title ?? "Slate Safi screening"}
          </h1>
          <p className="mt-6 text-base text-muted-foreground">{formatWhen(offer.starts_at)}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {[offer.cinema?.name, offer.screen_label, offer.city ?? offer.cinema?.city]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {offer.note && (
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {offer.note}
            </p>
          )}

          <div className="mt-10 flex flex-wrap gap-8 border-t border-border pt-8 text-sm">
            <div>
              <p className={labelClass}>Price per ticket</p>
              <p className="mt-2 font-display text-2xl font-bold">
                {free ? "Free" : `KES ${Number(offer.price_kes).toLocaleString("en-KE")}`}
              </p>
            </div>
            {offer.remaining !== null && (
              <div>
                <p className={labelClass}>Tickets left</p>
                <p className="mt-2 font-display text-2xl font-bold">{offer.remaining}</p>
              </div>
            )}
          </div>

          {offer.ticket_terms && (
            <p className="mt-8 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {offer.ticket_terms}
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="frame h-max rounded-sm border border-border p-7">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.12em]">
            {free ? "Register" : "Checkout"}
          </h2>

          {closed ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Tickets for this date are closed. Follow our{" "}
              <Link to="/news" className="text-primary hover:underline">
                news feed
              </Link>{" "}
              for new dates.
            </p>
          ) : (
            <>
              <div className="mt-6 space-y-5">
                <div>
                  <label className={labelClass} htmlFor="t-name">
                    Full name
                  </label>
                  <input
                    id="t-name"
                    required
                    className={`${inputClass} mt-2`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="t-email">
                    Email (your ticket is sent here)
                  </label>
                  <input
                    id="t-email"
                    type="email"
                    required
                    className={`${inputClass} mt-2`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="t-phone">
                    {free ? "Phone (optional)" : "M-Pesa phone number"}
                  </label>
                  <input
                    id="t-phone"
                    required={!free}
                    placeholder="07XX XXX XXX"
                    className={`${inputClass} mt-2`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="t-qty">
                    Number of tickets
                  </label>
                  <select
                    id="t-qty"
                    className={`${inputClass} mt-2`}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  >
                    {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n} className="bg-background">
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                />
              </div>

              {!free && (
                <p className="mt-6 flex items-baseline justify-between border-t border-border pt-5 text-sm">
                  <span className={labelClass}>Total</span>
                  <span className="font-display text-xl font-bold">
                    KES {total.toLocaleString("en-KE")}
                  </span>
                </p>
              )}

              {error && <p className="mt-5 text-sm text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 py-4 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ticket className="h-4 w-4" />
                )}
                {free ? "Get my free ticket" : "Pay with M-Pesa"}
              </button>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                {free
                  ? "We'll email your ticket code and QR straight away."
                  : "You'll get an M-Pesa prompt on your phone. Approve it and your ticket arrives by email."}
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
