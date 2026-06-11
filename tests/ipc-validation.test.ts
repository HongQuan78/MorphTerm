import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  asImagePath,
  asTerminalAttachRequest,
  asTerminalCreateRequest,
  asTerminalResizeRequest,
  asTerminalWriteRequest,
  assertTrustedIpcSender
} from "../src/main/ipcValidation";

describe("terminal IPC validation", () => {
  it("normalizes optional terminal dimensions", () => {
    assert.deepEqual(asTerminalCreateRequest({ cols: 120.9, rows: 0.1 }), {
      cols: 120,
      rows: 1
    });
  });

  it("requires an id for attach, write, and resize requests", () => {
    assert.deepEqual(asTerminalAttachRequest({ id: "session-1", rows: 24 }), {
      id: "session-1",
      cols: undefined,
      rows: 24
    });

    assert.throws(() => asTerminalWriteRequest({ data: "pwd\r" }), {
      message: "Invalid terminal session id"
    });

    assert.throws(() => asTerminalResizeRequest({ id: "session-1", cols: 80 }), {
      message: "Invalid terminal rows"
    });
  });

  it("rejects oversized terminal input", () => {
    assert.throws(
      () =>
        asTerminalWriteRequest({
          id: "session-1",
          data: "x".repeat(64 * 1024 + 1)
        }),
      {
        message: "Terminal input is too large"
      }
    );
  });
});

describe("image path validation", () => {
  it("accepts supported image extensions and rejects unsafe values", () => {
    assert.equal(asImagePath(" C:/wallpapers/bg.PNG "), "C:/wallpapers/bg.PNG");
    assert.equal(asImagePath("C:/wallpapers/bg.txt"), null);
    assert.equal(asImagePath(""), null);
    assert.equal(asImagePath(undefined), null);
  });
});

describe("trusted IPC sender validation", () => {
  it("allows packaged and local development renderer origins", () => {
    assert.doesNotThrow(() =>
      assertTrustedIpcSender({ senderFrame: { url: "file:///app/index.html" } } as never)
    );
    assert.doesNotThrow(() =>
      assertTrustedIpcSender({
        senderFrame: { url: "http://127.0.0.1:5173/settings" }
      } as never)
    );
  });

  it("rejects untrusted renderer origins", () => {
    assert.throws(
      () =>
        assertTrustedIpcSender({
          senderFrame: { url: "https://example.com" }
        } as never),
      /Rejected IPC call from untrusted frame/
    );
  });
});
