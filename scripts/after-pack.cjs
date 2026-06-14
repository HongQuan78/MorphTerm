const path = require("node:path");
const fs = require("node:fs/promises");
const { flipFuses, FuseVersion, FuseV1Options } = require("@electron/fuses");
const { editWindowsResources } = require("app-builder-lib/out/util/resEdit");

const WINDOWS_FILE_DESCRIPTION = "customizable desktop terminal";
const CHROMIUM_LOCALES_TO_KEEP = new Set(["en-US", "vi"]);

exports.default = async function afterPack(context) {
  const electronBinaryPath = getElectronBinaryPath(context);

  if (context.electronPlatformName === "win32") {
    overrideWindowsFileDescription(context);
    await pruneChromiumLocales(context.appOutDir);
  }

  await flipFuses(electronBinaryPath, {
    version: FuseVersion.V1,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false
  });

  if (
    context.electronPlatformName === "win32" &&
    context.packager.platformSpecificBuildOptions.signAndEditExecutable === false
  ) {
    await editWindowsExecutableResources(
      context.packager,
      electronBinaryPath,
      context.arch,
      path.basename(electronBinaryPath, ".exe")
    );
  }
};

async function pruneChromiumLocales(appOutDir) {
  const localesDir = path.join(appOutDir, "locales");
  let entries;

  try {
    entries = await fs.readdir(localesDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".pak"))
      .filter(
        (entry) =>
          !CHROMIUM_LOCALES_TO_KEEP.has(path.basename(entry.name, ".pak"))
      )
      .map((entry) => fs.rm(path.join(localesDir, entry.name), { force: true }))
  );
}

function overrideWindowsFileDescription(context) {
  const packager = context.packager;

  packager.signAndEditResources = async function signAndEditResources(
    file,
    arch,
    _outDir,
    internalName,
    requestedExecutionLevel
  ) {
    await editWindowsExecutableResources(
      this,
      file,
      arch,
      internalName,
      requestedExecutionLevel
    );
    await this.signIf(file);
  };
}

async function editWindowsExecutableResources(
  packager,
  file,
  _arch,
  internalName,
  requestedExecutionLevel
) {
  const appInfo = packager.appInfo;
  const versionStrings = {
    FileDescription: WINDOWS_FILE_DESCRIPTION,
    ProductName: appInfo.productName,
    LegalCopyright: appInfo.copyright
  };

  if (internalName != null) {
    versionStrings.InternalName = internalName;
    versionStrings.OriginalFilename = "";
  }

  if (appInfo.companyName != null) {
    versionStrings.CompanyName = appInfo.companyName;
  }

  if (packager.platformSpecificBuildOptions.legalTrademarks != null) {
    versionStrings.LegalTrademarks =
      packager.platformSpecificBuildOptions.legalTrademarks;
  }

  await editWindowsResources({
    file,
    versionStrings,
    fileVersion: appInfo.shortVersion || appInfo.buildVersion,
    productVersion:
      appInfo.shortVersionWindows || appInfo.getVersionInWeirdWindowsForm(),
    requestedExecutionLevel,
    iconPath: await packager.getIconPath()
  });
}

function getElectronBinaryPath(context) {
  const productFilename = context.packager.appInfo.productFilename;

  if (context.electronPlatformName === "win32") {
    return path.join(context.appOutDir, `${productFilename}.exe`);
  }

  if (context.electronPlatformName === "darwin") {
    return path.join(
      context.appOutDir,
      `${productFilename}.app`,
      "Contents",
      "MacOS",
      productFilename
    );
  }

  return path.join(context.appOutDir, productFilename);
}
