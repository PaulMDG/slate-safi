import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { submitVideoLead } from "@/lib/content.functions";

const STORAGE_KEY = "slate-safi-video-optin";

/**
 * Dismissible opt-in modal shown once over the video area. Visitors may leave a
 * name plus either an email address or a WhatsApp number — entirely optional.
 */
export function VideoOptInModal({
  heading,
  body,
  videoId,
  delayMs = 9000,
}: {
  heading?: string | null;
  body?: string | null;
  videoId?: string | null;
  delayMs?: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const openedAt = useRef<number>(Date.now());
  const submit = useServerFn(submitVideoLead);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => {
      openedAt.current = Date.now();
      setOpen(true);
    }, delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* storage unavailable */
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = contact.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    const isPhone = /^\+?[0-9][0-9\s-]{6,}$/.test(trimmed);
    if (!name.trim()) {
      toast.error("Please add your name.");
      return;
    }
    if (!isEmail && !isPhone) {
      toast.error("Add an email address or a WhatsApp number.");
      return;
    }
    setPending(true);
    try {
      await submit({
        data: {
          name: name.trim(),
          contact: trimmed,
          contact_type: isEmail ? "email" : "whatsapp",
          video_id: videoId ?? null,
          source: "videos",
          honeypot,
          elapsed_ms: Date.now() - openedAt.current,
        },
      });
      toast.success("Thank you — we'll keep you posted.");
      dismiss();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send that.");
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading || "Stay in the loop"}
        className="frame relative w-full max-w-md rounded-sm border border-border bg-card p-7"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-primary"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="eyebrow">Optional</p>
        <h2 className="mt-3 text-2xl leading-tight">{heading || "Stay in the loop"}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {body ||
            "Leave your name and either an email or WhatsApp number and we'll send premiere dates and first looks. You can keep watching either way."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            placeholder="Your name"
            className="w-full rounded-sm border border-input bg-background/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={255}
            placeholder="Email or WhatsApp number"
            className="w-full rounded-sm border border-input bg-background/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Keep me posted
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
            >
              No thanks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
