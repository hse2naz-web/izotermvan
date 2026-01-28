// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",

  vite: {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },

  adapter: vercel(),
});