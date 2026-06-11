import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getKeybindingAction } from "../src/renderer/keybindings";
import type { MorphTermKeybindingsConfig } from "../src/shared/config/config-types";

const keybindings: MorphTermKeybindingsConfig = {
  newTab: "Ctrl+Shift+T",
  closeTab: "Ctrl+Shift+W",
  nextTab: "Ctrl+Tab",
  previousTab: "Ctrl+Shift+Tab",
  splitRight: "Ctrl+Shift+D",
  splitDown: "Ctrl+Shift+E",
  closePane: "Ctrl+Shift+X",
  toggleSettings: "Ctrl+,"
};

function keyboardEvent(
  key: string,
  modifiers: Partial<Pick<KeyboardEvent, "ctrlKey" | "shiftKey" | "altKey" | "metaKey">> = {}
): KeyboardEvent {
  return {
    key,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...modifiers
  } as KeyboardEvent;
}

describe("getKeybindingAction", () => {
  it("matches configured shortcuts", () => {
    assert.equal(
      getKeybindingAction(keyboardEvent("T", { ctrlKey: true, shiftKey: true }), keybindings),
      "newTab"
    );
    assert.equal(
      getKeybindingAction(keyboardEvent(",", { ctrlKey: true }), keybindings),
      "toggleSettings"
    );
  });

  it("requires exact modifier matches", () => {
    assert.equal(
      getKeybindingAction(keyboardEvent("T", { ctrlKey: true }), keybindings),
      null
    );
    assert.equal(
      getKeybindingAction(
        keyboardEvent("T", { ctrlKey: true, shiftKey: true, altKey: true }),
        keybindings
      ),
      null
    );
  });

  it("normalizes common key aliases", () => {
    assert.equal(
      getKeybindingAction(keyboardEvent("Escape"), {
        ...keybindings,
        closePane: "Ctrl+Esc"
      }),
      null
    );
    assert.equal(
      getKeybindingAction(keyboardEvent("Escape", { ctrlKey: true }), {
        ...keybindings,
        closePane: "Ctrl+Esc"
      }),
      "closePane"
    );
  });
});
