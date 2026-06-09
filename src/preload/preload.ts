import { contextBridge, ipcRenderer } from "electron";
import { appInfo } from "../shared/appInfo";
import { configChannels } from "../shared/config/config-ipc";
import { terminalChannels } from "../shared/terminalIpc";
import type {
  FluxTermConfig,
  FluxTermConfigUpdate
} from "../shared/config/config-types";
import type {
  TerminalCreateRequest,
  TerminalCreateResult,
  TerminalDataEvent,
  TerminalDisposeRequest,
  TerminalResizeRequest,
  TerminalWriteRequest
} from "../shared/terminalIpc";

const fluxTermApi = {
  appInfo,
  platform: process.platform,
  config: {
    get(): Promise<FluxTermConfig> {
      return ipcRenderer.invoke(configChannels.get);
    },
    update(update: FluxTermConfigUpdate): Promise<FluxTermConfig> {
      return ipcRenderer.invoke(configChannels.update, update);
    },
    openConfigFile(): Promise<void> {
      return ipcRenderer.invoke(configChannels.openConfigFile);
    }
  },
  terminal: {
    create(request?: TerminalCreateRequest): Promise<TerminalCreateResult> {
      return ipcRenderer.invoke(terminalChannels.create, request);
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

contextBridge.exposeInMainWorld("fluxTerm", fluxTermApi);

export type FluxTermApi = typeof fluxTermApi;
