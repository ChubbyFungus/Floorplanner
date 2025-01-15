import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
    port: 3000,
    host: true, // Listen on all local IPs
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000
    },
    cors: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  preview: {
    port: 5000
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
});
