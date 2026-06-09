import { defaultConfig } from "./default-config";
import type {
  MorphTermBackgroundConfig,
  MorphTermConfig,
  MorphTermConfigUpdate,
  MorphTermKeybindingAction,
  MorphTermKeybindingsConfig,
  MorphTermShellProfile,
  MorphTermTypingEffect
} from "./config-types";

const backgroundTypes: MorphTermBackgroundConfig["type"][] = [
  "color",
  "image",
  "gradient"
];
const typingEffects: MorphTermTypingEffect[] = ["none", "spark"];
const shellProfiles: MorphTermShellProfile[] = [
  "system",
  "powershell",
  "cmd",
  "git-bash",
  "custom"
];
const keybindingActions: MorphTermKeybindingAction[] = [
  "newTab",
  "closeTab",
  "nextTab",
  "previousTab",
  "splitRight",
  "splitDown",
  "closePane",
  "toggleSettings"
];

export function validateConfig(update: unknown): MorphTermConfig {
  return mergeConfig(asConfigUpdate(update), defaultConfig);
}

export function mergeConfig(
  update: MorphTermConfigUpdate,
  base: MorphTermConfig = defaultConfig
): MorphTermConfig {
  return {
    fontFamily: validString(update.fontFamily, base.fontFamily),
    fontSize: clampNumber(update.fontSize, base.fontSize, 10, 32),
    terminalTheme: sanitizeTheme(update.terminalTheme, base.terminalTheme),
    appearance: {
      background: sanitizeBackground(update, base.appearance.background)
    },
    effects: {
      typingEffect: validEnum(
        update.effects?.typingEffect,
        typingEffects,
        base.effects.typingEffect
      )
    },
    shell: {
      profile: validEnum(update.shell?.profile, shellProfiles, base.shell.profile),
      customPath: validString(update.shell?.customPath, base.shell.customPath),
      customArgs: validStringArray(update.shell?.customArgs, base.shell.customArgs)
    },
    keybindings: sanitizeKeybindings(update.keybindings, base.keybindings)
  };
}

function sanitizeBackground(
  update: MorphTermConfigUpdate & {
    background?: {
      color?: string;
      image?: string | null;
      imageOpacity?: number;
    };
  },
  base: MorphTermBackgroundConfig
): MorphTermBackgroundConfig {
  const legacyBackground = normalizeLegacyBackground(update);
  const background = {
    ...base,
    ...legacyBackground,
    ...update.appearance?.background
  };

  return {
    type: validEnum(background.type, backgroundTypes, base.type),
    value: validString(background.value, base.value),
    opacity: clampNumber(background.opacity, base.opacity, 0, 1),
    blur: clampNumber(background.blur, base.blur, 0, 32)
  };
}

function sanitizeTheme(
  update: MorphTermConfigUpdate["terminalTheme"],
  base: MorphTermConfig["terminalTheme"]
): MorphTermConfig["terminalTheme"] {
  if (!update || typeof update !== "object") {
    return base;
  }

  return Object.fromEntries(
    Object.entries({
      ...base,
      ...update
    }).filter(([, value]) => typeof value === "string")
  );
}

function sanitizeKeybindings(
  update: MorphTermConfigUpdate["keybindings"],
  base: MorphTermKeybindingsConfig
): MorphTermKeybindingsConfig {
  return keybindingActions.reduce<MorphTermKeybindingsConfig>(
    (keybindings, action) => ({
      ...keybindings,
      [action]: validShortcut(update?.[action], base[action])
    }),
    { ...base }
  );
}

function normalizeLegacyBackground(
  update: MorphTermConfigUpdate & {
    background?: {
      color?: string;
      image?: string | null;
      imageOpacity?: number;
    };
  }
): Partial<MorphTermBackgroundConfig> {
  if (!update.background) {
    return {};
  }

  if (update.background.image) {
    return {
      type: "image",
      value: update.background.image,
      opacity: clampNumber(update.background.imageOpacity, 0.28, 0, 1),
      blur: 0
    };
  }

  if (update.background.color) {
    return {
      type: "color",
      value: update.background.color,
      opacity: 1,
      blur: 0
    };
  }

  return {};
}

function asConfigUpdate(value: unknown): MorphTermConfigUpdate {
  return value && typeof value === "object" ? (value as MorphTermConfigUpdate) : {};
}

function validString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function validStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  return value.filter((item): item is string => typeof item === "string");
}

function validEnum<T extends string>(
  value: unknown,
  options: T[],
  fallback: T
): T {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : fallback;
}

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}

function validShortcut(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const shortcut = value.trim();

  if (!shortcut || !/^[a-z0-9,+\-\[\]`./\\ ]+$/i.test(shortcut)) {
    return fallback;
  }

  return shortcut;
}
