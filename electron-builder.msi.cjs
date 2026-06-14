const packageJson = require("./package.json");

const hasSigningCertificate = Boolean(
  process.env.CSC_LINK ||
    process.env.WIN_CSC_LINK ||
    process.env.CSC_NAME ||
    process.env.WIN_CSC_NAME
);

module.exports = {
  ...packageJson.build,
  extraMetadata: {
    author: {
      name: "hqdev"
    }
  },
  win: {
    ...packageJson.build.win,
    target: ["msi"],
    signAndEditExecutable: true,
    signExecutable: hasSigningCertificate
  },
  msiProjectCreated: "scripts/patch-msi-shortcuts.cjs",
  msi: {
    oneClick: false,
    perMachine: false,
    runAfterFinish: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: "Morph Term",
    menuCategory: "Morph Term",
    artifactName: "${productName}-${version}-${arch}.${ext}"
  }
};
