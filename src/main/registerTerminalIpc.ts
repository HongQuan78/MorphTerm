import { ipcMain } from "electron";
import { TerminalManager } from "./TerminalManager";
import { terminalChannels } from "../shared/terminalIpc";
import type {
  TerminalAttachRequest,
  TerminalCreateRequest,
  TerminalDisposeRequest,
  TerminalResizeRequest,
  TerminalWriteRequest
} from "../shared/terminalIpc";
import {
  asTerminalAttachRequest,
  asTerminalCreateRequest,
  asTerminalDisposeRequest,
  asTerminalResizeRequest,
  asTerminalWriteRequest,
  assertTrustedIpcSender
} from "./ipcValidation";

export function registerTerminalIpc(terminalManager: TerminalManager): void {
  ipcMain.handle(
    terminalChannels.create,
    (event, request?: TerminalCreateRequest) => {
      assertTrustedIpcSender(event);

      return terminalManager.create(event.sender, asTerminalCreateRequest(request));
    }
  );

  ipcMain.handle(
    terminalChannels.attach,
    (event, request: TerminalAttachRequest) => {
      assertTrustedIpcSender(event);

      return terminalManager.attach(event.sender, asTerminalAttachRequest(request));
    }
  );

  ipcMain.handle(terminalChannels.write, (event, request: TerminalWriteRequest) => {
    assertTrustedIpcSender(event);
    const writeRequest = asTerminalWriteRequest(request);

    terminalManager.write(event.sender, writeRequest.id, writeRequest.data);
  });

  ipcMain.handle(
    terminalChannels.resize,
    (event, request: TerminalResizeRequest) => {
      assertTrustedIpcSender(event);
      const resizeRequest = asTerminalResizeRequest(request);

      terminalManager.resize(
        event.sender,
        resizeRequest.id,
        resizeRequest.cols,
        resizeRequest.rows
      );
    }
  );

  ipcMain.handle(
    terminalChannels.dispose,
    (event, request: TerminalDisposeRequest) => {
      assertTrustedIpcSender(event);
      terminalManager.dispose(event.sender, asTerminalDisposeRequest(request).id);
    }
  );
}
