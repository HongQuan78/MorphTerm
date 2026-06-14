export const appMenuChannels = {
  performAction: "app-menu:perform-action"
} as const;

export const appMenuActions = [
  "quit",
  "undo",
  "redo",
  "cut",
  "copy",
  "paste",
  "selectAll",
  "reload",
  "forceReload",
  "toggleDevTools",
  "resetZoom",
  "zoomIn",
  "zoomOut",
  "toggleFullscreen",
  "minimize",
  "close",
  "openFeedback"
] as const;

export type AppMenuAction = (typeof appMenuActions)[number];

export function isAppMenuAction(value: unknown): value is AppMenuAction {
  return (
    typeof value === "string" &&
    appMenuActions.includes(value as AppMenuAction)
  );
}
