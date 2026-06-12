import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getKeybindingAction } from "../src/renderer/keybindings";
import type { MorphTermKeybindingsConfig } from "../src/shared/config/config-types";

const keybindings: MorphTermKeybindingsConfig = {
  newTab: "Ctrl+Shift+F1",
  closeTab: "Ctrl+Shift+F2",
  nextTab: "Ctrl+Tab",
  previousTab: "Ctrl+Shift+Tab",
  splitRight: "Ctrl+Shift+F3",
  splitDown: "Ctrl+Shift+F4",
  closePane: "Ctrl+Shift+F5",
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
      getKeybindingAction(keyboardEvent("F1", { ctrlKey: true, shiftKey: true }), keybindings),
      "newTab"
    );
    assert.equal(
      getKeybindingAction(keyboardEvent("F2", { ctrlKey: true, shiftKey: true }), keybindings),
      "closeTab"
    );
    assert.equal(
      getKeybindingAction(keyboardEvent("Tab", { ctrlKey: true }), keybindings),
      "nextTab"
    );
    assert.equal(
      getKeybindingAction(keyboardEvent("F3", { ctrlKey: true, shiftKey: true }), keybindings),
      "splitRight"
    );
    assert.equal(
      getKeybindingAction(keyboardEvent("F4", { ctrlKey: true, shiftKey: true }), keybindings),
      "splitDown"
    );
    assert.equal(
      getKeybindingAction(keyboardEvent("F5", { ctrlKey: true, shiftKey: true }), keybindings),
      "closePane"
    );
    assert.equal(
      getKeybindingAction(keyboardEvent(",", { ctrlKey: true }), keybindings),
      "toggleSettings"
    );
  });

  it("requires exact modifier matches", () => {
    assert.equal(
      getKeybindingAction(keyboardEvent("Tab"), keybindings),
      null
    );
    assert.equal(
      getKeybindingAction(
        keyboardEvent("Tab", { ctrlKey: true, altKey: true }),
        keybindings
      ),
      null
    );
  });

  it("ignores terminal-reserved control letter shortcuts", () => {
    assert.equal(
      getKeybindingAction(keyboardEvent("T", { ctrlKey: true, shiftKey: true }), {
        ...keybindings,
        newTab: "Ctrl+Shift+T"
      }),
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
