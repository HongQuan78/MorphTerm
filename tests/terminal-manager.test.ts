import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TerminalManager,
  getTerminalSpawnOptions
} from "../src/main/TerminalManager";

interface TestTerminalSession {
  id: string;
  process: {
    pid: number;
    kill(): void;
  };
  shell: string;
  webContents: {
    id: number;
    isDestroyed(): boolean;
    send(): void;
  };
  history: string;
  dataSubscription: {
    dispose(): void;
  };
  exitSubscription: {
    dispose(): void;
  };
}

type TerminalManagerInternals = {
  sessions: Map<string, TestTerminalSession>;
};

describe("TerminalManager spawn options", () => {
  it("uses ConPTY DLL on Windows and normalizes terminal dimensions", () => {
    const options = getTerminalSpawnOptions(
      10_000,
      10_000,
      "win32",
      {},
      "C:\\Users\\tester"
    );

    assert.equal(options.useConpty, true);
    assert.equal(options.useConptyDll, true);
    assert.equal(options.name, "xterm-256color");
    assert.equal(options.cols, 500);
    assert.equal(options.rows, 200);
    assert.equal(options.cwd, "C:\\Users\\tester");
    assert.equal(options.env?.TERM, "xterm-256color");
    assert.equal(options.env?.COLORTERM, "truecolor");
  });

  it("does not force ConPTY on non-Windows platforms", () => {
    const options = getTerminalSpawnOptions(80, 24, "linux", {
      TERM: "screen-256color",
      COLORTERM: "24bit"
    });

    assert.equal(options.useConpty, false);
    assert.equal(options.useConptyDll, false);
    assert.equal(options.env?.TERM, "screen-256color");
    assert.equal(options.env?.COLORTERM, "24bit");
  });

  it("removes sessions even when terminal process cleanup fails", () => {
    const manager = new TerminalManager();
    const sessions = (manager as unknown as TerminalManagerInternals).sessions;
    const warnings: unknown[][] = [];
    const originalWarn = console.warn;

    sessions.set("session-1", createTestSession({
      kill() {
        throw new Error("kill failed");
      }
    }));
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };

    try {
      assert.doesNotThrow(() => manager.disposeAll());
    } finally {
      console.warn = originalWarn;
    }

    assert.equal(sessions.has("session-1"), false);
    assert.equal(warnings.length, 1);
    assert.match(String(warnings[0]?.[0]), /Failed to dispose terminal process/);
  });
});

function createTestSession(
  processOverrides: Partial<TestTerminalSession["process"]> = {}
): TestTerminalSession {
  return {
    id: "session-1",
    process: {
      pid: 123,
      kill() {},
      ...processOverrides
    },
    shell: "powershell.exe",
    webContents: {
      id: 1,
      isDestroyed() {
        return false;
      },
      send() {}
    },
    history: "",
    dataSubscription: {
      dispose() {}
    },
    exitSubscription: {
      dispose() {}
    }
  };
}
