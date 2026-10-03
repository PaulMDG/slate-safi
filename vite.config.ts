import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Server routes read non-VITE_ secrets from process.env.
const serverEnv = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  ""
);

Object.assign(process.env, serverEnv);

export default defineConfig({
  // Build a normal Node.js HTTP server instead of a Cloudflare Worker.
  nitro: {
    preset: "node-server",
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  vite: {
    plugins: [mcpPlugin()],

    resolve: {
      alias: {
        // Force the hoisted entities copy for SSR compatibility.
        "entities/lib/decode.js": path.resolve(
          import.meta.dirname,
          "node_modules/entities/lib/decode.js"
        ),
        "entities/lib/encode.js": path.resolve(
          import.meta.dirname,
          "node_modules/entities/lib/encode.js"
        ),
        entities: path.resolve(
          import.meta.dirname,
          "node_modules/entities"
        ),
      },
    },
  },
});
