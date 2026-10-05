import { readFileSync, writeFileSync } from "node:fs";

const version = process.env.npm_package_version;
if (!version) {
  console.error("Run this script through `npm version`.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
manifest.version = version;
writeFileSync("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[version] = manifest.minAppVersion;
writeFileSync("versions.json", `${JSON.stringify(versions, null, 2)}\n`);
