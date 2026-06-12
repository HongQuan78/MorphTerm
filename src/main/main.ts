import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigManager } from "./ConfigManager";
import { TerminalManager } from "./TerminalManager";
import { registerAppMenuIpc } from "./registerAppMenuIpc";
import { registerConfigIpc } from "./registerConfigIpc";
import { registerTerminalIpc } from "./registerTerminalIpc";
import { appInfo } from "../shared/appInfo";

const rendererDevUrl = "http://127.0.0.1:5173";
const projectGitHubUrl = "https://github.com/HongQuan78/MorphTerm";
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
app.on("certificate-error", (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault();
  callback(false);
});
app.on("web-contents-created", (_event, webContents) => {
  webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  webContents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
});

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 520,
    title: appInfo.name,
    icon: getAppIconPath(),
    autoHideMenuBar: true,
    backgroundColor: "#101214",
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedRendererUrl(url)) {
      event.preventDefault();
    }
  });
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    }
  );
  applyContentSecurityPolicy(mainWindow);

  if (app.isPackaged) {
    void mainWindow.loadFile(path.join(getPackagedRendererDirectory(), "index.html"));
  } else {
    void mainWindow.loadURL(rendererDevUrl);
  }
}

function applyContentSecurityPolicy(window: BrowserWindow): void {
  if (!app.isPackaged) {
    return;
  }

  const contentSecurityPolicy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: file:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-src 'none'"
  ].join("; ");

  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [contentSecurityPolicy]
      }
    });
  });
}

function getAppIconPath(): string {
  if (app.isPackaged) {
    return path.join(__dirname, "../renderer/app-icon.png");
  }

  return path.join(process.cwd(), "public", "app-icon.png");
}

function isAllowedRendererUrl(url: string): boolean {
  if (!app.isPackaged) {
    return url === rendererDevUrl || url.startsWith(`${rendererDevUrl}/`);
  }

  let requestedPath: string;

  try {
    const requestedUrl = new URL(url);

    if (requestedUrl.protocol !== "file:") {
      return false;
    }

    requestedPath = fileURLToPath(requestedUrl);
  } catch {
    return false;
  }

  return isPathInsideDirectory(requestedPath, getPackagedRendererDirectory());
}

function getPackagedRendererDirectory(): string {
  return path.resolve(__dirname, "../renderer");
}

function isPathInsideDirectory(filePath: string, directoryPath: string): boolean {
  const normalizedFilePath = path.resolve(filePath);
  const normalizedDirectoryPath = path.resolve(directoryPath);
  const relativePath = path.relative(normalizedDirectoryPath, normalizedFilePath);

  return relativePath === "" || (
    relativePath.length > 0 &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  );
}

app.on("ready", () => {
  configManager = new ConfigManager(
    configPath ?? path.join(app.getPath("userData"), "config", "config.json")
  );
  configManager.load();
  terminalManager = new TerminalManager(() => configManager.get());
  registerAppMenuIpc(projectGitHubUrl);
  registerConfigIpc(configManager);
  registerTerminalIpc(terminalManager);
  app.applicationMenu = null;
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
