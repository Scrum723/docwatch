import * as esbuild from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const dist = join(root, "dist-lambda");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, "src/lambda.ts")],
  bundle: true,
  platform: "node",
  target: "node22",
  outfile: join(dist, "index.js"),
  format: "cjs",
  packages: "bundle",
  external: [],
});

cpSync(join(root, "web"), join(dist, "web"), { recursive: true });
if (existsSync(join(root, "data"))) {
  cpSync(join(root, "data"), join(dist, "data"), { recursive: true });
}
if (existsSync(join(root, "src/prompts"))) {
  mkdirSync(join(dist, "src"), { recursive: true });
  cpSync(join(root, "src/prompts"), join(dist, "src/prompts"), { recursive: true });
}

writeFileSync(join(dist, "package.json"), JSON.stringify({ main: "index.js" }, null, 2));

const zipPath = join(root, "dist-lambda.zip");
rmSync(zipPath, { force: true });
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${dist}\\*' -DestinationPath '${zipPath}' -Force"`,
  { stdio: "inherit" }
);
console.log("Built", zipPath, "bytes", readFileSync(zipPath).length);
