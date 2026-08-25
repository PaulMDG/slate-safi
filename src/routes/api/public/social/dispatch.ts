import { createFileRoute } from "@tanstack/react-router";

/**
 * Scheduled publisher. Call with `Authorization: Bearer <SOCIAL_CRON_SECRET>`
 * from pg_cron or any external scheduler, e.g. every 5 minutes.
 */
export const Route = createFileRoute("/api/public/social/dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["SOCIAL_CRON_SECRET"];
        if (!secret) {
          return Response.json(
            { error: "Scheduler is not configured yet." },
            { status: 503 },
          );
        }

        const header = request.headers.get("authorization") ?? "";
        if (header !== `Bearer ${secret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { runAutomationTick } = await import("@/lib/social.server");
        try {
          const result = await runAutomationTick(20);
          return Response.json(result);
        } catch (error) {
          console.error("[social dispatch]", error);
          return Response.json({ error: "Dispatch failed." }, { status: 500 });
        }
      },
    },
  },
});
