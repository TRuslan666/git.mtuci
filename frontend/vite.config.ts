import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// В Docker фронт проксирует на сервис `api:8000`; локально — на localhost:8000.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    process.env.VITE_PROXY_API || env.VITE_PROXY_API || "http://localhost:8000";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: "0.0.0.0",
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
  };
});

