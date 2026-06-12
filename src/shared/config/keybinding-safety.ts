export function isValidShortcut(shortcut: string): boolean {
  return (
    Boolean(shortcut) &&
    /^[a-z0-9,+\-\[\]`./\\ ]+$/i.test(shortcut) &&
    !isTerminalReservedShortcut(shortcut)
  );
}

export function isTerminalReservedShortcut(shortcut: string): boolean {
  const parts = shortcut
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const key = parts.at(-1);
  const hasControlModifier =
    parts.includes("ctrl") || parts.includes("control");

  return Boolean(hasControlModifier && key && /^[a-z]$/.test(key));
}
