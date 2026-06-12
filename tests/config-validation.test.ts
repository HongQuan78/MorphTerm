import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { defaultConfig } from "../src/shared/config/default-config";
import { mergeConfig, validateConfig } from "../src/shared/config/validate-config";

describe("validateConfig", () => {
  it("falls back to defaults for non-object input", () => {
    assert.deepEqual(validateConfig(null), defaultConfig);
    assert.deepEqual(validateConfig("invalid"), defaultConfig);
  });

  it("clamps numeric settings and keeps valid fields", () => {
    const config = validateConfig({
      fontFamily: "Fira Code",
      fontSize: 100,
      appearance: {
        background: {
          type: "image",
          value: "C:/wallpapers/terminal.png",
          opacity: -1,
          blur: 128
        }
      },
      effects: {
        typingEffect: "none"
      },
      shell: {
        profile: "custom",
        customPath: "pwsh.exe",
        customArgs: ["-NoLogo", 42]
      }
    });

    assert.equal(config.fontFamily, "Fira Code");
    assert.equal(config.fontSize, 32);
    assert.deepEqual(config.appearance.background, {
      type: "image",
      value: "C:/wallpapers/terminal.png",
      opacity: 0,
      blur: 32
    });
    assert.equal(config.effects.typingEffect, "none");
    assert.deepEqual(config.shell, {
      profile: "custom",
      customPath: "pwsh.exe",
      customArgs: ["-NoLogo"]
    });
  });

  it("normalizes legacy background fields", () => {
    const config = validateConfig({
      background: {
        image: "C:/wallpapers/bg.webp",
        imageOpacity: 0.4
      }
    });

    assert.deepEqual(config.appearance.background, {
      type: "image",
      value: "C:/wallpapers/bg.webp",
      opacity: 0.4,
      blur: 0
    });
  });

  it("replaces terminal-reserved control letter keybindings with safe defaults", () => {
    const config = validateConfig({
      keybindings: {
        newTab: "Ctrl+Shift+T",
        splitRight: "Ctrl+Shift+D",
        toggleSettings: "Ctrl+,"
      }
    });

    assert.equal(config.keybindings.newTab, defaultConfig.keybindings.newTab);
    assert.equal(config.keybindings.splitRight, defaultConfig.keybindings.splitRight);
    assert.equal(config.keybindings.toggleSettings, "Ctrl+,");
  });
});

describe("mergeConfig", () => {
  it("uses the provided base config for fallbacks", () => {
    const base = mergeConfig({
      fontFamily: "JetBrains Mono",
      fontSize: 18,
      effects: {
        typingEffect: "none"
      }
    });

    const merged = mergeConfig(
      {
        fontSize: Number.NaN,
        effects: {
          typingEffect: "spark"
        }
      },
      base
    );

    assert.equal(merged.fontFamily, "JetBrains Mono");
    assert.equal(merged.fontSize, 18);
    assert.equal(merged.effects.typingEffect, "spark");
  });
});
