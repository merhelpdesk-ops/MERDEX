import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { cjsInterop } from "vite-plugin-cjs-interop";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  base: process.env.PUBLIC_PATH || "/",
  plugins: [
    react(),
    cjsInterop({ dependencies: ["bs58", "@coral-xyz/anchor", "lodash"] }),
    nodePolyfills({ include: ["buffer", "crypto", "stream"] }),
  ],
  server: { host: true },
  build: { outDir: "dist" },
});
