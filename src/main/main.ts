import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { ConfigManager } from "./ConfigManager";
import { TerminalManager } from "./TerminalManager";
import { registerConfigIpc } from "./registerConfigIpc";
import { registerTerminalIpc } from "./registerTerminalIpc";
import { appInfo } from "../shared/appInfo";

const rendererDevUrl = "http://127.0.0.1:5173";
let configManager: ConfigManager;
let terminalManager: TerminalManager;
let configPath: string | undefined;

if (!app.isPackaged) {
  const devDataPath = path.join(process.cwd(), ".morphterm-dev");
  const devUserDataPath = path.join(devDataPath, "user-data");

  configPath = path.join(devDataPath, "config", "config.json");
  migrateDevConfig(path.join(devDataPath, "config.json"), configPath);
  app.setPath("userData", devUserDataPath);
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
    icon: getAppIconPath(),
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

function getAppIconPath(): string {
  if (app.isPackaged) {
    return path.join(__dirname, "../renderer/app-icon.png");
  }

  return path.join(process.cwd(), "public", "app-icon.png");
}

app.on("ready", () => {
  configManager = new ConfigManager(
    configPath ?? path.join(app.getPath("userData"), "config", "config.json")
  );
  configManager.load();
  terminalManager = new TerminalManager(() => configManager.get());
  registerConfigIpc(configManager);
  registerTerminalIpc(terminalManager);
  createMainWindow();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  terminalManager?.disposeAll();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

function migrateDevConfig(legacyConfigPath: string, nextConfigPath: string): void {
  if (fs.existsSync(nextConfigPath) || !fs.existsSync(legacyConfigPath)) {
    return;
  }

  fs.mkdirSync(path.dirname(nextConfigPath), { recursive: true });
  fs.copyFileSync(legacyConfigPath, nextConfigPath);
}
