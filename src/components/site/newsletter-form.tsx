import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/content.functions";

export function NewsletterForm({ source = "website" }: { source?: string }) {
  const subscribe = useServerFn(subscribeToNewsletter);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const mountedAt = useRef(Date.now());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setPending(true);
    try {
      await subscribe({
        data: {
          email: value,
          source,
          honeypot,
          elapsed_ms: Date.now() - mountedAt.current,
        },
      });
      setEmail("");
      toast.success("You're on the list. Watch for our next dispatch.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <label htmlFor={`newsletter-${source}`} className="sr-only">
        Email address
      </label>
      {/* Anti-spam honeypot: hidden from users, tempting to bots. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={`nl-company-${source}`}>Company</label>
        <input
          id={`nl-company-${source}`}
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      <input
        id={`newsletter-${source}`}
        type="email"
        required
        maxLength={255}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className="h-13 min-w-0 flex-1 rounded-sm border border-input bg-background/60 px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-sm bg-primary px-7 py-3 font-display text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Subscribe
        {!pending && <ArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}

