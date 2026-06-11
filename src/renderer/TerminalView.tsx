import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { SettingsPanel } from "./SettingsPanel";
import { TerminalLayout } from "./TerminalLayout";
import { getKeybindingAction } from "./keybindings";
import type { EffectLayerHandle } from "./EffectLayer";
import { defaultConfig } from "../shared/config/default-config";
import type { MorphTermConfig } from "../shared/config/config-types";

const terminalLayoutStorageKey = "morphterm:terminal-layout-v1";

interface TerminalPaneState {
  id: string;
  title: string;
  sessionId?: string;
  size?: number;
}

interface TerminalTabState {
  id: string;
  title: string;
  panes: TerminalPaneState[];
  activePaneId: string;
  splitDirection: "row" | "column";
}

interface StoredTerminalLayout {
  activeTabId: string;
  tabs: TerminalTabState[];
}

interface TerminalPaneProps {
  pane: TerminalPaneState;
  config: MorphTermConfig;
  isActive: boolean;
  effectLayerRef: RefObject<EffectLayerHandle>;
  onFocus(): void;
  onSessionChange(sessionId: string): void;
}

export function TerminalView() {
  const effectLayerRef = useRef<EffectLayerHandle | null>(null);
  const panesContainerRef = useRef<HTMLDivElement | null>(null);
  const [savedConfig, setSavedConfig] = useState<MorphTermConfig>(defaultConfig);
  const [previewConfig, setPreviewConfig] =
    useState<MorphTermConfig>(defaultConfig);
  const [backgroundImageDataUrl, setBackgroundImageDataUrl] = useState<
    string | null
  >(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tabs, setTabs] = useState<TerminalTabState[]>(() => {
    return loadStoredTerminalLayout()?.tabs ?? [createTab(1)];
  });
  const [activeTabId, setActiveTabId] = useState(() => {
    const storedLayout = loadStoredTerminalLayout();

    return storedLayout?.activeTabId ?? tabs[0]?.id ?? "";
  });

  const activeTab = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  }, [activeTabId, tabs]);
  const activePanes = useMemo(() => {
    return activeTab ? normalizePaneSizes(activeTab.panes) : [];
  }, [activeTab]);
  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  useEffect(() => {
    const storedLayout = loadStoredTerminalLayout();

    if (storedLayout) {
      return;
    }

    setActiveTabId((currentActiveTabId) => currentActiveTabId || tabs[0]?.id || "");
  }, [tabs]);

  useEffect(() => {
    if (tabs.length === 0) {
      return;
    }

    storeTerminalLayout({
      activeTabId: activeTab?.id ?? tabs[0].id,
      tabs
    });
  }, [activeTab?.id, tabs]);

  useEffect(() => {
    const background = previewConfig.appearance.background;

    if (background.type !== "image" || !background.value) {
      setBackgroundImageDataUrl(null);
      return;
    }

    let disposed = false;
    const configApi = window.morphTerm.config as typeof window.morphTerm.config & {
      getBackgroundImageData?: (imagePath: string) => Promise<string | null>;
    };

    if (typeof configApi.getBackgroundImageData !== "function") {
      setBackgroundImageDataUrl(null);
      return;
    }

    void configApi
      .getBackgroundImageData(background.value)
      .then((dataUrl) => {
        if (!disposed) {
          setBackgroundImageDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!disposed) {
          setBackgroundImageDataUrl(null);
        }
      });

    return () => {
      disposed = true;
    };
  }, [previewConfig.appearance.background.type, previewConfig.appearance.background.value]);

  useEffect(() => {
    if (!window.morphTerm?.terminal || !window.morphTerm?.config) {
      return;
    }

    let disposed = false;

    void window.morphTerm.config
      .get()
      .then((config) => {
        if (disposed) {
          return;
        }

        setSavedConfig(config);
        setPreviewConfig(config);
      })
      .catch(() => {
        if (disposed) {
          return;
        }

        setSavedConfig(defaultConfig);
        setPreviewConfig(defaultConfig);
      });

    return () => {
      disposed = true;
    };
  }, []);

  const addTab = () => {
    const nextTab = createTab(tabs.length + 1);

    setTabs((currentTabs) => [...currentTabs, nextTab]);
    setActiveTabId(nextTab.id);
  };

  const closeTab = (tabId: string) => {
    const tabToClose = tabs.find((tab) => tab.id === tabId);

    if (!tabToClose || tabs.length === 1) {
      return;
    }

    disposePanes(tabToClose.panes);

    setTabs((currentTabs) => {
      const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);

      if (activeTabId === tabId) {
        setActiveTabId(nextTabs[0]?.id ?? "");
      }

      return nextTabs;
    });
  };

  const closeActiveTab = () => {
    if (activeTab) {
      closeTab(activeTab.id);
    }
  };

  const selectAdjacentTab = (direction: "next" | "previous") => {
    if (!activeTab || tabs.length <= 1) {
      return;
    }

    const activeIndex = tabs.findIndex((tab) => tab.id === activeTab.id);
    const nextIndex =
      direction === "next"
        ? (activeIndex + 1) % tabs.length
        : (activeIndex - 1 + tabs.length) % tabs.length;

    setActiveTabId(tabs[nextIndex]?.id ?? activeTab.id);
  };

  const splitActivePane = (splitDirection: TerminalTabState["splitDirection"]) => {
    if (!activeTab) {
      return;
    }

    const nextPane = createPane(activeTab.panes.length + 1);
    const panes = normalizePaneSizes([...activeTab.panes, nextPane]);

    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== activeTab.id) {
          return tab;
        }

        return {
          ...tab,
          splitDirection,
          panes,
          activePaneId: nextPane.id
        };
      })
    );
  };

  const closeActivePane = () => {
    if (!activeTab || activeTab.panes.length === 1) {
      return;
    }

    const paneToClose = activeTab.panes.find(
      (pane) => pane.id === activeTab.activePaneId
    );

    if (paneToClose?.sessionId) {
      void window.morphTerm.terminal.dispose({ id: paneToClose.sessionId });
    }

    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== activeTab.id) {
          return tab;
        }

        const panes = normalizePaneSizes(
          tab.panes.filter((pane) => pane.id !== tab.activePaneId)
        );

        return {
          ...tab,
          panes,
          activePaneId: panes[0]?.id ?? ""
        };
      })
    );
  };

  const updatePaneSession = (
    tabId: string,
    paneId: string,
    sessionId: string
  ) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        return {
          ...tab,
          panes: tab.panes.map((pane) =>
            pane.id === paneId ? { ...pane, sessionId } : pane
          )
        };
      })
    );
  };

  const focusPane = (tabId: string, paneId: string) => {
    setActiveTabId(tabId);
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === tabId ? { ...tab, activePaneId: paneId } : tab
      )
    );
  };

  const resizePanePair = (tabId: string, paneIndex: number, deltaPercent: number) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        const panes = normalizePaneSizes(tab.panes);
        const leftPane = panes[paneIndex];
        const rightPane = panes[paneIndex + 1];

        if (!leftPane || !rightPane) {
          return tab;
        }

        const pairTotal = (leftPane.size ?? 0) + (rightPane.size ?? 0);
        const minSize = Math.min(12, pairTotal / 2);
        const leftSize = clamp(
          (leftPane.size ?? 0) + deltaPercent,
          minSize,
          pairTotal - minSize
        );
        const rightSize = pairTotal - leftSize;

        return {
          ...tab,
          panes: panes.map((pane, index) => {
            if (index === paneIndex) {
              return { ...pane, size: leftSize };
            }

            if (index === paneIndex + 1) {
              return { ...pane, size: rightSize };
            }

            return pane;
          })
        };
      })
    );
  };

  const startPaneResize = (
    paneIndex: number,
    event: ReactPointerEvent<HTMLDivElement>
  ) => {
    if (!activeTab || !panesContainerRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const tabId = activeTab.id;
    const splitDirection = activeTab.splitDirection;
    const rect = panesContainerRef.current.getBoundingClientRect();
    const startPosition =
      splitDirection === "row" ? event.clientX : event.clientY;
    const containerSize = splitDirection === "row" ? rect.width : rect.height;

    if (containerSize <= 0) {
      return;
    }

    let previousDeltaPercent = 0;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const currentPosition =
        splitDirection === "row" ? moveEvent.clientX : moveEvent.clientY;
      const totalDeltaPercent =
        ((currentPosition - startPosition) / containerSize) * 100;
      const incrementalDeltaPercent = totalDeltaPercent - previousDeltaPercent;

      previousDeltaPercent = totalDeltaPercent;
      resizePanePair(tabId, paneIndex, incrementalDeltaPercent);
    };

    const handlePointerUp = () => {
      document.body.classList.remove("is-resizing-pane");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    document.body.classList.add("is-resizing-pane");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const action = getKeybindingAction(event, previewConfig.keybindings);

      if (
        !action ||
        (isSettingsFormControl(event.target) && action !== "toggleSettings")
      ) {
        return;
      }

      event.preventDefault();

      switch (action) {
        case "newTab":
          addTab();
          break;
        case "closeTab":
          closeActiveTab();
          break;
        case "nextTab":
          selectAdjacentTab("next");
          break;
        case "previousTab":
          selectAdjacentTab("previous");
          break;
        case "splitRight":
          splitActivePane("row");
          break;
        case "splitDown":
          splitActivePane("column");
          break;
        case "closePane":
          closeActivePane();
          break;
        case "toggleSettings":
          setIsSettingsOpen((isOpen) => !isOpen);
          break;
      }
    };

    window.addEventListener("keydown", handleShortcut, true);

    return () => {
      window.removeEventListener("keydown", handleShortcut, true);
    };
  }, [activeTab, previewConfig.keybindings, tabs]);

  return (
    <TerminalLayout
      config={previewConfig}
      effectLayerRef={effectLayerRef}
      backgroundImageDataUrl={backgroundImageDataUrl}
    >
      <div className="terminal-workbench">
        <div className="terminal-tabbar">
          <div className="terminal-tabs" role="tablist" aria-label="Terminal tabs">
            {tabs.map((tab, tabIndex) => (
              <button
                type="button"
                role="tab"
                aria-selected={tab.id === activeTab?.id}
                className={tab.id === activeTab?.id ? "terminal-tab active" : "terminal-tab"}
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="terminal-tab-index">
                  {String(tabIndex + 1).padStart(2, "0")}
                </span>
                <span className="terminal-tab-label">{getTabLabel(tab)}</span>
                <span className="terminal-tab-meta">{tab.panes.length}</span>
                {tabs.length > 1 && (
                  <span
                    className="terminal-tab-close"
                    title="Close tab"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.id);
                    }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="terminal-toolbar" aria-label="Terminal actions">
            <button type="button" title="New tab" aria-label="New tab" onClick={addTab}>
              <span className="terminal-action-icon plus" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Split right"
              aria-label="Split right"
              onClick={() => splitActivePane("row")}
            >
              <span className="terminal-action-icon split-right" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Split down"
              aria-label="Split down"
              onClick={() => splitActivePane("column")}
            >
              <span className="terminal-action-icon split-down" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Close pane"
              aria-label="Close pane"
              disabled={!activeTab || activeTab.panes.length <= 1}
              onClick={closeActivePane}
            >
              <span className="terminal-action-icon close" aria-hidden="true" />
            </button>
            <button
              type="button"
              title="Settings"
              aria-label="Settings"
              onClick={() => setIsSettingsOpen(true)}
            >
              <span className="terminal-action-icon settings" aria-hidden="true" />
            </button>
          </div>
        </div>

        {activeTab ? (
          <div
            ref={panesContainerRef}
            className={`terminal-panes ${activeTab.splitDirection}`}
          >
            {activePanes.map((pane, paneIndex, panes) => (
              <Fragment key={pane.id}>
                <TerminalPane
                  pane={pane}
                  config={previewConfig}
                  isActive={pane.id === activeTab.activePaneId}
                  effectLayerRef={effectLayerRef}
                  onFocus={() => focusPane(activeTab.id, pane.id)}
                  onSessionChange={(sessionId) =>
                    updatePaneSession(activeTab.id, pane.id, sessionId)
                  }
                />
                {paneIndex < panes.length - 1 && (
                  <div
                    className="terminal-pane-resizer"
                    role="separator"
                    aria-orientation={
                      activeTab.splitDirection === "row" ? "vertical" : "horizontal"
                    }
                    aria-label="Resize terminal pane"
                    onPointerDown={(event) => startPaneResize(paneIndex, event)}
                  />
                )}
              </Fragment>
            ))}
          </div>
        ) : (
          <div className="terminal-empty-state">No terminal sessions.</div>
        )}
      </div>

      <SettingsPanel
        previewConfig={previewConfig}
        savedConfig={savedConfig}
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        onPreviewConfigChange={setPreviewConfig}
        onSavedConfigChange={setSavedConfig}
      />
    </TerminalLayout>
  );
}

const TerminalPane = memo(function TerminalPane({
  pane,
  config,
  isActive,
  effectLayerRef,
  onFocus,
  onSessionChange
}: TerminalPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(pane.sessionId ?? null);
  const [sessionStatus, setSessionStatus] = useState<
    "starting" | "connected" | "exited"
  >(pane.sessionId ? "connected" : "starting");

  useEffect(() => {
    const terminal = terminalRef.current;

    if (!terminal) {
      return;
    }

    terminal.options.fontFamily = config.fontFamily;
    terminal.options.fontSize = config.fontSize;
    terminal.options.theme = {
      ...config.terminalTheme,
      background: "#00000000"
    };

    requestAnimationFrame(() => {
      resizeTerminal(terminal, fitAddonRef.current, sessionIdRef.current);
    });
  }, [config.fontFamily, config.fontSize, config.terminalTheme]);

  useEffect(() => {
    const terminalContainer = containerRef.current;

    if (!terminalContainer) {
      return;
    }

    if (!window.morphTerm?.terminal) {
      terminalContainer.textContent = "MorphTerm terminal IPC is not available.";
      return;
    }

    let disposed = false;
    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: config.fontFamily,
      fontSize: config.fontSize,
      lineHeight: 1.2,
      scrollback: 5000,
      theme: {
        ...config.terminalTheme,
        background: "#00000000"
      }
    });
    const fitAddon = new FitAddon();
    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    terminal.loadAddon(fitAddon);
    terminal.open(terminalContainer);

    const focusTerminal = () => {
      onFocus();
      terminal.focus();
    };

    const inputDisposable = terminal.onData((data) => {
      const sessionId = sessionIdRef.current;

      if (!sessionId) {
        return;
      }

      void window.morphTerm.terminal.write({
        id: sessionId,
        data
      });

      if (isPrintableInput(data)) {
        requestAnimationFrame(() => {
          effectLayerRef.current?.triggerTypingEffect(
            getCursorEffectOrigin(terminalContainer, terminal)
          );
        });
      }
    });

    const removeDataListener = window.morphTerm.terminal.onData((event) => {
      if (event.id === sessionIdRef.current) {
        terminal.write(event.data);
      }
    });
    const removeExitListener = window.morphTerm.terminal.onExit((event) => {
      if (event.id === sessionIdRef.current) {
        setSessionStatus("exited");
        terminal.write(`\r\n[process exited with code ${event.exitCode}]\r\n`);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      resizeTerminal(terminal, fitAddon, sessionIdRef.current);
    });
    resizeObserver.observe(terminalContainer);
    terminalContainer.addEventListener("pointerdown", focusTerminal);

    requestAnimationFrame(() => {
      resizeTerminal(terminal, fitAddon, sessionIdRef.current);

      if (isActive) {
        focusTerminal();
      }
    });

    void connectTerminalSession(terminal, pane.sessionId)
      .then((session) => {
        if (disposed) {
          return;
        }

        sessionIdRef.current = session.id;
        setSessionStatus("connected");
        onSessionChange(session.id);

        if (session.history) {
          terminal.write(session.history);
        }

        resizeTerminal(terminal, fitAddon, session.id);

        if (isActive) {
          focusTerminal();
        }
      })
      .catch((error: unknown) => {
        terminal.write(`\r\nFailed to start terminal session: ${String(error)}\r\n`);
      });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      terminalContainer.removeEventListener("pointerdown", focusTerminal);
      removeDataListener();
      removeExitListener();
      inputDisposable.dispose();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (isActive) {
      terminalRef.current?.focus();
    }
  }, [isActive]);

  return (
    <div
      className={isActive ? "terminal-pane active" : "terminal-pane"}
      style={{ flexGrow: pane.size ?? 1 }}
    >
      <div className="terminal-pane-header">
        <span className="terminal-pane-title">{pane.title}</span>
        <span className="terminal-pane-status">{sessionStatus}</span>
      </div>
      <div ref={containerRef} className="terminal-view" />
    </div>
  );
}, terminalPanePropsAreEqual);

function terminalPanePropsAreEqual(
  previous: TerminalPaneProps,
  next: TerminalPaneProps
): boolean {
  return (
    previous.pane.id === next.pane.id &&
    previous.pane.title === next.pane.title &&
    previous.pane.sessionId === next.pane.sessionId &&
    previous.pane.size === next.pane.size &&
    terminalOptionsAreEqual(previous.config, next.config) &&
    previous.isActive === next.isActive &&
    previous.effectLayerRef === next.effectLayerRef
  );
}

function terminalOptionsAreEqual(
  previousConfig: MorphTermConfig,
  nextConfig: MorphTermConfig
): boolean {
  return (
    previousConfig.fontFamily === nextConfig.fontFamily &&
    previousConfig.fontSize === nextConfig.fontSize &&
    previousConfig.terminalTheme === nextConfig.terminalTheme
  );
}

function createTab(index: number): TerminalTabState {
  const pane = createPane(1);

  return {
    id: crypto.randomUUID(),
    title: "Shell",
    panes: [pane],
    activePaneId: pane.id,
    splitDirection: "row"
  };
}

function createPane(index: number): TerminalPaneState {
  return {
    id: crypto.randomUUID(),
    title: `Pane ${index}`,
    size: 100
  };
}

function disposePanes(panes: TerminalPaneState[]): void {
  for (const pane of panes) {
    if (pane.sessionId) {
      void window.morphTerm.terminal.dispose({ id: pane.sessionId });
    }
  }
}

function resizeTerminal(
  terminal: Terminal,
  fitAddon: FitAddon | null,
  sessionId: string | null
): void {
  fitAddon?.fit();

  if (sessionId) {
    void window.morphTerm.terminal.resize({
      id: sessionId,
      cols: terminal.cols,
      rows: terminal.rows
    });
  }
}

async function connectTerminalSession(
  terminal: Terminal,
  sessionId?: string
): Promise<{
  id: string;
  history?: string;
}> {
  if (sessionId) {
    try {
      return await window.morphTerm.terminal.attach({
        id: sessionId,
        cols: terminal.cols,
        rows: terminal.rows
      });
    } catch {
      // The main process no longer has this session; create a fresh one below.
    }
  }

  return window.morphTerm.terminal.create({
    cols: terminal.cols,
    rows: terminal.rows
  });
}

function loadStoredTerminalLayout(): StoredTerminalLayout | null {
  try {
    const rawLayout = sessionStorage.getItem(terminalLayoutStorageKey);

    if (!rawLayout) {
      return null;
    }

    const parsedLayout = JSON.parse(rawLayout) as StoredTerminalLayout;

    if (!Array.isArray(parsedLayout.tabs) || parsedLayout.tabs.length === 0) {
      return null;
    }

    return parsedLayout;
  } catch {
    return null;
  }
}

function storeTerminalLayout(layout: StoredTerminalLayout): void {
  sessionStorage.setItem(
    terminalLayoutStorageKey,
    JSON.stringify({
      ...layout,
      tabs: layout.tabs.map((tab) => ({
        ...tab,
        panes: normalizePaneSizes(tab.panes)
      }))
    })
  );
}

function normalizePaneSizes(panes: TerminalPaneState[]): TerminalPaneState[] {
  if (panes.length === 0) {
    return panes;
  }

  const fallbackSize = 100 / panes.length;
  const totalSize = panes.reduce((total, pane) => total + (pane.size ?? 0), 0);

  if (totalSize <= 0) {
    return panes.map((pane) => ({ ...pane, size: fallbackSize }));
  }

  return panes.map((pane) => ({
    ...pane,
    size: ((pane.size ?? fallbackSize) / totalSize) * 100
  }));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getTabLabel(tab: TerminalTabState): string {
  return /^Tab \d+$/.test(tab.title) ? "Shell" : tab.title;
}

function isSettingsFormControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    Boolean(target.closest(".settings-panel")) &&
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement)
  );
}

function isPrintableInput(data: string): boolean {
  return Array.from(data).some((character) => {
    const codePoint = character.codePointAt(0);

    return codePoint !== undefined && codePoint >= 0x20 && codePoint !== 0x7f;
  });
}

function getCursorEffectOrigin(
  container: HTMLDivElement,
  terminal: Terminal
): { x: number; y: number } {
  const layoutRect =
    container.closest(".terminal-layout")?.getBoundingClientRect() ??
    container.getBoundingClientRect();
  const rowsElement = container.querySelector(".xterm-rows");
  const firstRow = rowsElement?.firstElementChild;
  const rowsRect = rowsElement?.getBoundingClientRect();
  const firstRowRect = firstRow?.getBoundingClientRect();

  if (rowsRect && firstRowRect && terminal.cols > 0) {
    const cellWidth = rowsRect.width / terminal.cols;
    const cellHeight = firstRowRect.height || terminal.options.fontSize || 14;
    const cursorX = terminal.buffer.active.cursorX;
    const cursorY = terminal.buffer.active.cursorY;

    return {
      x: rowsRect.left - layoutRect.left + cursorX * cellWidth,
      y: rowsRect.top - layoutRect.top + cursorY * cellHeight + cellHeight * 0.55
    };
  }

  return {
    x: 18,
    y: 24
  };
}
