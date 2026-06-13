const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const testsRoot = path.join(process.cwd(), "dist-test", "tests");
const testFiles = findTestFiles(testsRoot);

if (testFiles.length === 0) {
  console.error(`No compiled test files found in ${testsRoot}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...testFiles], {
  stdio: "inherit"
});

process.exit(result.status ?? 1);

function findTestFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return findTestFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(".test.js") ? [entryPath] : [];
    })
    .sort();
}
