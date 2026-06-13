import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import type { WebContents } from "electron";
import type { IDisposable, IPty } from "node-pty";
import * as pty from "node-pty";
import { terminalChannels } from "../shared/terminalIpc";
import { defaultConfig } from "../shared/config/default-config";
import type {
  MorphTermConfig,
  MorphTermShellConfig
} from "../shared/config/config-types";
import type {
  TerminalAttachRequest,
  TerminalAttachResult,
  TerminalCreateRequest,
  TerminalCreateResult
} from "../shared/terminalIpc";

const maxSessionHistoryLength = 200_000;
const maxTerminalColumns = 500;
const maxTerminalRows = 200;
type ConfigProvider = () => MorphTermConfig;

interface ShellLaunchConfig {
  shell: string;
  args: string[];
}

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

  constructor(private getConfig: ConfigProvider = () => defaultConfig) {}

  create(
    webContents: WebContents,
    options: TerminalCreateRequest = {}
  ): TerminalCreateResult {
    const shellLaunchConfig = getShellLaunchConfig(this.getConfig().shell);
    const terminalProcess = pty.spawn(shellLaunchConfig.shell, shellLaunchConfig.args, {
      name: "xterm-256color",
      cols: normalizeColumns(options.cols ?? 80),
      rows: normalizeRows(options.rows ?? 24),
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

    const exitSubscription = terminalProcess.onExit((event) => {
      const session = this.sessions.get(id);

      if (session && !session.webContents.isDestroyed()) {
        session.webContents.send(terminalChannels.exit, {
          id,
          exitCode: event.exitCode,
          signal: event.signal
        });
      }

      this.removeSession(id, false);
    });

    this.sessions.set(id, {
      id,
      process: terminalProcess,
      shell: shellLaunchConfig.shell,
      webContents,
      history: "",
      dataSubscription,
      exitSubscription
    });

    return {
      id,
      pid: terminalProcess.pid,
      shell: shellLaunchConfig.shell,
      history: ""
    };
  }

  attach(
    webContents: WebContents,
    options: TerminalAttachRequest
  ): TerminalAttachResult {
    const session = this.getAttachableSession(webContents, options.id);
    session.webContents = webContents;

    if (options.cols && options.rows) {
      session.process.resize(
        normalizeColumns(options.cols),
        normalizeRows(options.rows)
      );
    }

    return {
      id: session.id,
      pid: session.process.pid,
      shell: session.shell,
      history: session.history
    };
  }

  write(webContents: WebContents, id: string, data: string): void {
    const session = this.getOwnedSession(webContents, id);
    session.process.write(data);
  }

  resize(webContents: WebContents, id: string, cols: number, rows: number): void {
    const session = this.getOwnedSession(webContents, id);
    session.process.resize(normalizeColumns(cols), normalizeRows(rows));
  }

  dispose(webContents: WebContents, id: string): void {
    this.removeSession(id, true, webContents);
  }

  disposeAll(): void {
    for (const id of this.sessions.keys()) {
      this.removeSession(id, true);
    }
  }

  private removeSession(
    id: string,
    killProcess: boolean,
    webContents?: WebContents
  ): void {
    const session = this.sessions.get(id);

    if (!session) {
      return;
    }

    if (webContents && session.webContents.id !== webContents.id) {
      throw new Error(`Terminal session not owned by caller: ${id}`);
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

  private getOwnedSession(webContents: WebContents, id: string): TerminalSession {
    const session = this.getSession(id);

    if (session.webContents.id !== webContents.id) {
      throw new Error(`Terminal session not owned by caller: ${id}`);
    }

    return session;
  }

  private getAttachableSession(
    webContents: WebContents,
    id: string
  ): TerminalSession {
    const session = this.getSession(id);

    if (
      session.webContents.id !== webContents.id &&
      !session.webContents.isDestroyed()
    ) {
      throw new Error(`Terminal session not attachable by caller: ${id}`);
    }

    return session;
  }
}

function getShellLaunchConfig(shellConfig: MorphTermShellConfig): ShellLaunchConfig {
  if (shellConfig.profile === "custom" && shellConfig.customPath.trim()) {
    return {
      shell: shellConfig.customPath.trim(),
      args: shellConfig.customArgs
    };
  }

  if (process.platform !== "win32") {
    return {
      shell: process.env.SHELL || "/bin/bash",
      args: []
    };
  }

  if (shellConfig.profile === "cmd") {
    return {
      shell: "cmd.exe",
      args: []
    };
  }

  if (shellConfig.profile === "git-bash") {
    const gitBashPath = getGitBashPath();

    if (gitBashPath) {
      return {
        shell: gitBashPath,
        args: ["--login", "-i"]
      };
    }
  }

  return {
    shell: "powershell.exe",
    args: getPowerShellArgs()
  };
}

function getGitBashPath(): string | null {
  const candidates = [
    "C:\\Program Files\\Git\\bin\\bash.exe",
    "C:\\Program Files (x86)\\Git\\bin\\bash.exe"
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function getPowerShellArgs(): string[] {
  return [
    "-NoLogo",
    "-NoProfile",
    "-NoExit",
    "-Command",
    "Set-PSReadLineOption -HistorySaveStyle SaveNothing"
  ];
}

function getDefaultWorkingDirectory(): string {
  return process.env.HOME || process.env.USERPROFILE || os.homedir();
}

function normalizeColumns(value: number): number {
  return normalizeDimension(value, maxTerminalColumns);
}

function normalizeRows(value: number): number {
  return normalizeDimension(value, maxTerminalRows);
}

function normalizeDimension(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.min(max, Math.floor(value));
}

function appendHistory(history: string, data: string): string {
  const nextHistory = history + data;

  if (nextHistory.length <= maxSessionHistoryLength) {
    return nextHistory;
  }

  return nextHistory.slice(nextHistory.length - maxSessionHistoryLength);
}
