import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "254758752424";
const MESSAGE = "Hello Slate Safi, I'd like to make an enquiry.";

/** Floating WhatsApp enquiry button, fixed bottom-right on every page. */
export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Slate Safi on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary px-4 py-4 text-primary-foreground shadow-[0_10px_40px_-10px_var(--color-primary)] transition-transform hover:scale-[1.04] sm:bottom-8 sm:right-8"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden font-display text-[0.7rem] font-bold uppercase tracking-[0.18em] sm:inline">
        Enquire
      </span>
    </a>
  );
}
