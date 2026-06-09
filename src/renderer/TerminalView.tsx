import { useEffect, useRef, useState } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { TerminalLayout } from "./TerminalLayout";
import type { EffectLayerHandle } from "./EffectLayer";
import { defaultConfig } from "../shared/config/default-config";
import type { FluxTermConfig } from "../shared/config/config-types";

export function TerminalView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const effectLayerRef = useRef<EffectLayerHandle | null>(null);
  const [activeConfig, setActiveConfig] = useState<FluxTermConfig>(defaultConfig);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (!window.fluxTerm?.terminal || !window.fluxTerm?.config) {
      container.textContent = "FluxTerm terminal IPC is not available.";
      return;
    }

    let terminal: Terminal | null = null;
    let sessionId: string | null = null;
    let disposed = false;
    let cleanupTerminal: (() => void) | null = null;

    void window.fluxTerm.config
      .get()
      .then((config) => {
        if (disposed) {
          return;
        }

        setActiveConfig(config);
        cleanupTerminal = createTerminalSession(container, config);
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }

        container.textContent = `Failed to load config: ${String(error)}`;
        setActiveConfig(defaultConfig);
        cleanupTerminal = createTerminalSession(container, defaultConfig);
      });

    function createTerminalSession(
      terminalContainer: HTMLDivElement,
      config: FluxTermConfig
    ): () => void {
      const terminalTheme = {
        ...config.terminalTheme,
        background: "#00000000"
      };

      terminal = new Terminal({
        cursorBlink: true,
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        lineHeight: 1.2,
        scrollback: 5000,
        theme: terminalTheme
      });
      const fitAddon = new FitAddon();

      terminal.loadAddon(fitAddon);
      terminal.open(terminalContainer);

      const resizeTerminal = () => {
        fitAddon.fit();

        if (sessionId && terminal) {
          void window.fluxTerm.terminal.resize({
            id: sessionId,
            cols: terminal.cols,
            rows: terminal.rows
          });
        }
      };

      const focusTerminal = () => {
        terminal?.focus();
      };

      const inputDisposable = terminal.onData((data) => {
        if (!sessionId) {
          return;
        }

        void window.fluxTerm.terminal.write({
          id: sessionId,
          data
        });

        if (isPrintableInput(data) && terminal) {
          requestAnimationFrame(() => {
            if (!terminal) {
              return;
            }

            effectLayerRef.current?.triggerTypingEffect(
              getCursorEffectOrigin(terminalContainer, terminal)
            );
          });
        }
      });

      const removeDataListener = window.fluxTerm.terminal.onData((event) => {
        if (terminal && (!sessionId || event.id === sessionId)) {
          terminal.write(event.data);
        }
      });

      const resizeObserver = new ResizeObserver(() => {
        resizeTerminal();
      });
      resizeObserver.observe(terminalContainer);
      terminalContainer.addEventListener("pointerdown", focusTerminal);

      requestAnimationFrame(() => {
        resizeTerminal();
        focusTerminal();
      });

      void window.fluxTerm.terminal
        .create({
          cols: terminal.cols,
          rows: terminal.rows
        })
        .then((session) => {
          if (disposed) {
            void window.fluxTerm.terminal.dispose({ id: session.id });
            return;
          }

          sessionId = session.id;
          resizeTerminal();
          focusTerminal();
        })
        .catch((error: unknown) => {
          terminal?.write(
            `\r\nFailed to start terminal session: ${String(error)}\r\n`
          );
        });

      return () => {
        resizeObserver.disconnect();
        terminalContainer.removeEventListener("pointerdown", focusTerminal);
        removeDataListener();
        inputDisposable.dispose();

        if (sessionId) {
          void window.fluxTerm.terminal.dispose({ id: sessionId });
        }

        terminal?.dispose();
        terminal = null;
        sessionId = null;
      };
    }

    return () => {
      disposed = true;
      cleanupTerminal?.();
    };
  }, []);

  return (
    <TerminalLayout config={activeConfig} effectLayerRef={effectLayerRef}>
      <div ref={containerRef} className="terminal-view" />
    </TerminalLayout>
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
  const containerRect = container.getBoundingClientRect();
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
      x: rowsRect.left - containerRect.left + cursorX * cellWidth,
      y: rowsRect.top - containerRect.top + cursorY * cellHeight + cellHeight * 0.55
    };
  }

  return {
    x: 18,
    y: 24
  };
}
