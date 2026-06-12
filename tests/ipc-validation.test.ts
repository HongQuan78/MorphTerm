import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  asImagePath,
  asTerminalAttachRequest,
  asTerminalCreateRequest,
  asTerminalResizeRequest,
  asTerminalWriteRequest,
  assertTrustedIpcSender,
  isTrustedIpcSenderUrl
} from "../src/main/ipcValidation";

describe("terminal IPC validation", () => {
  it("normalizes optional terminal dimensions", () => {
    assert.deepEqual(
      asTerminalCreateRequest({ cols: 120.9, rows: 0.1 }),
      {
        cols: 120,
        rows: 1
      }
    );
    assert.deepEqual(
      asTerminalCreateRequest({ cols: 10_000, rows: 10_000 }),
      {
        cols: 500,
        rows: 200
      }
    );
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
  it("allows only the packaged renderer index in packaged mode", () => {
    const packagedRendererUrl = pathToFileURL(
      path.resolve(__dirname, "../src/renderer/index.html")
    ).toString();
    const untrustedFileUrl = pathToFileURL(
      path.resolve(__dirname, "../src/renderer-copy/index.html")
    ).toString();

    assert.equal(isTrustedIpcSenderUrl(packagedRendererUrl, true), true);
    assert.equal(isTrustedIpcSenderUrl(untrustedFileUrl, true), false);
    assert.equal(
      isTrustedIpcSenderUrl("http://127.0.0.1:5173/settings", true),
      false
    );
  });

  it("allows local development renderer origin outside packaged mode", () => {
    const packagedRendererUrl = pathToFileURL(
      path.resolve(__dirname, "../src/renderer/index.html")
    ).toString();

    assert.doesNotThrow(() =>
      assertTrustedIpcSender({ senderFrame: { url: packagedRendererUrl } } as never)
    );
    assert.doesNotThrow(() =>
      assertTrustedIpcSender({
        senderFrame: { url: "http://127.0.0.1:5173/settings" }
      } as never)
    );
  });

  it("rejects untrusted renderer origins", () => {
    const untrustedFileUrl = pathToFileURL(
      path.resolve(__dirname, "../src/renderer-copy/index.html")
    ).toString();

    assert.throws(
      () =>
        assertTrustedIpcSender({
          senderFrame: { url: "https://example.com" }
        } as never),
      /Rejected IPC call from untrusted frame/
    );
    assert.throws(
      () =>
        assertTrustedIpcSender({
          senderFrame: { url: untrustedFileUrl }
        } as never),
      /Rejected IPC call from untrusted frame/
    );
  });
});
