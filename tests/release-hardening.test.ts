import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
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
const msiBuilderConfig = fs.readFileSync("electron-builder.msi.cjs", "utf8");
const releaseBuilderConfig = fs.readFileSync("electron-builder.release.cjs", "utf8");
const storeBuilderConfig = fs.readFileSync("electron-builder.store.cjs", "utf8");
const afterPackScript = fs.readFileSync("scripts/after-pack.cjs", "utf8");
const msiShortcutPatchScript = fs.readFileSync(
  "scripts/patch-msi-shortcuts.cjs",
  "utf8"
);

describe("release hardening configuration", () => {
  it("packages with ASAR, node-pty native unpacking, signing, and fuse hardening", () => {
    assert.equal(packageJson.build?.asar, true);
    assert.match(packageJson.scripts?.build ?? "", /clean-build-output\.cjs/);
    assert.equal(packageJson.dependencies?.["node-pty"], "^1.1.0");
    assert.equal(packageJson.dependencies?.["@xterm/xterm"], undefined);
    assert.equal(packageJson.dependencies?.react, undefined);
    assert.equal(packageJson.devDependencies?.["@xterm/xterm"], "^6.0.0");
    assert.equal(packageJson.devDependencies?.react, "^18.3.1");
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
    assert.ok(packageJson.build?.files?.includes("!node_modules/node-pty/deps/**/*"));
    assert.ok(packageJson.build?.files?.includes("!node_modules/node-addon-api/**/*"));
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
    assert.match(
      afterPackScript,
      /LoadBrowserProcessSpecificV8Snapshot\]:\s*false/
    );
    assert.match(afterPackScript, /WINDOWS_FILE_DESCRIPTION = "customizable desktop terminal"/);
    assert.match(afterPackScript, /editWindowsResources/);
    assert.match(afterPackScript, /FileDescription:\s*WINDOWS_FILE_DESCRIPTION/);
    assert.match(afterPackScript, /CHROMIUM_LOCALES_TO_KEEP/);
    assert.match(afterPackScript, /pruneChromiumLocales/);
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

  it("defines a Microsoft Store MSI installer build path", () => {
    assert.equal(
      packageJson.scripts?.["dist:win:msi"],
      "npm run build && electron-builder --win msi --config electron-builder.msi.cjs"
    );
    assert.match(msiBuilderConfig, /target:\s*\["msi"\]/);
    assert.match(msiBuilderConfig, /name:\s*"hqdev"/);
    assert.match(msiBuilderConfig, /msiProjectCreated:\s*"scripts\/patch-msi-shortcuts\.cjs"/);
    assert.match(msiBuilderConfig, /perMachine:\s*false/);
    assert.match(msiBuilderConfig, /shortcutName:\s*"Morph Term"/);
    assert.match(msiBuilderConfig, /artifactName:\s*"\$\{productName\}-\$\{version\}-\$\{arch\}\.\$\{ext\}"/);
    assert.match(msiShortcutPatchScript, /Target="\[APPLICATIONFOLDER\]MorphTerm\.exe"/);
    assert.match(msiShortcutPatchScript, /RegistryValue Root="HKCU"/);
    assert.match(msiShortcutPatchScript, /Value="InstallDirDlg" Order="6"/);
  });

  it("defines a Microsoft Store package build path", () => {
    assert.equal(
      packageJson.scripts?.["dist:win:store"],
      "npm run build && electron-builder --win appx --config electron-builder.store.cjs"
    );
    assert.match(storeBuilderConfig, /target:\s*\["appx"\]/);
    assert.match(
      storeBuilderConfig,
      /CN=3d21611c-4ee6-471d-b8dc-7eae5a934a28/
    );
    assert.match(storeBuilderConfig, /MORPHTERM_STORE_IDENTITY_NAME/);
    assert.match(storeBuilderConfig, /MORPHTERM_STORE_PUBLISHER/);
    assert.match(storeBuilderConfig, /MORPHTERM_STORE_PUBLISHER_DISPLAY_NAME/);
    assert.match(storeBuilderConfig, /hqdev/);
    assert.match(storeBuilderConfig, /displayName:\s*"Morph Term"/);
  });

  it("publishes Windows artifact provenance from CI and release workflows", () => {
    assert.match(ciWorkflow, /actions\/upload-artifact@v4/);
    assert.match(ciWorkflow, /actions\/attest-build-provenance@v2/);
    assert.match(ciWorkflow, /attestations: write/);
    assert.match(ciWorkflow, /id-token: write/);
    assert.match(ciWorkflow, /subject-path: release\/MorphTerm-\*\.exe/);
    assert.match(releaseWorkflow, /actions\/upload-artifact@v4/);
    assert.match(releaseWorkflow, /actions\/attest-build-provenance@v2/);
    assert.match(releaseWorkflow, /contents: write/);
    assert.match(releaseWorkflow, /attestations: write/);
    assert.match(releaseWorkflow, /id-token: write/);
    assert.match(releaseWorkflow, /subject-path: release\/MorphTerm-\*\.exe/);
    assert.match(releaseWorkflow, /Get-FileHash -Algorithm SHA256/);
    assert.match(releaseWorkflow, /Get-ChildItem -Path release -Filter "MorphTerm-\*\.exe"/);
    assert.match(releaseWorkflow, /release\/MorphTerm-windows-portable\.sha256/);
    assert.match(releaseWorkflow, /gh release create "\$\{\{ github\.ref_name \}\}"/);
    assert.match(releaseWorkflow, /--generate-notes/);
    assert.match(releaseWorkflow, /--verify-tag/);
  });
});
