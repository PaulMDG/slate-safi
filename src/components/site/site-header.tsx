import { Link } from "@tanstack/react-router";
import { ChevronDown, Clapperboard, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MEDIA = [
  { to: "/films", label: "Films" },
  { to: "/videos", label: "Videos" },
  { to: "/music", label: "Music" },
] as const;

const NAV = [
  { to: "/", label: "Home" },
  { label: "Media", items: MEDIA },
  { to: "/screenings", label: "Showings" },
  { to: "/awards", label: "Awards" },
  { to: "/reviews", label: "Reviews" },
  { to: "/about", label: "About" },
  { to: "/news", label: "News" },
  { to: "/partner", label: "Partner & Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [mobileMediaOpen, setMobileMediaOpen] = useState(false);
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
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 md:gap-4 md:px-10">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
          <Clapperboard className="size-7 shrink-0 text-primary md:size-8" strokeWidth={1.8} />
          <span className="font-display truncate text-xl font-extrabold md:text-2xl">
            Slate Safi
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-2 sm:flex xl:gap-4">
          {NAV.map((item) =>
            "items" in item ? (
              <DropdownMenu key={item.label}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="font-display h-9 gap-1 px-1.5 text-xs font-medium text-muted-foreground hover:text-foreground md:px-2 md:text-sm"
                  >
                    {item.label}
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-36">
                  {item.items.map((mediaItem) => (
                    <DropdownMenuItem key={mediaItem.to} asChild>
                      <Link to={mediaItem.to} className="cursor-pointer">
                        {mediaItem.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="font-display whitespace-nowrap text-xs font-medium transition-colors md:text-sm"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <Button variant="outline" size="icon"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-border text-foreground sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border bg-background sm:hidden">
          <nav className="mx-auto flex max-w-[1400px] max-h-[calc(100dvh-80px)] overflow-y-auto flex-col px-5 py-4">
            {NAV.map((item) =>
              "items" in item ? (
                <div key={item.label} className="border-b border-border">
                  <Button
                    variant="ghost"
                    type="button"
                    aria-expanded={mobileMediaOpen}
                    aria-controls="mobile-media-links"
                    onClick={() => setMobileMediaOpen((value) => !value)}
                    className="font-display h-auto w-full justify-between rounded-none px-0 py-4 text-2xl font-semibold"
                  >
                    {item.label}
                    <ChevronDown className={`size-5 transition-transform ${mobileMediaOpen ? "rotate-180" : ""}`} />
                  </Button>
                  {mobileMediaOpen && (
                    <div id="mobile-media-links" className="flex flex-col pb-3 pl-4">
                      {item.items.map((mediaItem) => (
                        <Link
                          key={mediaItem.to}
                          to={mediaItem.to}
                          onClick={() => {
                            setOpen(false);
                            setMobileMediaOpen(false);
                          }}
                          className="font-display py-3 text-lg font-medium text-muted-foreground hover:text-foreground"
                        >
                          {mediaItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              ),
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
