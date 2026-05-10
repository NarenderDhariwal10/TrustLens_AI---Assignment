import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Dev proxy: must match server PORT (see server/.env). */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = "https://trustlens-ai-assignment.onrender.com";

  const apiProxy = {
    "/api": {
      target,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: apiProxy,
    },
    // Same as dev: `vite preview` does not inherit server.proxy unless configured here.
    preview: {
      port: 4173,
      proxy: apiProxy,
    },
  };
});
