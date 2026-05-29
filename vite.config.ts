import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    base: "/",
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      proxy: {
        "/uploads": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
        "/bhashini-translation": {
          target: "https://tts.bhashini.ai",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bhashini-translation/, ""),
        },
      },
    },
    build: {
      outDir: "dist",
      chunkSizeWarningLimit: 3000,
    },
  };
});
