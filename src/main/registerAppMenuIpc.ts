import { app, BrowserWindow, ipcMain, shell } from "electron";
import { assertTrustedIpcSender } from "./ipcValidation";
import { appMenuChannels, isAppMenuAction } from "../shared/appMenuIpc";
import type { AppMenuAction } from "../shared/appMenuIpc";

export function registerAppMenuIpc(feedbackFormUrl: string): void {
  ipcMain.handle(appMenuChannels.performAction, async (event, action) => {
    assertTrustedIpcSender(event);

    if (!isAppMenuAction(action)) {
      throw new Error("Invalid app menu action");
    }

    if (app.isPackaged && action === "toggleDevTools") {
      return;
    }

    await performAppMenuAction(action, feedbackFormUrl);
  });
}

async function performAppMenuAction(
  action: AppMenuAction,
  feedbackFormUrl: string
): Promise<void> {
  const window = BrowserWindow.getFocusedWindow();
  const webContents = window?.webContents;

  switch (action) {
    case "quit":
      app.quit();
      return;
    case "undo":
      webContents?.undo();
      return;
    case "redo":
      webContents?.redo();
      return;
    case "cut":
      webContents?.cut();
      return;
    case "copy":
      webContents?.copy();
      return;
    case "paste":
      webContents?.paste();
      return;
    case "selectAll":
      webContents?.selectAll();
      return;
    case "reload":
      webContents?.reload();
      return;
    case "forceReload":
      webContents?.reloadIgnoringCache();
      return;
    case "toggleDevTools":
      webContents?.toggleDevTools();
      return;
    case "resetZoom":
      webContents?.setZoomLevel(0);
      return;
    case "zoomIn":
      webContents?.setZoomLevel((webContents.getZoomLevel() ?? 0) + 1);
      return;
    case "zoomOut":
      webContents?.setZoomLevel((webContents.getZoomLevel() ?? 0) - 1);
      return;
    case "toggleFullscreen":
      window?.setFullScreen(!window.isFullScreen());
      return;
    case "minimize":
      window?.minimize();
      return;
    case "close":
      window?.close();
      return;
    case "openFeedback":
      await openExternalHttpUrl(feedbackFormUrl);
      return;
  }
}

async function openExternalHttpUrl(url: string): Promise<void> {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("External URL must use http or https");
  }

  await shell.openExternal(parsedUrl.toString());
}
