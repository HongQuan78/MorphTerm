import { BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { ConfigManager } from "./ConfigManager";
import { configChannels } from "../shared/config/config-ipc";
import type { MorphTermConfigUpdate } from "../shared/config/config-types";
import {
  asConfigUpdate,
  asImagePath,
  assertTrustedIpcSender
} from "./ipcValidation";

const maxBackgroundImageBytes = 25 * 1024 * 1024;

export function registerConfigIpc(configManager: ConfigManager): void {
  ipcMain.handle(configChannels.get, (event) => {
    assertTrustedIpcSender(event);

    return configManager.get();
  });

  ipcMain.handle(configChannels.update, (event, update: MorphTermConfigUpdate) => {
    assertTrustedIpcSender(event);

    return configManager.update(asConfigUpdate(update));
  });

  ipcMain.handle(configChannels.openConfigFile, (event) => {
    assertTrustedIpcSender(event);

    return configManager.openConfigFile();
  });

  ipcMain.handle(configChannels.selectBackgroundImage, async (event) => {
    assertTrustedIpcSender(event);
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

  ipcMain.handle(configChannels.getBackgroundImageData, async (event, imagePath: string) => {
    assertTrustedIpcSender(event);
    const safeImagePath = asImagePath(imagePath);

    if (!safeImagePath) {
      return null;
    }

    const imageStats = await fs.stat(safeImagePath);

    if (!imageStats.isFile() || imageStats.size > maxBackgroundImageBytes) {
      return null;
    }

    const imageBuffer = await fs.readFile(safeImagePath);
    const mimeType = getImageMimeType(safeImagePath);

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
