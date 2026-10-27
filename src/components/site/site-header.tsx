import { Link } from "@tanstack/react-router";
import { Clapperboard, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/films", label: "Films" },
  { to: "/videos", label: "Videos" },
  { to: "/music", label: "Music" },
  { to: "/screenings", label: "Showings" },
  { to: "/awards", label: "Awards" },
  { to: "/reviews", label: "Reviews" },
  { to: "/about", label: "About" },
  { to: "/news", label: "News" },
  { to: "/partner", label: "Partner & Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "bg-surface/95 border-b border-border backdrop-blur-xl shadow-[var(--shadow-header)]"
          : "bg-surface/85 border-b border-border backdrop-blur-md"
      }`}
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 md:px-10">
        <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          <Clapperboard className="size-8 shrink-0 text-primary" strokeWidth={1.8} />
          <span className="font-display truncate text-2xl font-extrabold">
            Slate Safi
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:gap-7 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
              className="font-display text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button variant="outline" size="icon"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-border text-foreground xl:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-background xl:hidden">
          <nav className="mx-auto flex max-w-[1400px] max-h-[calc(100dvh-80px)] overflow-y-auto flex-col px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-foreground" }}
                className="font-display border-b border-border py-4 text-2xl font-semibold last:border-b-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
