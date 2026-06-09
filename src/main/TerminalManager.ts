import crypto from "node:crypto";
import os from "node:os";
import type { WebContents } from "electron";
import type { IDisposable, IPty } from "node-pty";
import * as pty from "node-pty";
import { terminalChannels } from "../shared/terminalIpc";
import type {
  TerminalCreateRequest,
  TerminalCreateResult
} from "../shared/terminalIpc";

interface TerminalSession {
  id: string;
  process: IPty;
  shell: string;
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
    const terminalProcess = pty.spawn(shell, [], {
      name: "xterm-256color",
      cols: options.cols ?? 80,
      rows: options.rows ?? 24,
      cwd: getDefaultWorkingDirectory(),
      env: process.env
    });
    const id = crypto.randomUUID();

    const dataSubscription = terminalProcess.onData((data) => {
      if (!webContents.isDestroyed()) {
        webContents.send(terminalChannels.data, { id, data });
      }
    });

    const exitSubscription = terminalProcess.onExit(() => {
      this.removeSession(id, false);
    });

    this.sessions.set(id, {
      id,
      process: terminalProcess,
      shell,
      dataSubscription,
      exitSubscription
    });

    return {
      id,
      pid: terminalProcess.pid,
      shell
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

function getDefaultWorkingDirectory(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function normalizeDimension(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}
