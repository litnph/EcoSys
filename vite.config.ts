import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = id.replaceAll("\\\\", "/");
          if (!moduleId.includes("/node_modules/")) return undefined;

          if (moduleId.includes("/tesseract.js/") || moduleId.includes("/tesseract.js-core/")) {
            return "ocr-vendor";
          }
          if (moduleId.includes("/recharts/") || moduleId.includes("/d3-")) {
            return "charts-vendor";
          }
          if (moduleId.includes("/@tanstack/")) return "query-vendor";
          if (
            moduleId.includes("/framer-motion/") ||
            moduleId.includes("/motion-dom/") ||
            moduleId.includes("/motion-utils/")
          ) {
            return "motion-vendor";
          }
          if (moduleId.includes("/@radix-ui/")) return "radix-vendor";
          if (moduleId.includes("/i18next/") || moduleId.includes("/react-i18next/")) {
            return "i18n-vendor";
          }
          if (
            moduleId.includes("/react/") ||
            moduleId.includes("/react-dom/") ||
            moduleId.includes("/react-router/") ||
            moduleId.includes("/react-router-dom/") ||
            moduleId.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
});
