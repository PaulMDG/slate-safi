import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MapPin, XCircle } from "lucide-react";
import { getTicket, type TicketStatus } from "@/lib/tickets.functions";

export const Route = createFileRoute("/ticket/$reference")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your ticket — Slate Safi" },
      { name: "description", content: "Your Slate Safi screening ticket, code and QR pass." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Your ticket — Slate Safi" },
      { property: "og:description", content: "Your Slate Safi screening ticket." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TicketPage,
});

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

function QrCode({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void import("qrcode").then(async (mod) => {
      const url = await mod.default.toDataURL(value, {
        width: 320,
        margin: 1,
        color: { dark: "#0b0b0c", light: "#ffffff" },
      });
      if (active) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [value]);

  if (!src) return <div className="h-[220px] w-[220px] animate-pulse rounded-sm bg-muted" />;
  return <img src={src} alt="Ticket QR code" className="h-[220px] w-[220px] rounded-sm bg-white p-2" />;
}

function TicketPage() {
  const { reference } = Route.useParams();
  const fetchTicket = useServerFn(getTicket);

  const { data, isPending } = useQuery<TicketStatus | null>({
    queryKey: ["ticket", reference],
    queryFn: () => fetchTicket({ data: { reference } }),
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 4000 : false),
  });

  if (isPending) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-40 text-center">
        <h1 className="text-3xl">Ticket not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Check the code in your email, or{" "}
          <Link to="/partner" className="text-primary hover:underline">
            get in touch
          </Link>
          .
        </p>
      </div>
    );
  }

  const paid = data.status === "paid" || data.status === "issued";
  const pending = data.status === "pending";
  const failed = data.status === "failed" || data.status === "cancelled";
  const s = data.screening;

  return (
    <div className="mx-auto max-w-[900px] px-5 pb-24 pt-36 md:px-10 md:pt-44">
      <p className="eyebrow">
        {paid ? "Ticket confirmed" : pending ? "Waiting for payment" : "Payment not completed"}
      </p>
      <h1 className="mt-5 text-4xl leading-[0.95] sm:text-6xl">
        {s?.film?.title ?? "Slate Safi screening"}
      </h1>
      {s && (
        <>
          <p className="mt-6 text-base text-muted-foreground">{formatWhen(s.starts_at)}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {[s.cinema?.name, s.screen_label, s.city ?? s.cinema?.city].filter(Boolean).join(" · ")}
          </p>
        </>
      )}

      <div className="frame mt-12 grid gap-10 rounded-sm border border-border p-8 md:grid-cols-[240px_1fr] md:items-center">
        {paid ? (
          <QrCode value={`${data.reference}:${data.qr_token}`} />
        ) : (
          <div className="flex h-[220px] w-[220px] items-center justify-center rounded-sm border border-dashed border-border text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {pending ? "QR appears once paid" : "No ticket issued"}
          </div>
        )}

        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
            Ticket code
          </p>
          <p className="mt-3 font-display text-3xl font-bold tracking-[0.12em]">{data.reference}</p>

          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Name
              </dt>
              <dd className="mt-1">{data.name}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Tickets
              </dt>
              <dd className="mt-1">{data.quantity}</dd>
            </div>
            <div>
              <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Amount
              </dt>
              <dd className="mt-1">
                {data.total_kes > 0
                  ? `KES ${data.total_kes.toLocaleString("en-KE")}`
                  : "Free entry"}
              </dd>
            </div>
            {data.mpesa_receipt && (
              <div>
                <dt className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                  M-Pesa receipt
                </dt>
                <dd className="mt-1">{data.mpesa_receipt}</dd>
              </div>
            )}
          </dl>

          <div className="mt-8 flex items-start gap-3 text-sm">
            {paid ? (
              <>
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                <p className="text-muted-foreground">
                  {data.email_sent_at
                    ? `Emailed to ${data.email}. Show this code or QR at the door.`
                    : `Save this code — show it at the door. We couldn't email ${data.email}, so keep this page handy.`}
                </p>
              </>
            ) : pending ? (
              <>
                <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Approve the M-Pesa prompt on {data.name}'s phone. This page updates itself the
                  moment payment lands.
                </p>
              </>
            ) : (
              <>
                <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
                <p className="text-muted-foreground">
                  {data.payment_error ?? "The payment didn't go through."} You can start again from
                  the{" "}
                  <Link to="/screenings" className="text-primary hover:underline">
                    screenings page
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {s?.ticket_terms && (
        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {s.ticket_terms}
        </p>
      )}
    </div>
  );
}
