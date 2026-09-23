import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed, KeyRound, Loader2, Save } from "lucide-react";
import { loadTicketAdmin, savePaymentCredentials, type TicketAdminSnapshot } from "@/lib/tickets.functions";
import { MPESA_REQUIRED_KEYS, PAYMENT_CHANNELS } from "@/lib/payments.channels";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground";

export function PaymentsSettings() {
  const load = useServerFn(loadTicketAdmin);
  const save = useServerFn(savePaymentCredentials);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const query = useQuery<TicketAdminSnapshot>({
    queryKey: ["admin-tickets"],
    queryFn: () => load(),
  });

  const keyStatus = query.data?.keyStatus ?? {};

  async function onSave(channelId: string, keys: string[]) {
    const entries = keys
      .filter((name) => values[name] !== undefined)
      .map((name) => ({ key_name: name, value: values[name] ?? "" }));
    if (!entries.length) {
      toast.error("Enter a key first.");
      return;
    }
    setBusy(channelId);
    try {
      await save({ data: { entries } });
      setValues((prev) => {
        const next = { ...prev };
        for (const name of keys) delete next[name];
        return next;
      });
      toast.success("Saved.");
      await query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h2 className="eyebrow">Ticketing: M-Pesa &amp; email delivery</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Paste the M-Pesa (Daraja) credentials here. Values are stored
        server-side and never shown again — leave a field blank to keep the saved value. Ticket
        emails are delivered through Resend. Register
        this callback URL with Safaricom:{" "}
        <span className="break-all text-foreground">
          {query.data?.callbackUrl ?? "…/api/public/mpesa/callback"}
        </span>
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {PAYMENT_CHANNELS.map((channel) => {
          const required = channel.id === "mpesa" ? MPESA_REQUIRED_KEYS : channel.keys.map((k) => k.name);
          const connected = required.every((name) => keyStatus[name]);
          const dirty = channel.keys.some((k) => values[k.name] !== undefined);
          return (
            <div key={channel.id} className="frame rounded-sm border border-border p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                  <KeyRound className="h-4 w-4 text-primary" />
                  {channel.label}
                </h3>
                <span
                  className={`inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] ${
                    connected ? "text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {connected ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <CircleDashed className="h-3.5 w-3.5" />
                  )}
                  {connected ? "Connected" : "Not connected"}
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">{channel.docs}</p>

              <div className="mt-5 space-y-4">
                {channel.keys.map((key) => (
                  <div key={key.name}>
                    <label className={labelClass} htmlFor={`pay-${key.name}`}>
                      {key.label} {keyStatus[key.name] ? "• saved" : ""}
                    </label>
                    <input
                      id={`pay-${key.name}`}
                      type="password"
                      autoComplete="off"
                      className={`${inputClass} mt-2`}
                      placeholder={
                        keyStatus[key.name] ? "••••••••  (leave blank to keep)" : key.hint ?? key.name
                      }
                      value={values[key.name] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [key.name]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => void onSave(channel.id, channel.keys.map((k) => k.name))}
                  disabled={busy === channel.id || !dirty}
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
                >
                  {busy === channel.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => {
                    setValues((prev) => {
                      const next = { ...prev };
                      for (const k of channel.keys) next[k.name] = "";
                      return next;
                    });
                    void onSave(channel.id, channel.keys.map((k) => k.name));
                  }}
                  disabled={busy === channel.id}
                  className="inline-flex items-center gap-2 rounded-sm border border-border px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
