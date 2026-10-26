import { readFileSync, writeFileSync } from "node:fs";

const targetVersion =
  process.env.npm_package_version ||
  JSON.parse(readFileSync("package.json", "utf8")).version;

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

const versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", `${JSON.stringify(versions, null, 2)}\n`);

console.log(`Bumped manifest.json and versions.json to ${targetVersion}`);
