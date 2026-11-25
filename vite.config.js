import { defineConfig } from "vite";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Uncomment this line to allow app to work by opening via file:// protocol (without a server)
  // base: "./",
  root: "src",
  plugins: [tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    copyPublicDir: true,
  },
  publicDir: "../public",
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
});
