import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listFilmsTool from "./tools/list-films";
import getFilmTool from "./tools/get-film";
import listNewsTool from "./tools/list-news";
import getNewsPostTool from "./tools/get-news-post";
import listScreeningsTool from "./tools/list-screenings";
import listAwardsTool from "./tools/list-awards";
import listVideosTool from "./tools/list-videos";

// The OAuth issuer must be the direct auth host; the project ref is the only
// value that survives publish unchanged and Vite inlines it at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "slate-safi-showcase",
  title: "Slate Safi Showcase",
  version: "0.1.0",
  instructions:
    "Tools for the Slate Safi film studio site. Use `list_films` and `get_film` for films, cast and crew; `list_news` and `get_news_post` for news and blog posts; `list_screenings` for premiere and cinema dates with ticket links; `list_awards` for awards and press; `list_videos` for trailers and videos.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listFilmsTool,
    getFilmTool,
    listNewsTool,
    getNewsPostTool,
    listScreeningsTool,
    listAwardsTool,
    listVideosTool,
  ],
});
