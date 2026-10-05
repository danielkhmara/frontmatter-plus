import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";

const testsDir = "tests";
const outDir = ".test-build";

const entryPoints = readdirSync(testsDir)
  .filter((name) => name.endsWith(".test.ts"))
  .sort()
  .map((name) => join(testsDir, name));

if (entryPoints.length === 0) {
  console.error("No test files found.");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });

await build({
  entryPoints,
  outdir: outDir,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  sourcemap: "inline",
  alias: { obsidian: "./tests/support/obsidian.ts" },
  logLevel: "warning",
});

const files = entryPoints.map((entry) => join(outDir, `${basename(entry, ".ts")}.js`));
const filter = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  ["--enable-source-maps", "--test", "--test-reporter=spec", ...filter.flatMap((name) => ["--test-name-pattern", name]), ...files],
  { stdio: "inherit" }
);

rmSync(outDir, { recursive: true, force: true });
process.exit(result.status ?? 1);
