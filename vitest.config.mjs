import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url))),
    },
  },
  test: {
    environment: "node",
    include: ["tests/main/**/*.test.js"],
    exclude: ["tests/**/*.spec.js", "tests/**/*.spec.ts"],
  },
})
