// @lovable.dev/vite-tanstack-config provides the React,
// TanStack Start, Tailwind, aliases, and development tooling.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Build a normal Node.js HTTP server instead of a Cloudflare Worker.
  nitro: {
    preset: "node-server",
  },

  tanstackStart: {
    // Custom SSR error wrapper.
    server: {
      entry: "server",
    },
  },
});
