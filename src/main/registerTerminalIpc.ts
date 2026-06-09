import { ipcMain } from "electron";
import { TerminalManager } from "./TerminalManager";
import { terminalChannels } from "../shared/terminalIpc";
import type {
  TerminalCreateRequest,
  TerminalDisposeRequest,
  TerminalResizeRequest,
  TerminalWriteRequest
} from "../shared/terminalIpc";

export function registerTerminalIpc(terminalManager: TerminalManager): void {
  ipcMain.handle(
    terminalChannels.create,
    (event, request?: TerminalCreateRequest) => {
      return terminalManager.create(event.sender, request);
    }
  );

  ipcMain.handle(terminalChannels.write, (_event, request: TerminalWriteRequest) => {
    terminalManager.write(request.id, request.data);
  });

  ipcMain.handle(
    terminalChannels.resize,
    (_event, request: TerminalResizeRequest) => {
      terminalManager.resize(request.id, request.cols, request.rows);
    }
  );

  ipcMain.handle(
    terminalChannels.dispose,
    (_event, request: TerminalDisposeRequest) => {
      terminalManager.dispose(request.id);
    }
  );
}
