import { readFileSync } from "node:fs";

const tag = process.argv[2];
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const manifest = readJson("manifest.json");
const packageJson = readJson("package.json");
const versions = readJson("versions.json");

const problems = [];
if (!tag) problems.push("No tag was given.");
if (manifest.version !== tag) problems.push(`manifest.json has version ${manifest.version}, the tag is ${tag}.`);
if (packageJson.version !== tag) problems.push(`package.json has version ${packageJson.version}, the tag is ${tag}.`);
if (versions[tag] !== manifest.minAppVersion) {
  problems.push(`versions.json must map ${tag} to ${manifest.minAppVersion}.`);
}

if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

console.log(`Version ${tag} is consistent.`);
