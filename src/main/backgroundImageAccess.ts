import path from "node:path";
import type { MorphTermConfig } from "../shared/config/config-types";

export function allowConfiguredBackgroundImage(
  allowedBackgroundImages: Set<string>,
  config: MorphTermConfig
): void {
  const background = config.appearance.background;

  if (background.type === "image") {
    allowBackgroundImagePath(allowedBackgroundImages, background.value);
  }
}

export function allowBackgroundImagePath(
  allowedBackgroundImages: Set<string>,
  imagePath: string
): void {
  const safeImagePath = sanitizeImagePath(imagePath);

  if (safeImagePath) {
    allowedBackgroundImages.add(normalizeImagePath(safeImagePath));
  }
}

export function isAllowedBackgroundImagePath(
  allowedBackgroundImages: Set<string>,
  imagePath: string
): boolean {
  const safeImagePath = sanitizeImagePath(imagePath);

  return Boolean(
    safeImagePath &&
      allowedBackgroundImages.has(normalizeImagePath(safeImagePath))
  );
}

function sanitizeImagePath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const imagePath = value.trim();

  if (!imagePath || !/\.(bmp|gif|jpe?g|png|webp)$/i.test(imagePath)) {
    return null;
  }

  return imagePath;
}

function normalizeImagePath(imagePath: string): string {
  return path.resolve(imagePath.trim()).toLowerCase();
}
