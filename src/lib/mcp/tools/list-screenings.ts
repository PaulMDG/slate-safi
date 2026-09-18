import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_screenings",
  title: "List screenings",
  description:
    "List published screenings and premieres with their film, cinema, date/time and ticket link.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("screenings")
      .select(
        "id, starts_at, label, note, ticket_url, film:films(slug, title), cinema:cinemas(name, chain, city, ticketing_url)",
      )
      .eq("published", true)
      .order("starts_at", { ascending: true });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { screenings: data ?? [] },
    };
  },
});
