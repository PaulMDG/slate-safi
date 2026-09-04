import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail, Facebook, Music2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="rule-top mt-24 bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-16 md:px-10 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="h-6 w-[3px] shrink-0 bg-primary" />
              <span className="font-display text-base font-extrabold uppercase tracking-[0.28em]">
                Slate Safi
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              An independent film production company based in Nairobi, making Kenyan stories built
              to travel — for audiences in East Africa, the UK, Canada and the United States.
            </p>
          </div>

          <div>
            <h3 className="eyebrow">Explore</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                { to: "/films", label: "Films" },
                { to: "/about", label: "About & Crew" },
                { to: "/news", label: "News" },
                { to: "/partner", label: "Partner & Contact" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-muted-foreground transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow">Contact</h3>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li>Kilimani, Nairobi, Kenya</li>
              <li>
                <a href="mailto:slatesafiweb@gmail.com" className="transition-colors hover:text-primary">
                  slatesafiweb@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+254758752424" className="transition-colors hover:text-primary">
                  +254 758 752424
                </a>
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              {[
                { href: "https://www.instagram.com/slatesafi/", label: "Instagram", Icon: Instagram },
                { href: "https://www.youtube.com/@slatesafi", label: "YouTube", Icon: Youtube },
                { href: "https://www.facebook.com/profile.php?id=61592753796585", label: "Facebook", Icon: Facebook },
                { href: "https://www.tiktok.com/@slate.safi", label: "TikTok", Icon: Music2 },
                { href: "mailto:slatesafiweb@gmail.com", label: "Email", Icon: Mail },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="rule-top mt-14 flex flex-col gap-2 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Slate Safi Ltd. All rights reserved.</p>
          <p>Nairobi · London · Toronto</p>
        </div>
      </div>
    </footer>
  );
}
