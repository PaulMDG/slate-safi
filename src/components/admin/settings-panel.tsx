import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed, KeyRound, Loader2, Save } from "lucide-react";
import { saveSocialAccount, type SocialSnapshot } from "@/lib/social.functions";
import { saveChannelCredentials } from "@/lib/ai.functions";
import { PLATFORM_LABEL, type Platform } from "@/lib/social.captions";
import { CHANNELS, REQUIRED_KEYS } from "@/lib/social.channels";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground";

type AccountDraft = {
  handle: string;
  display_name: string;
  notes: string;
  connected: boolean;
};

function CredentialsSection({
  keyStatus,
  onDone,
}: {
  keyStatus: Record<string, boolean>;
  onDone: () => unknown;
}) {
  const save = useServerFn(saveChannelCredentials);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function onSave(platform: string, keys: string[]) {
    const entries = keys
      .filter((name) => values[name] !== undefined)
      .map((name) => ({ key_name: name, value: values[name] ?? "" }));
    if (!entries.length) {
      toast.error("Enter a key first.");
      return;
    }
    setBusy(platform);
    try {
      await save({ data: { platform, entries } });
      setValues((prev) => {
        const next = { ...prev };
        for (const name of keys) delete next[name];
        return next;
      });
      toast.success("API access saved.");
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save keys.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h2 className="eyebrow">API keys &amp; connections</h2>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Paste the access keys for each platform here. Values are stored server-side and never
        shown again — leave a field blank to keep the existing key, or clear a saved key with the
        Clear button. Channels with publishing support go live as soon as their keys are saved.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {CHANNELS.map((channel) => {
          const connected = (REQUIRED_KEYS[channel.id] ?? []).every((n) => keyStatus[n]);
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
                  {connected ? "Keys saved" : "Not connected"}
                </span>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">{channel.docs}</p>
              {!channel.publishing && (
                <p className="mt-2 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Stored for later — auto-posting adapter not enabled yet
                </p>
              )}

              <div className="mt-5 space-y-4">
                {channel.keys.map((key) => (
                  <div key={key.name}>
                    <label className={labelClass} htmlFor={`cred-${key.name}`}>
                      {key.label} {keyStatus[key.name] ? "• saved" : ""}
                    </label>
                    <input
                      id={`cred-${key.name}`}
                      type="password"
                      autoComplete="off"
                      className={`${inputClass} mt-2`}
                      placeholder={keyStatus[key.name] ? "••••••••  (leave blank to keep)" : key.hint ?? key.name}
                      value={values[key.name] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [key.name]: e.target.value }))
                      }
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
                  Save keys
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


export function SettingsPanel({
  social,
  onDone,
}: {
  social: SocialSnapshot;
  onDone: () => unknown;
}) {
  const save = useServerFn(saveSocialAccount);
  const [drafts, setDrafts] = useState<Record<string, AccountDraft>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  function draftFor(id: string, row: SocialSnapshot["accounts"][number]): AccountDraft {
    return (
      drafts[id] ?? {
        handle: row.handle ?? "",
        display_name: row.display_name ?? "",
        notes: row.notes ?? "",
        connected: row.connected,
      }
    );
  }

  function patch(id: string, row: SocialSnapshot["accounts"][number], next: Partial<AccountDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(id, row), ...next } }));
  }

  async function onSave(id: string, row: SocialSnapshot["accounts"][number]) {
    setBusyId(id);
    try {
      const d = draftFor(id, row);
      await save({
        data: {
          id,
          handle: d.handle || null,
          display_name: d.display_name || null,
          notes: d.notes || null,
          connected: d.connected,
        },
      });
      toast.success("Settings saved.");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-14">
      <section>
        <h2 className="eyebrow">Channel settings</h2>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Record each studio channel now and connect the API access whenever you're ready.
          Captions can be drafted and scheduled before a channel goes live — nothing publishes
          until its credentials are in place.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {social.accounts.map((row) => {
            const platform = row.platform as Platform;
            const ready = social.credentials[platform];
            const d = draftFor(row.id, row);
            const dirty = Boolean(drafts[row.id]);
            return (
              <div key={row.id} className="frame rounded-sm border border-border p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-display text-lg font-bold">
                    {PLATFORM_LABEL[platform] ?? row.platform}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.18em] ${
                      ready ? "text-emerald-400" : "text-muted-foreground"
                    }`}
                  >
                    {ready ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <CircleDashed className="h-3.5 w-3.5" />
                    )}
                    {ready ? "API connected" : "Connect later"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor={`handle-${row.id}`}>
                      Handle
                    </label>
                    <input
                      id={`handle-${row.id}`}
                      className={`${inputClass} mt-2`}
                      placeholder="@slatesafi"
                      value={d.handle}
                      onChange={(e) => patch(row.id, row, { handle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`name-${row.id}`}>
                      Display name
                    </label>
                    <input
                      id={`name-${row.id}`}
                      className={`${inputClass} mt-2`}
                      placeholder="Slate Safi"
                      value={d.display_name}
                      onChange={(e) => patch(row.id, row, { display_name: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor={`notes-${row.id}`}>
                      Notes
                    </label>
                    <textarea
                      id={`notes-${row.id}`}
                      rows={3}
                      className={`${inputClass} mt-2`}
                      placeholder="Who owns this channel, app review status, next steps…"
                      value={d.notes}
                      onChange={(e) => patch(row.id, row, { notes: e.target.value })}
                    />
                  </div>
                </div>

                <label className="mt-5 flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={d.connected}
                    onChange={(e) => patch(row.id, row, { connected: e.target.checked })}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  Mark this channel as active for publishing
                </label>

                <p className="mt-5 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Required access keys: {REQUIRED_KEYS[platform]?.join(", ")}
                </p>

                <button
                  onClick={() => void onSave(row.id, row)}
                  disabled={busyId === row.id || !dirty}
                  className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-50"
                >
                  {busyId === row.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            );
          })}
          {social.accounts.length === 0 && (
            <p className="text-sm text-muted-foreground">No channels configured yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="eyebrow">Integrations to connect later</h2>
        <ul className="mt-6 divide-y divide-border text-sm">
          {[
            {
              name: "Payments (ticketing, screeners, sponsorship)",
              detail: "Checkout, orders and revenue reporting — not set up yet.",
            },
            {
              name: "Email delivery for enquiry alerts",
              detail: "Route new enquiries to a studio inbox automatically.",
            },
            {
              name: "Scheduled auto-posting",
              detail: "The queue endpoint is live; point a scheduler at it to publish hands-free.",
            },
          ].map((item) => (
            <li key={item.name} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
              <div>
                <p className="font-display text-base font-bold">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <span className="text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
                Connect later
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
