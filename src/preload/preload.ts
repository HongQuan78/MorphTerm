import { contextBridge, ipcRenderer } from "electron";
import type { AppMenuAction } from "../shared/appMenuIpc";
import type {
  MorphTermConfig,
  MorphTermConfigUpdate
} from "../shared/config/config-types";
import type {
  TerminalAttachRequest,
  TerminalAttachResult,
  TerminalCreateRequest,
  TerminalCreateResult,
  TerminalDataEvent,
  TerminalDisposeRequest,
  TerminalExitEvent,
  TerminalResizeRequest,
  TerminalWriteRequest
} from "../shared/terminalIpc";

const appInfo = {
  name: "MorphTerm",
  version: "0.1.0"
} as const;

const appMenuChannels = {
  performAction: "app-menu:perform-action"
} as const;

const configChannels = {
  get: "config:get",
  update: "config:update",
  openConfigFile: "config:openConfigFile",
  selectBackgroundImage: "config:selectBackgroundImage",
  getBackgroundImageData: "config:getBackgroundImageData"
} as const;

const terminalChannels = {
  create: "terminal:create",
  attach: "terminal:attach",
  write: "terminal:write",
  resize: "terminal:resize",
  dispose: "terminal:dispose",
  data: "terminal:data",
  exit: "terminal:exit"
} as const;

const platform =
  typeof process === "object" && typeof process.platform === "string"
    ? process.platform
    : "win32";

const morphTermApi = {
  appInfo,
  platform,
  appMenu: {
    performAction(action: AppMenuAction): Promise<void> {
      return ipcRenderer.invoke(appMenuChannels.performAction, action);
    }
  },
  config: {
    get(): Promise<MorphTermConfig> {
      return ipcRenderer.invoke(configChannels.get);
    },
    update(update: MorphTermConfigUpdate): Promise<MorphTermConfig> {
      return ipcRenderer.invoke(configChannels.update, update);
    },
    openConfigFile(): Promise<void> {
      return ipcRenderer.invoke(configChannels.openConfigFile);
    },
    selectBackgroundImage(): Promise<string | null> {
      return ipcRenderer.invoke(configChannels.selectBackgroundImage);
    },
    getBackgroundImageData(imagePath: string): Promise<string | null> {
      return ipcRenderer.invoke(configChannels.getBackgroundImageData, imagePath);
    }
  },
  terminal: {
    create(request?: TerminalCreateRequest): Promise<TerminalCreateResult> {
      return ipcRenderer.invoke(terminalChannels.create, request);
    },
    attach(request: TerminalAttachRequest): Promise<TerminalAttachResult> {
      return ipcRenderer.invoke(terminalChannels.attach, request);
    },
    write(request: TerminalWriteRequest): Promise<void> {
      return ipcRenderer.invoke(terminalChannels.write, request);
    },
    resize(request: TerminalResizeRequest): Promise<void> {
      return ipcRenderer.invoke(terminalChannels.resize, request);
    },
    dispose(request: TerminalDisposeRequest): Promise<void> {
      return ipcRenderer.invoke(terminalChannels.dispose, request);
    },
    onData(callback: (event: TerminalDataEvent) => void): () => void {
      const listener = (_event: Electron.IpcRendererEvent, data: TerminalDataEvent) => {
        callback(data);
      };

      ipcRenderer.on(terminalChannels.data, listener);

      return () => {
        ipcRenderer.removeListener(terminalChannels.data, listener);
      };
    },
    onExit(callback: (event: TerminalExitEvent) => void): () => void {
      const listener = (_event: Electron.IpcRendererEvent, data: TerminalExitEvent) => {
        callback(data);
      };

      ipcRenderer.on(terminalChannels.exit, listener);

      return () => {
        ipcRenderer.removeListener(terminalChannels.exit, listener);
      };
    }
  }
};

contextBridge.exposeInMainWorld("morphTerm", morphTermApi);

export type MorphTermApi = typeof morphTermApi;
