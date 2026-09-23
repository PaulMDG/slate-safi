import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed, Loader2, Mail, Ticket } from "lucide-react";
import {
  checkInTicket,
  loadTicketAdmin,
  resendTicketEmail,
  setTicketStatus,
  type TicketAdminSnapshot,
} from "@/lib/tickets.functions";
import type { AdminSnapshot } from "@/lib/admin.functions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  issued: "Issued (free)",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function TicketsPanel({ data }: { data: AdminSnapshot }) {
  const load = useServerFn(loadTicketAdmin);
  const resend = useServerFn(resendTicketEmail);
  const setStatus = useServerFn(setTicketStatus);
  const checkIn = useServerFn(checkInTicket);
  const [busy, setBusy] = useState<string | null>(null);

  const query = useQuery<TicketAdminSnapshot>({
    queryKey: ["admin-tickets"],
    queryFn: () => load(),
  });

  if (query.isPending) {
    return <p className="text-sm text-muted-foreground">Loading ticket sales…</p>;
  }
  if (query.error || !query.data) {
    return <p className="text-sm text-muted-foreground">Could not load ticket sales.</p>;
  }

  const { tickets, mpesaReady, emailReady, callbackUrl } = query.data;
  const paid = tickets.filter((t) => t.status === "paid" || t.status === "issued");
  const revenue = paid.reduce((sum, t) => sum + t.total_kes, 0);
  const seats = paid.reduce((sum, t) => sum + t.quantity, 0);

  function screeningLabel(id: string) {
    const s = data.screenings.find((row) => row.id === id);
    if (!s) return "Screening";
    const film = data.films.find((f) => f.id === s.film_id)?.title ?? "Film";
    const cinema = data.cinemas.find((c) => c.id === s.cinema_id)?.name ?? "";
    return `${film}${cinema ? ` · ${cinema}` : ""} · ${new Date(s.starts_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}`;
  }

  async function run(key: string, fn: () => Promise<unknown>, message: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(message);
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-12">
      <section className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Tickets sold / issued", value: String(seats) },
          { label: "Revenue", value: `KES ${revenue.toLocaleString("en-KE")}` },
          { label: "Bookings", value: String(tickets.length) },
          {
            label: "Awaiting payment",
            value: String(tickets.filter((t) => t.status === "pending").length),
          },
        ].map((kpi) => (
          <div key={kpi.label} className="frame rounded-sm border border-border p-5">
            <p className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-3 font-display text-2xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </section>

      <section className="frame rounded-sm border border-border p-6">
        <h2 className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-[0.12em]">
          <Ticket className="h-4 w-4 text-primary" />
          Setup
        </h2>
        <ul className="mt-5 space-y-3 text-sm">
          <li className="flex items-center gap-2">
            {mpesaReady ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <CircleDashed className="h-4 w-4 text-muted-foreground" />
            )}
            M-Pesa {mpesaReady ? "connected" : "not connected — add the keys under Settings"}
          </li>
          <li className="flex items-center gap-2">
            {emailReady ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <CircleDashed className="h-4 w-4 text-muted-foreground" />
            )}
            Ticket email {emailReady ? "connected" : "not connected — add the keys under Settings"}
          </li>
        </ul>
        <p className="mt-5 break-all text-xs text-muted-foreground">
          Payment callback URL to register with Safaricom: {callbackUrl}
        </p>
      </section>

      <section>
        <h2 className="eyebrow">Bookings</h2>
        <div className="frame mt-6 divide-y divide-border rounded-sm border border-border">
          {tickets.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="grid gap-3 p-5 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold uppercase tracking-[0.12em]">
                    {t.reference} · {t.name}
                  </p>
                  <p className="mt-1 text-sm text-primary">{t.email}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {screeningLabel(t.screening_id)}
                  </p>
                  <p className="mt-2 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {STATUS_LABEL[t.status] ?? t.status} · {t.quantity} ticket
                    {t.quantity > 1 ? "s" : ""} ·{" "}
                    {t.total_kes > 0 ? `KES ${t.total_kes.toLocaleString("en-KE")}` : "Free"}
                    {t.mpesa_receipt ? ` · ${t.mpesa_receipt}` : ""}
                    {t.email_sent_at ? " · emailed" : t.email_error ? " · email failed" : ""}
                    {t.checked_in_at ? " · checked in" : ""}
                  </p>
                  {(t.payment_error || t.email_error) && (
                    <p className="mt-2 text-xs text-destructive">
                      {t.payment_error ?? t.email_error}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-start gap-3 text-[0.6rem] uppercase tracking-[0.18em]">
                  <button
                    onClick={() =>
                      void run(
                        `mail-${t.id}`,
                        () => resend({ data: { reference: t.reference } }),
                        "Ticket email sent.",
                      )
                    }
                    disabled={busy === `mail-${t.id}`}
                    className="inline-flex items-center gap-2 rounded-sm border border-border px-4 py-2 text-muted-foreground hover:text-primary disabled:opacity-50"
                  >
                    {busy === `mail-${t.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="h-3.5 w-3.5" />
                    )}
                    Resend
                  </button>
                  {t.status !== "paid" && t.status !== "issued" && (
                    <button
                      onClick={() =>
                        void run(
                          `paid-${t.id}`,
                          () => setStatus({ data: { id: t.id, status: "paid" } }),
                          "Marked as paid.",
                        )
                      }
                      disabled={busy === `paid-${t.id}`}
                      className="rounded-sm border border-border px-4 py-2 text-muted-foreground hover:text-primary disabled:opacity-50"
                    >
                      Mark paid
                    </button>
                  )}
                  {!t.checked_in_at && (
                    <button
                      onClick={() =>
                        void run(
                          `in-${t.id}`,
                          () => checkIn({ data: { id: t.id } }),
                          "Checked in.",
                        )
                      }
                      disabled={busy === `in-${t.id}`}
                      className="rounded-sm border border-border px-4 py-2 text-muted-foreground hover:text-primary disabled:opacity-50"
                    >
                      Check in
                    </button>
                  )}
                  {t.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        void run(
                          `cancel-${t.id}`,
                          () => setStatus({ data: { id: t.id, status: "cancelled" } }),
                          "Booking cancelled.",
                        )
                      }
                      disabled={busy === `cancel-${t.id}`}
                      className="rounded-sm border border-border px-4 py-2 text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
