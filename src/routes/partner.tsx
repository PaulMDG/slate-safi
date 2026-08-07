import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { submitEnquiry } from "@/lib/content.functions";
import { contactSchema } from "@/lib/content.schemas";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner & Contact — Slate Safi" },
      {
        name: "description",
        content:
          "Sponsorship, co-production, distribution and press enquiries for Slate Safi, the Nairobi film production company behind Boda Love and Kibera Hustle.",
      },
      { property: "og:title", content: "Partner & Contact — Slate Safi" },
      {
        property: "og:description",
        content: "Sponsorship, co-production, distribution and press enquiries for Slate Safi.",
      },
    ],
  }),
  component: Partner,
});

const TIERS = [
  {
    name: "Brand partnership",
    detail:
      "On-screen and campaign integration built into development, not bolted on. Includes credit, premiere presence and campaign assets across five markets.",
  },
  {
    name: "Co-production & finance",
    detail:
      "Equity, gap and soft-money structures with international delivery spec, full audit trail and recognised chain of title.",
  },
  {
    name: "Festival & impact support",
    detail:
      "Fund subtitling, delivery, travel and community screenings. Named support on the film's festival materials.",
  },
];

const INQUIRY_TYPES = [
  { value: "partnership", label: "Sponsorship / partnership" },
  { value: "distribution", label: "Distribution / sales" },
  { value: "press", label: "Press & festivals" },
  { value: "general", label: "Something else" },
] as const;

function Partner() {
  const send = useServerFn(submitEnquiry);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const mountedAt = useRef(Date.now());
  const [form, setForm] = useState({
    name: "",
    email: "",
    organisation: "",
    inquiry_type: "partnership",
    message: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form and try again.");
      return;
    }
    setPending(true);
    try {
      await send({
        data: { ...parsed.data, honeypot, elapsed_ms: Date.now() - mountedAt.current },
      });
      setDone(true);
      setForm({ name: "", email: "", organisation: "", inquiry_type: "partnership", message: "" });
      toast.success("Thank you — we'll be in touch within two working days.");
    } catch {
      toast.error("We couldn't send that. Please try again or email us directly.");
    } finally {
      setPending(false);
    }
  }


  const fieldClass =
    "w-full rounded-sm border border-input bg-background/60 px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
  const labelClass = "block text-[0.65rem] uppercase tracking-[0.2em] text-primary";

  return (
    <div>
      <section className="mx-auto max-w-[1400px] px-5 pt-36 md:px-10 md:pt-44">
        <p className="eyebrow">Partner &amp; contact</p>
        <h1 className="mt-5 max-w-4xl text-5xl leading-[0.92] sm:text-7xl">
          Back films that already travel.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Our work reaches audiences in Kenya, wider Africa, the UK, Canada and the US. Partners get
          a Nairobi production base that delivers to international spec — and a slate with festival
          form.
        </p>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div key={tier.name} className="frame min-w-0 rounded-sm border border-border p-7">
              <h2 className="text-xl leading-tight">{tier.name}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tier.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rule-top">
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-16 md:grid-cols-[1.3fr_1fr] md:px-10 md:py-24">
          <div className="min-w-0">
            <h2 className="eyebrow">Send an enquiry</h2>
            <p className="mt-4 text-3xl leading-tight sm:text-4xl">Tell us what you have in mind</p>

            {done ? (
              <div className="frame mt-10 rounded-sm border border-primary/40 p-8">
                <p className="font-display text-xl font-bold">Message received.</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Thank you — our partnerships desk replies within two working days.
                </p>
                <button
                  type="button"
                  onClick={() => setDone(false)}
                  className="mt-6 font-display text-xs font-bold uppercase tracking-[0.18em] text-primary"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-10 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={`mt-3 ${fieldClass}`}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      maxLength={255}
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={`mt-3 ${fieldClass}`}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="organisation">
                      Organisation (optional)
                    </label>
                    <input
                      id="organisation"
                      maxLength={160}
                      value={form.organisation}
                      onChange={(e) => update("organisation", e.target.value)}
                      className={`mt-3 ${fieldClass}`}
                      placeholder="Company, fund or outlet"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inquiry_type">
                      Enquiry type
                    </label>
                    <select
                      id="inquiry_type"
                      value={form.inquiry_type}
                      onChange={(e) => update("inquiry_type", e.target.value)}
                      className={`mt-3 ${fieldClass}`}
                    >
                      {INQUIRY_TYPES.map((t) => (
                        <option key={t.value} value={t.value} className="bg-background">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    maxLength={4000}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    className={`mt-3 resize-y ${fieldClass}`}
                    placeholder="What are you looking to do, and by when?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-8 py-4 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send enquiry
                </button>
              </form>
            )}
          </div>

          <aside className="min-w-0">
            <h2 className="eyebrow">Direct</h2>
            <ul className="mt-8 space-y-6 text-sm">
              <li className="flex gap-4">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-muted-foreground">Partnerships</span>
                  <a
                    href="mailto:partners@slatesafi.co.ke"
                    className="break-words hover:text-primary"
                  >
                    partners@slatesafi.co.ke
                  </a>
                </span>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-muted-foreground">Press &amp; festivals</span>
                  <a href="mailto:press@slatesafi.co.ke" className="break-words hover:text-primary">
                    press@slatesafi.co.ke
                  </a>
                </span>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-muted-foreground">Office</span>
                  <a href="tel:+254700000000" className="hover:text-primary">
                    +254 700 000 000
                  </a>
                </span>
              </li>
              <li className="flex gap-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-muted-foreground">Studio</span>
                  Kilimani, Nairobi, Kenya
                </span>
              </li>
            </ul>
            <p className="mt-10 text-sm leading-relaxed text-muted-foreground">
              Screeners and the full partnership deck are available to distributors, programmers and
              accredited press on request.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
