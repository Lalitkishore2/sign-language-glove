import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    watch: {
      ignored: [
        "**/*.zip",
        "**/dist/**",
        "**/node_modules/**",
        "**/backend/**",
        "**/OpenHands-extracted/**",
        "**/stitch_kinex_ai_communication_platform/**",
      ],
    },
  },
});
