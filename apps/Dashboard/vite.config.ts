import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    base: "/dashboard/",
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // The dashboard talks to the API on its own origin (`/api/...`), which is
      // what nginx does in production. There is no nginx in front of the dev
      // server, so the requests are proxied to the local API instead — set
      // API_URL in apps/Dashboard/.env when it runs on another host or port.
      proxy: {
        "/api": {
          target: env.API_URL || "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  }
})
