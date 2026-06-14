const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  await fs.rm(path.resolve("dist"), { recursive: true, force: true });
  await fs.rm(path.resolve("tsconfig.electron.tsbuildinfo"), { force: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
