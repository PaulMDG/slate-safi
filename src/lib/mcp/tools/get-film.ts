import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_film",
  title: "Get film details",
  description:
    "Get one published film by slug, including full details plus its cast and crew credits.",
  inputSchema: { slug: z.string().trim().min(1).describe("Film slug, e.g. boda-love.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: film, error } = await supabase
      .from("films")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!film) return { content: [{ type: "text", text: `No published film with slug "${slug}"` }], isError: true };

    const { data: credits } = await supabase
      .from("film_credits")
      .select("name, role, credit_type, character_name")
      .eq("film_id", film.id)
      .order("sort_order", { ascending: true });

    const payload = { film, credits: credits ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
