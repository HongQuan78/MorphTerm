import { app, BrowserWindow, ipcMain, shell } from "electron";
import { appMenuChannels, isAppMenuAction } from "../shared/appMenuIpc";
import type { AppMenuAction } from "../shared/appMenuIpc";

export function registerAppMenuIpc(projectGitHubUrl: string): void {
  ipcMain.handle(appMenuChannels.performAction, async (_event, action) => {
    if (!isAppMenuAction(action)) {
      throw new Error("Invalid app menu action");
    }

    await performAppMenuAction(action, projectGitHubUrl);
  });
}

async function performAppMenuAction(
  action: AppMenuAction,
  projectGitHubUrl: string
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
    case "openGitHub":
      await shell.openExternal(projectGitHubUrl);
      return;
  }
}
