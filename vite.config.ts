import {defineConfig} from "vite";
import {execFileSync} from "node:child_process";

export default defineConfig({
  base: "./",
  define: {__APP_REVISION__: JSON.stringify(execFileSync("git",["rev-parse","--short","HEAD"]).toString().trim())},
  root: "src",
  build: {outDir: "../dist", emptyOutDir: true},
  test: {include: ["../tests/unit/**/*.test.ts"]},
});
