import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  getPackagedRendererIndexPath,
  isAllowedRendererUrl,
  rendererDevUrl
} from "../src/main/rendererTrust";

describe("renderer navigation trust", () => {
  it("allows only the packaged renderer index in packaged mode", () => {
    const rendererIndexUrl = pathToFileURL(getPackagedRendererIndexPath()).toString();
    const packagedAssetUrl = pathToFileURL(
      path.resolve(__dirname, "../src/renderer/assets/app.js")
    ).toString();

    assert.equal(isAllowedRendererUrl(rendererIndexUrl, true), true);
    assert.equal(isAllowedRendererUrl(packagedAssetUrl, true), false);
    assert.equal(isAllowedRendererUrl(`${rendererDevUrl}/settings`, true), false);
  });

  it("allows only the local renderer dev server outside packaged mode", () => {
    const rendererIndexUrl = pathToFileURL(getPackagedRendererIndexPath()).toString();

    assert.equal(isAllowedRendererUrl(rendererDevUrl, false), true);
    assert.equal(isAllowedRendererUrl(`${rendererDevUrl}/settings`, false), true);
    assert.equal(isAllowedRendererUrl(rendererIndexUrl, false), false);
    assert.equal(isAllowedRendererUrl("http://localhost:5173", false), false);
  });
});
