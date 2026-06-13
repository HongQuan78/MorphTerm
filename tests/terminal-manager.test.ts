import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getTerminalSpawnOptions } from "../src/main/TerminalManager";

describe("TerminalManager spawn options", () => {
  it("uses ConPTY on Windows and normalizes terminal dimensions", () => {
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
});
