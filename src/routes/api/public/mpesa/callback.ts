import { createFileRoute } from "@tanstack/react-router";

/**
 * Safaricom Daraja STK Push result callback. Safaricom does not sign the payload,
 * so the handler trusts nothing in it beyond the CheckoutRequestID, which is matched
 * against a ticket we created ourselves.
 */
export const Route = createFileRoute("/api/public/mpesa/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return Response.json({ ResultCode: 0, ResultDesc: "Ignored" });
        }
        try {
          const { applyMpesaCallback } = await import("@/lib/tickets.server");
          await applyMpesaCallback(payload);
        } catch (error) {
          console.error("mpesa callback failed", error);
        }
        // Daraja expects a 200 acknowledgement regardless of our own outcome.
        return Response.json({ ResultCode: 0, ResultDesc: "Accepted" });
      },
    },
  },
});
