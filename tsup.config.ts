import { defineConfig } from "tsup";
import { cpSync, existsSync, rmSync } from "node:fs";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  splitting: false,
  sourcemap: false,
  minify: false,
  banner: { js: "#!/usr/bin/env node" },
  outDir: "dist",
  async onSuccess() {
    const out = "dist/templates";
    if (existsSync(out)) rmSync(out, { recursive: true, force: true });
    cpSync("src/templates", out, { recursive: true });
  },
});
