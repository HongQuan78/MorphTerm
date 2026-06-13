import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist/renderer",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@xterm")) {
            return "xterm";
          }

          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "react";
          }

          return undefined;
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  }
});
