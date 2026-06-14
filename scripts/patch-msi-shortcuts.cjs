const fs = require("node:fs");

module.exports = async function patchMsiProject(projectFile) {
  const original = fs.readFileSync(projectFile, "utf8");
  const withInstallDirForPerUser = original.replace(
    '<Publish Dialog="InstallScopeDlg" Control="Next" Event="NewDialog" Value="VerifyReadyDlg" Order="6">WixAppFolder = "WixPerUserFolder"</Publish>',
    '<Publish Dialog="InstallScopeDlg" Control="Next" Event="NewDialog" Value="InstallDirDlg" Order="6">WixAppFolder = "WixPerUserFolder"</Publish>'
  );

  const patched = withInstallDirForPerUser.replace(
    /<Component>\s*(<File\b[^>]*\bId="mainExecutable"[^>]*)>\s*([\s\S]*?<Shortcut\b[\s\S]*?<\/Shortcut>\s*)<\/File>(<RemoveFolder\b[^>]*\/>)?\s*<\/Component>/,
    (_match, executableFile, shortcutBlock, removeFolder = "") => {
      const shortcuts = shortcutBlock.replace(
        /<Shortcut\b(?=[^>]*\bId="(?:desktopShortcut|startMenuShortcut)")(?=[^>]*\bAdvertise="yes")[^>]*>/g,
        (shortcut) =>
          shortcut.replace(
            /\sAdvertise="yes"/,
            ' Target="[APPLICATIONFOLDER]MorphTerm.exe"'
          )
      );

      return "      <Component>\n" +
        `        ${executableFile}/>\n` +
        "      </Component>\n" +
        '      <Component Id="ApplicationShortcuts" Directory="APPLICATIONFOLDER" Guid="*">\n' +
        '        <RegistryValue Root="HKCU" Key="Software\\MorphTerm" Name="ApplicationShortcuts" Type="integer" Value="1" KeyPath="yes"/>\n' +
        shortcuts +
        (removeFolder ? `${removeFolder}\n` : "") +
        "      </Component>";
    }
  );

  if (withInstallDirForPerUser === original) {
    throw new Error("Expected MSI install directory dialog wiring was not found.");
  }

  if (patched === withInstallDirForPerUser) {
    throw new Error("Expected MSI shortcut declarations were not found.");
  }

  fs.writeFileSync(projectFile, patched);
};
