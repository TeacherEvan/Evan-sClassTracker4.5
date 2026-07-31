import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Vite 8.2 transforms JSX via oxc; its jsx mode is read from the resolved
  // tsconfig (root sets "preserve" for Next's SWC build, which oxc/rolldown
  // cannot parse). Override jsx to the automatic runtime for Vitest's
  // transform/coverage path only — the root tsconfig and the Next build are
  // untouched.
  oxc: {
    jsx: {
      runtime: "automatic",
      importSource: "react",
    },
  },
  test: {
    environment: "jsdom",
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "tests/e2e/**",
    ],
    globals: true,
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
