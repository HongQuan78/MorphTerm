import { contextBridge, ipcRenderer } from "electron";
import { appInfo } from "../shared/appInfo";
import { terminalChannels } from "../shared/terminalIpc";
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
