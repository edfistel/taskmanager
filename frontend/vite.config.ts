import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { makeProxyConfig } from "./scripts/paths.mjs";
import { localRuntimePlugin } from "./scripts/local-runtime.mjs";

const apiTarget = "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react(), localRuntimePlugin()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: makeProxyConfig(apiTarget),
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: makeProxyConfig(apiTarget),
  },
});
