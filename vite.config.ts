import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Replit plugins only when running on Replit (enables Netlify/static builds)
async function getReplitPlugins() {
  if (process.env.REPL_ID === undefined) return [];
  const runtimeErrorOverlay = (
    await import("@replit/vite-plugin-runtime-error-modal")
  ).default;
  const plugins = [runtimeErrorOverlay()];
  if (process.env.NODE_ENV !== "production") {
    const { cartographer } = await import("@replit/vite-plugin-cartographer");
    const { devBanner } = await import("@replit/vite-plugin-dev-banner");
    plugins.push(cartographer(), devBanner());
  }
  return plugins;
}

const replitPlugins = await getReplitPlugins();

export default defineConfig({
  plugins: [react(), ...replitPlugins],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
