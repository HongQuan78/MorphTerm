import { useEffect, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { defaultConfig } from "../shared/config/default-config";
import type { FluxTermConfig } from "../shared/config/config-types";

export function TerminalView() {
  const containerRef = useRef<HTMLDivElement | null>(null);

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

        cleanupTerminal = createTerminalSession(container, config);
      })
      .catch((error: unknown) => {
        if (disposed) {
          return;
        }

        container.textContent = `Failed to load config: ${String(error)}`;
        cleanupTerminal = createTerminalSession(container, defaultConfig);
      });

    function createTerminalSession(
      terminalContainer: HTMLDivElement,
      config: FluxTermConfig
    ): () => void {
      applyBackgroundConfig(terminalContainer, config);

      terminal = new Terminal({
        cursorBlink: true,
        fontFamily: config.fontFamily,
        fontSize: config.fontSize,
        lineHeight: 1.2,
        scrollback: 5000,
        theme: config.terminalTheme
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

  return <div ref={containerRef} className="terminal-view" />;
}

function applyBackgroundConfig(
  container: HTMLDivElement,
  config: FluxTermConfig
): void {
  container.style.backgroundColor = config.background.color;

  if (config.background.image) {
    container.style.backgroundImage = `linear-gradient(rgba(15, 17, 21, ${
      1 - config.background.imageOpacity
    }), rgba(15, 17, 21, ${
      1 - config.background.imageOpacity
    })), url("${config.background.image}")`;
    container.style.backgroundSize = "cover";
    container.style.backgroundPosition = "center";
  } else {
    container.style.backgroundImage = "none";
  }
}
