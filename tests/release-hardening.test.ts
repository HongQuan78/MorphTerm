import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

interface PackageJson {
  build?: {
    asar?: boolean;
    asarUnpack?: string[];
    afterPack?: string;
  };
  devDependencies?: Record<string, string>;
}

const packageJson = JSON.parse(
  fs.readFileSync("package.json", "utf8")
) as PackageJson;

describe("release hardening configuration", () => {
  it("packages with ASAR, node-pty native unpacking, and fuse hardening", () => {
    assert.equal(packageJson.build?.asar, true);
    assert.deepEqual(packageJson.build?.asarUnpack, [
      "node_modules/node-pty/build/Release/*.node"
    ]);
    assert.equal(packageJson.build?.afterPack, "scripts/after-pack.cjs");
    assert.ok(packageJson.devDependencies?.["@electron/fuses"]);
    assert.equal(fs.existsSync("scripts/after-pack.cjs"), true);
  });
});
