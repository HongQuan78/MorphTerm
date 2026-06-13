import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

interface PackageJson {
  scripts?: Record<string, string>;
  build?: {
    files?: string[];
    asar?: boolean;
    asarUnpack?: string[];
    afterPack?: string;
    npmRebuild?: boolean;
    win?: {
      signAndEditExecutable?: boolean;
    };
  };
  devDependencies?: Record<string, string>;
}

const packageJson = JSON.parse(
  fs.readFileSync("package.json", "utf8")
) as PackageJson;
const ciWorkflow = fs.readFileSync(".github/workflows/ci.yml", "utf8");
const releaseWorkflow = fs.readFileSync(".github/workflows/release.yml", "utf8");
const releaseBuilderConfig = fs.readFileSync("electron-builder.release.cjs", "utf8");
const afterPackScript = fs.readFileSync("scripts/after-pack.cjs", "utf8");

describe("release hardening configuration", () => {
  it("packages with ASAR, node-pty native unpacking, signing, and fuse hardening", () => {
    assert.equal(packageJson.build?.asar, true);
    assert.ok(
      packageJson.build?.files?.includes(
        "!node_modules/node-pty/prebuilds/darwin-*/**/*"
      )
    );
    assert.ok(
      packageJson.build?.files?.includes(
        "!node_modules/node-pty/prebuilds/win32-arm64/**/*"
      )
    );
    assert.ok(
      packageJson.build?.files?.includes("!node_modules/node-pty/prebuilds/**/*.pdb")
    );
    assert.deepEqual(packageJson.build?.asarUnpack, [
      "node_modules/node-pty/prebuilds/win32-x64/**/*",
      "node_modules/node-pty/build/Release/**/*"
    ]);
    assert.equal(packageJson.build?.afterPack, "scripts/after-pack.cjs");
    assert.equal(packageJson.build?.npmRebuild, false);
    assert.equal(packageJson.build?.win?.signAndEditExecutable, true);
    assert.ok(packageJson.devDependencies?.["@electron/fuses"]);
    assert.equal(fs.existsSync("scripts/after-pack.cjs"), true);
    assert.match(afterPackScript, /EnableEmbeddedAsarIntegrityValidation/);
    assert.match(afterPackScript, /OnlyLoadAppFromAsar/);
    assert.match(afterPackScript, /EnableNodeOptionsEnvironmentVariable/);
    assert.match(afterPackScript, /EnableNodeCliInspectArguments/);
  });

  it("defines a signed production release path", () => {
    assert.equal(
      packageJson.scripts?.["dist:win:release"],
      "npm run build && electron-builder --win portable --config electron-builder.release.cjs"
    );
    assert.match(releaseBuilderConfig, /forceCodeSigning:\s*true/);
    assert.match(releaseBuilderConfig, /signAndEditExecutable:\s*true/);
    assert.match(releaseWorkflow, /npm run dist:win:release/);
    assert.match(releaseWorkflow, /CSC_LINK: \$\{\{ secrets\.WINDOWS_CSC_LINK \}\}/);
    assert.match(
      releaseWorkflow,
      /CSC_KEY_PASSWORD: \$\{\{ secrets\.WINDOWS_CSC_KEY_PASSWORD \}\}/
    );
  });

  it("publishes Windows artifact provenance from CI and release workflows", () => {
    assert.match(ciWorkflow, /actions\/upload-artifact@v4/);
    assert.match(ciWorkflow, /actions\/attest-build-provenance@v2/);
    assert.match(ciWorkflow, /attestations: write/);
    assert.match(ciWorkflow, /id-token: write/);
    assert.match(ciWorkflow, /subject-path: release\/MorphTerm-\*\.exe/);
    assert.match(releaseWorkflow, /actions\/upload-artifact@v4/);
    assert.match(releaseWorkflow, /actions\/attest-build-provenance@v2/);
    assert.match(releaseWorkflow, /attestations: write/);
    assert.match(releaseWorkflow, /id-token: write/);
    assert.match(releaseWorkflow, /subject-path: release\/MorphTerm-\*\.exe/);
  });
});
