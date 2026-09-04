import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // `obsidian` is a types-only package; see tests/stubs/obsidian.ts.
      obsidian: new URL("./tests/stubs/obsidian.ts", import.meta.url).pathname,
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
