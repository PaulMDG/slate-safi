# Slate Safi Showcase

Build a website for Slate Safi, a Kenyan film production company, using

React and Supabase. Their films include Boda Love (released) and Kibera

Hustle (upcoming).

GOAL: The site must read as globally credible to an international film

audience — fans, distributors, sponsors, festival programmers, and press

in Kenya, wider Africa, the UK, Canada, and the US — not as a local or

template-driven site. Every design decision should ask "would this feel

at home on a well-funded international studio or festival site?"

DESIGN DIRECTION:

- Clean, modern, cinematic. Dark, high-contrast base with a single warm

  accent colour. Bold, confident typography. Generous negative space —

  avoid clutter and avoid stock "startup SaaS" styling.

- Full-bleed imagery and video-forward hero sections — this is a film

  company, the visuals should lead.

- Consistent design system across every page: same header/nav, footer,

  spacing scale, and colour usage throughout.

NAVIGATION & UX (this matters as much as visuals):

- Persistent, simple top nav: Home, Films, About/Cast & Crew, Blog/News,

  Sponsor & Contact. No more than 5-6 top-level items.

- Mobile-first: nav collapses to a clean hamburger menu, all CTAs remain

  thumb-reachable, no horizontal scrolling anywhere.

- Every page reachable in 2 clicks or fewer from the homepage.

- Fast page loads — optimise images, lazy-load below-the-fold content.

- Clear visual hierarchy on every page: one obvious primary action per

  screen (Watch Trailer, Subscribe, Partner With Us, etc.), not competing

  CTAs.

PAGES TO BUILD:

1. Homepage — hero (latest film), featured films row, press/laurel strip,

   newsletter signup, sponsor teaser, footer.

2. Film detail page (template, reusable per film) — trailer embed,

   synopsis, cast & crew grid, image gallery, support/donate CTA.

3. Blog/News — listing page + individual article template.

4. Sponsor & Contact — partnership pitch, contact form, direct contact

   details.

5. About — company story, mission, credibility markers (awards, press,

   reach across the 5 markets).

FUNCTIONALITY:

- Supabase for film/blog content storage (so the team can add new films

  and posts without code changes).

- Working contact/sponsor form that stores submissions in Supabase.

- Newsletter signup field (store email in Supabase; I will connect an

  email tool separately).

- Responsive video embeds for trailers.

Do not build payments or social auto-posting yet — I'll prompt for those

separately once the core site is solid.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://slate-safi.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bec2303c-9a08-4f73-8c2c-4f3c2f5d9608).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
