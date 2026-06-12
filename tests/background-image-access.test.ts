import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  allowBackgroundImagePath,
  allowConfiguredBackgroundImage,
  isAllowedBackgroundImagePath
} from "../src/main/backgroundImageAccess";
import { defaultConfig } from "../src/shared/config/default-config";

describe("background image access", () => {
  it("allows selected or configured image paths only", () => {
    const allowedBackgroundImages = new Set<string>();
    const selectedPath = path.resolve("C:/wallpapers/terminal.PNG");

    allowBackgroundImagePath(allowedBackgroundImages, selectedPath);

    assert.equal(
      isAllowedBackgroundImagePath(allowedBackgroundImages, selectedPath.toLowerCase()),
      true
    );
    assert.equal(
      isAllowedBackgroundImagePath(
        allowedBackgroundImages,
        path.resolve("C:/wallpapers/other.png")
      ),
      false
    );
    assert.equal(
      isAllowedBackgroundImagePath(allowedBackgroundImages, "C:/wallpapers/readme.txt"),
      false
    );
  });

  it("seeds access from image background config", () => {
    const allowedBackgroundImages = new Set<string>();
    const configuredPath = path.resolve("C:/wallpapers/configured.webp");

    allowConfiguredBackgroundImage(allowedBackgroundImages, {
      ...defaultConfig,
      appearance: {
        background: {
          type: "image",
          value: configuredPath,
          opacity: 0.4,
          blur: 0
        }
      }
    });

    assert.equal(
      isAllowedBackgroundImagePath(allowedBackgroundImages, configuredPath),
      true
    );
  });
});
