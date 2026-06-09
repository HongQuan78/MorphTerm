import { BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { ConfigManager } from "./ConfigManager";
import { configChannels } from "../shared/config/config-ipc";
import type { MorphTermConfigUpdate } from "../shared/config/config-types";

export function registerConfigIpc(configManager: ConfigManager): void {
  ipcMain.handle(configChannels.get, () => {
    return configManager.get();
  });

  ipcMain.handle(configChannels.update, (_event, update: MorphTermConfigUpdate) => {
    return configManager.update(update);
  });

  ipcMain.handle(configChannels.openConfigFile, () => {
    return configManager.openConfigFile();
  });

  ipcMain.handle(configChannels.selectBackgroundImage, async (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.OpenDialogOptions = {
      properties: ["openFile"],
      filters: [
        {
          name: "Images",
          extensions: ["jpg", "jpeg", "png", "gif", "webp", "bmp"]
        },
        {
          name: "All files",
          extensions: ["*"]
        }
      ]
    };
    const result = parentWindow
      ? await dialog.showOpenDialog(parentWindow, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);

    if (result.canceled) {
      return null;
    }

    return result.filePaths[0] ?? null;
  });

  ipcMain.handle(configChannels.getBackgroundImageData, async (_event, imagePath: string) => {
    if (!imagePath) {
      return null;
    }

    const imageBuffer = await fs.readFile(imagePath);
    const mimeType = getImageMimeType(imagePath);

    return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
  });
}

function getImageMimeType(imagePath: string): string {
  const extension = path.extname(imagePath).toLowerCase();

  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".bmp":
      return "image/bmp";
    case ".png":
    default:
      return "image/png";
  }
}
