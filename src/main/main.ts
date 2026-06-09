import { app, BrowserWindow } from "electron";
import path from "node:path";
import { TerminalManager } from "./TerminalManager";
import { registerTerminalIpc } from "./registerTerminalIpc";
import { appInfo } from "../shared/appInfo";

const rendererDevUrl = "http://127.0.0.1:5173";
const terminalManager = new TerminalManager();

if (!app.isPackaged) {
  app.setPath("userData", path.join(process.cwd(), ".fluxterm-dev"));
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-gpu-compositing");
app.commandLine.appendSwitch("disable-software-rasterizer");

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 520,
    title: appInfo.name,
    backgroundColor: "#101214",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (app.isPackaged) {
    void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  } else {
    void mainWindow.loadURL(rendererDevUrl);
  }
}

app.on("ready", () => {
  registerTerminalIpc(terminalManager);
  createMainWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  terminalManager.disposeAll();

  if (process.platform !== "darwin") {
    app.quit();
  }
});
