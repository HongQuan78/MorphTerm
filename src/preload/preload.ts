import { contextBridge, ipcRenderer } from "electron";
import { appInfo } from "../shared/appInfo";
import { configChannels } from "../shared/config/config-ipc";
import { terminalChannels } from "../shared/terminalIpc";
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
  TerminalResizeRequest,
  TerminalWriteRequest
} from "../shared/terminalIpc";

const morphTermApi = {
  appInfo,
  platform: process.platform,
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
    }
  }
};

contextBridge.exposeInMainWorld("morphTerm", morphTermApi);

export type MorphTermApi = typeof morphTermApi;
