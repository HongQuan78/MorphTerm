import crypto from "node:crypto";
import os from "node:os";
import type { WebContents } from "electron";
import type { IDisposable, IPty } from "node-pty";
import * as pty from "node-pty";
import { terminalChannels } from "../shared/terminalIpc";
import type {
  TerminalAttachRequest,
  TerminalAttachResult,
  TerminalCreateRequest,
  TerminalCreateResult
} from "../shared/terminalIpc";

const maxSessionHistoryLength = 200_000;

interface TerminalSession {
  id: string;
  process: IPty;
  shell: string;
  webContents: WebContents;
  history: string;
  dataSubscription: IDisposable;
  exitSubscription: IDisposable;
}

export class TerminalManager {
  private sessions = new Map<string, TerminalSession>();

  create(
    webContents: WebContents,
    options: TerminalCreateRequest = {}
  ): TerminalCreateResult {
    const shell = getDefaultShell();
    const terminalProcess = pty.spawn(shell, getDefaultShellArgs(), {
      name: "xterm-256color",
      cols: options.cols ?? 80,
      rows: options.rows ?? 24,
      cwd: getDefaultWorkingDirectory(),
      env: process.env,
      useConpty: false
    });
    const id = crypto.randomUUID();

    const dataSubscription = terminalProcess.onData((data) => {
      const session = this.sessions.get(id);

      if (!session) {
        return;
      }

      session.history = appendHistory(session.history, data);

      if (!session.webContents.isDestroyed()) {
        session.webContents.send(terminalChannels.data, { id, data });
      }
    });

    const exitSubscription = terminalProcess.onExit(() => {
      this.removeSession(id, false);
    });

    this.sessions.set(id, {
      id,
      process: terminalProcess,
      shell,
      webContents,
      history: "",
      dataSubscription,
      exitSubscription
    });

    return {
      id,
      pid: terminalProcess.pid,
      shell,
      history: ""
    };
  }

  attach(
    webContents: WebContents,
    options: TerminalAttachRequest
  ): TerminalAttachResult {
    const session = this.getSession(options.id);
    session.webContents = webContents;

    if (options.cols && options.rows) {
      session.process.resize(
        normalizeDimension(options.cols),
        normalizeDimension(options.rows)
      );
    }

    return {
      id: session.id,
      pid: session.process.pid,
      shell: session.shell,
      history: session.history
    };
  }

  write(id: string, data: string): void {
    const session = this.getSession(id);
    session.process.write(data);
  }

  resize(id: string, cols: number, rows: number): void {
    const session = this.getSession(id);
    session.process.resize(normalizeDimension(cols), normalizeDimension(rows));
  }

  dispose(id: string): void {
    this.removeSession(id, true);
  }

  disposeAll(): void {
    for (const id of this.sessions.keys()) {
      this.dispose(id);
    }
  }

  private removeSession(id: string, killProcess: boolean): void {
    const session = this.sessions.get(id);

    if (!session) {
      return;
    }

    session.dataSubscription.dispose();
    session.exitSubscription.dispose();
    if (killProcess) {
      session.process.kill();
    }
    this.sessions.delete(id);
  }

  private getSession(id: string): TerminalSession {
    const session = this.sessions.get(id);

    if (!session) {
      throw new Error(`Terminal session not found: ${id}`);
    }

    return session;
  }
}

function getDefaultShell(): string {
  if (process.platform === "win32") {
    return "powershell.exe";
  }

  return process.env.SHELL || "/bin/bash";
}

function getDefaultShellArgs(): string[] {
  if (process.platform === "win32") {
    return [
      "-NoLogo",
      "-NoProfile",
      "-NoExit",
      "-Command",
      "Set-PSReadLineOption -HistorySaveStyle SaveNothing"
    ];
  }

  return [];
}

function getDefaultWorkingDirectory(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function normalizeDimension(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function appendHistory(history: string, data: string): string {
  const nextHistory = history + data;

  if (nextHistory.length <= maxSessionHistoryLength) {
    return nextHistory;
  }

  return nextHistory.slice(nextHistory.length - maxSessionHistoryLength);
}
