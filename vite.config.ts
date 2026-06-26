import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: true,
    port: 5173,
    // Dev proxy so the browser never calls Kling directly (avoids CORS /
    // "Failed to fetch"). Requests to /api/kling are forwarded server-side
    // to the real Kling API. In production, point VITE_KLING_ENDPOINT at an
    // equivalent backend proxy instead.
    proxy: {
      "/api/kling": {
        target: "https://api.klingai.com",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api\/kling/, ""),
      },
    },
  },
});
