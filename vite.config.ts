import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 43123,
    strictPort: true,
    proxy: {
      "/ws": { target: "http://127.0.0.1:43124", ws: true },
      "/health": { target: "http://127.0.0.1:43124" },
    },
  },
  build: {
    outDir: "dist",
    target: "es2022",
    sourcemap: true,
  },
});
