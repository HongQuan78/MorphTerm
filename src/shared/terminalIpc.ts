export const terminalChannels = {
  create: "terminal:create",
  attach: "terminal:attach",
  write: "terminal:write",
  resize: "terminal:resize",
  dispose: "terminal:dispose",
  data: "terminal:data"
} as const;

export type TerminalChannel =
  (typeof terminalChannels)[keyof typeof terminalChannels];

export interface TerminalCreateRequest {
  cols?: number;
  rows?: number;
}

export interface TerminalCreateResult {
  id: string;
  pid: number;
  shell: string;
  history?: string;
}

export interface TerminalAttachRequest {
  id: string;
  cols?: number;
  rows?: number;
}

export interface TerminalAttachResult {
  id: string;
  pid: number;
  shell: string;
  history: string;
}

export interface TerminalWriteRequest {
  id: string;
  data: string;
}

export interface TerminalResizeRequest {
  id: string;
  cols: number;
  rows: number;
}

export interface TerminalDisposeRequest {
  id: string;
}

export interface TerminalDataEvent {
  id: string;
  data: string;
}
