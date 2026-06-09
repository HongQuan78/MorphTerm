import type {
  MorphTermKeybindingAction,
  MorphTermKeybindingsConfig
} from "../shared/config/config-types";

export function getKeybindingAction(
  event: KeyboardEvent,
  keybindings: MorphTermKeybindingsConfig
): MorphTermKeybindingAction | null {
  const entries = Object.entries(keybindings) as Array<
    [MorphTermKeybindingAction, string]
  >;

  for (const [action, shortcut] of entries) {
    if (shortcutMatchesEvent(shortcut, event)) {
      return action;
    }
  }

  return null;
}

function shortcutMatchesEvent(shortcut: string, event: KeyboardEvent): boolean {
  const parsedShortcut = parseShortcut(shortcut);

  if (!parsedShortcut) {
    return false;
  }

  return (
    parsedShortcut.key === normalizeEventKey(event) &&
    parsedShortcut.ctrl === event.ctrlKey &&
    parsedShortcut.shift === event.shiftKey &&
    parsedShortcut.alt === event.altKey &&
    parsedShortcut.meta === event.metaKey
  );
}

function parseShortcut(shortcut: string):
  | {
      key: string;
      ctrl: boolean;
      shift: boolean;
      alt: boolean;
      meta: boolean;
    }
  | null {
  const parts = shortcut
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const key = parts.at(-1);

  if (!key) {
    return null;
  }

  return {
    key: normalizeShortcutKey(key),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt") || parts.includes("option"),
    meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command")
  };
}

function normalizeEventKey(event: KeyboardEvent): string {
  if (event.key === " ") {
    return "space";
  }

  return normalizeShortcutKey(event.key);
}

function normalizeShortcutKey(key: string): string {
  const normalizedKey = key.toLowerCase();

  if (normalizedKey === "esc") {
    return "escape";
  }

  if (normalizedKey === "return") {
    return "enter";
  }

  if (normalizedKey === "left") {
    return "arrowleft";
  }

  if (normalizedKey === "right") {
    return "arrowright";
  }

  if (normalizedKey === "up") {
    return "arrowup";
  }

  if (normalizedKey === "down") {
    return "arrowdown";
  }

  return normalizedKey;
}
