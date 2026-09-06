import { resolve } from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  base: process.env.VITE_BASE || "/grid-risk-map/",
  publicDir: "public",
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    tailwindcss(),
    viteReact(),
  ],
  resolve: { tsconfigPaths: true },
  build: {
    outDir: resolve(".output/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve("spa-index.html"),
    },
  },
});
