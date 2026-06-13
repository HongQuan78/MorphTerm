import path from "node:path";
import { fileURLToPath } from "node:url";

export const rendererDevUrl = "http://127.0.0.1:5173";

export function isAllowedRendererUrl(
  url: string,
  isPackaged: boolean
): boolean {
  if (!isPackaged) {
    return url === rendererDevUrl || url.startsWith(`${rendererDevUrl}/`);
  }

  return isPackagedRendererIndexUrl(url);
}

export function isPackagedRendererIndexUrl(url: string): boolean {
  let requestedPath: string;

  try {
    const requestedUrl = new URL(url);

    if (requestedUrl.protocol !== "file:") {
      return false;
    }

    requestedPath = fileURLToPath(requestedUrl);
  } catch {
    return false;
  }

  return path.resolve(requestedPath) === getPackagedRendererIndexPath();
}

export function getPackagedRendererDirectory(): string {
  return path.resolve(__dirname, "../renderer");
}

export function getPackagedRendererIndexPath(): string {
  return path.join(getPackagedRendererDirectory(), "index.html");
}
