import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const target = env.DEV_API_PROXY_TARGET?.trim();
  const prefix = env.DEV_API_PROXY_PREFIX?.trim() || "/identity";
  if (target) {
    const url = new URL(target);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/[a-zA-Z0-9/_-]+$/.test(prefix) ||
      prefix.endsWith("/")
    ) {
      throw new Error(
        "Configure a credential-free HTTP(S) dev proxy target and a path prefix without a trailing slash.",
      );
    }
  }
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      proxy: target
        ? {
            [prefix]: {
              target,
              changeOrigin: true,
              // YARP retains /identity; direct Identity access removes it only when requested.
              rewrite:
                env.DEV_API_PROXY_STRIP_PREFIX === "true"
                  ? (path) => path.slice(prefix.length) || "/"
                  : undefined,
            },
          }
        : undefined,
    },
    test: {
      environment: "jsdom",
      env: { VITE_API_BASE_URL: "/identity/" },
      setupFiles: ["./src/test/setup.ts"],
      restoreMocks: true,
      clearMocks: true,
    },
  };
});
