import type { IpcMainInvokeEvent } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MorphTermConfigUpdate } from "../shared/config/config-types";
import type {
  TerminalAttachRequest,
  TerminalCreateRequest,
  TerminalDisposeRequest,
  TerminalResizeRequest,
  TerminalWriteRequest
} from "../shared/terminalIpc";

const maxTerminalInputLength = 64 * 1024;
const rendererDevUrl = "http://127.0.0.1:5173";

export function assertTrustedIpcSender(event: IpcMainInvokeEvent): void {
  const frameUrl = event.senderFrame.url;

  if (
    isPackagedRendererUrl(frameUrl) ||
    frameUrl === rendererDevUrl ||
    frameUrl.startsWith(`${rendererDevUrl}/`)
  ) {
    return;
  }

  throw new Error(`Rejected IPC call from untrusted frame: ${frameUrl}`);
}

function isPackagedRendererUrl(frameUrl: string): boolean {
  let framePath: string;

  try {
    const url = new URL(frameUrl);

    if (url.protocol !== "file:") {
      return false;
    }

    framePath = fileURLToPath(url);
  } catch {
    return false;
  }

  return path.resolve(framePath) === getPackagedRendererIndexPath();
}

function getPackagedRendererIndexPath(): string {
  return path.resolve(__dirname, "../renderer/index.html");
}

export function asConfigUpdate(value: unknown): MorphTermConfigUpdate {
  if (!isRecord(value)) {
    return {};
  }

  return value as MorphTermConfigUpdate;
}

export function asTerminalCreateRequest(value: unknown): TerminalCreateRequest {
  if (!isRecord(value)) {
    return {};
  }

  return {
    cols: optionalDimension(value.cols),
    rows: optionalDimension(value.rows)
  };
}

export function asTerminalAttachRequest(value: unknown): TerminalAttachRequest {
  const request = requireRecord(value, "terminal attach request");

  return {
    id: requireString(request.id, "terminal session id"),
    cols: optionalDimension(request.cols),
    rows: optionalDimension(request.rows)
  };
}

export function asTerminalWriteRequest(value: unknown): TerminalWriteRequest {
  const request = requireRecord(value, "terminal write request");
  const data = requireString(request.data, "terminal input");

  if (data.length > maxTerminalInputLength) {
    throw new Error("Terminal input is too large");
  }

  return {
    id: requireString(request.id, "terminal session id"),
    data
  };
}

export function asTerminalResizeRequest(value: unknown): TerminalResizeRequest {
  const request = requireRecord(value, "terminal resize request");

  return {
    id: requireString(request.id, "terminal session id"),
    cols: requireDimension(request.cols, "terminal columns"),
    rows: requireDimension(request.rows, "terminal rows")
  };
}

export function asTerminalDisposeRequest(value: unknown): TerminalDisposeRequest {
  const request = requireRecord(value, "terminal dispose request");

  return {
    id: requireString(request.id, "terminal session id")
  };
}

export function asImagePath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const imagePath = value.trim();

  if (!imagePath || !/\.(bmp|gif|jpe?g|png|webp)$/i.test(imagePath)) {
    return null;
  }

  return imagePath;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function optionalDimension(value: unknown): number | undefined {
  return value === undefined ? undefined : requireDimension(value, "terminal dimension");
}

function requireDimension(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return Math.max(1, Math.floor(value));
}
