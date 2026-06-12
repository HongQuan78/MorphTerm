import { useEffect, useRef, useState } from "react";
import type { AppMenuAction } from "../shared/appMenuIpc";

interface MenuActionItem {
  label: string;
  action: AppMenuAction;
  accelerator?: string;
  danger?: boolean;
}

interface MenuSeparator {
  type: "separator";
}

type MenuItem = MenuActionItem | MenuSeparator;

interface MenuDefinition {
  label: string;
  items: MenuItem[];
}

const menus: MenuDefinition[] = [
  {
    label: "File",
    items: [
      { label: "Quit MorphTerm", action: "quit", accelerator: "Ctrl+Q", danger: true }
    ]
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", action: "undo", accelerator: "Ctrl+Z" },
      { label: "Redo", action: "redo", accelerator: "Ctrl+Y" },
      { type: "separator" },
      { label: "Cut", action: "cut", accelerator: "Ctrl+X" },
      { label: "Copy", action: "copy", accelerator: "Ctrl+C" },
      { label: "Paste", action: "paste", accelerator: "Ctrl+V" },
      { label: "Select All", action: "selectAll", accelerator: "Ctrl+A" }
    ]
  },
  {
    label: "View",
    items: [
      { label: "Reload", action: "reload", accelerator: "Ctrl+R" },
      { label: "Force Reload", action: "forceReload", accelerator: "Ctrl+Shift+R" },
      { label: "Toggle DevTools", action: "toggleDevTools", accelerator: "Ctrl+Shift+I" },
      { type: "separator" },
      { label: "Reset Zoom", action: "resetZoom", accelerator: "Ctrl+0" },
      { label: "Zoom In", action: "zoomIn", accelerator: "Ctrl+=" },
      { label: "Zoom Out", action: "zoomOut", accelerator: "Ctrl+-" },
      { type: "separator" },
      { label: "Toggle Full Screen", action: "toggleFullscreen", accelerator: "F11" }
    ]
  },
  {
    label: "Window",
    items: [
      { label: "Minimize", action: "minimize" },
      { label: "Close Window", action: "close" }
    ]
  },
  {
    label: "Help",
    items: [
      { label: "MorphTerm GitHub", action: "openGitHub" }
    ]
  }
];

export function AppMenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    }

    window.addEventListener("mousedown", closeMenu);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", closeMenu);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function performAction(action: AppMenuAction) {
    setOpenMenu(null);
    await window.morphTerm.appMenu.performAction(action);
  }

  return (
    <header className="app-menu-bar" ref={menuRef}>
      <div className="app-menu-brand" aria-label={window.morphTerm.appInfo.name}>
        <span className="app-menu-mark" aria-hidden="true" />
        <span className="app-menu-brand-name">{window.morphTerm.appInfo.name}</span>
      </div>

      <div className="app-menu-surface">
        <nav className="app-menu-list" aria-label="Application menu">
          {menus.map((menu) => (
            <div
              className="app-menu"
              key={menu.label}
              onMouseEnter={() => {
                if (openMenu) {
                  setOpenMenu(menu.label);
                }
              }}
            >
              <button
                type="button"
                className={openMenu === menu.label ? "app-menu-trigger active" : "app-menu-trigger"}
                aria-haspopup="menu"
                aria-expanded={openMenu === menu.label}
                onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              >
                <span>{menu.label}</span>
                <span className="app-menu-chevron" aria-hidden="true" />
              </button>

              {openMenu === menu.label && (
                <div className="app-menu-dropdown" role="menu">
                  {menu.items.map((item, itemIndex) =>
                    "action" in item ? (
                      <button
                        type="button"
                        className={item.danger ? "app-menu-item danger" : "app-menu-item"}
                        key={`${menu.label}-${item.label}`}
                        role="menuitem"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => void performAction(item.action)}
                      >
                        <span>{item.label}</span>
                        {item.accelerator && <kbd>{item.accelerator}</kbd>}
                      </button>
                    ) : (
                      <span
                        className="app-menu-separator"
                        key={`${menu.label}-separator-${itemIndex}`}
                        role="separator"
                      />
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <span className="app-menu-version">v{window.morphTerm.appInfo.version}</span>
    </header>
  );
}
