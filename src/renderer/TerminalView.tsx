import { useEffect, useRef } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

export function TerminalView() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (!window.fluxTerm?.terminal) {
      container.textContent = "FluxTerm terminal IPC is not available.";
      return;
    }

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily:
        "Cascadia Mono, Consolas, Menlo, Monaco, 'Courier New', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      scrollback: 5000,
      theme: {
        background: "#0f1115",
        foreground: "#d8dee9",
        cursor: "#88c0d0",
        selectionBackground: "#3b4252",
        black: "#2e3440",
        red: "#bf616a",
        green: "#a3be8c",
        yellow: "#ebcb8b",
        blue: "#81a1c1",
        magenta: "#b48ead",
        cyan: "#88c0d0",
        white: "#e5e9f0",
        brightBlack: "#4c566a",
        brightRed: "#bf616a",
        brightGreen: "#a3be8c",
        brightYellow: "#ebcb8b",
        brightBlue: "#81a1c1",
        brightMagenta: "#b48ead",
        brightCyan: "#8fbcbb",
        brightWhite: "#eceff4"
      }
    });
    const fitAddon = new FitAddon();
    let sessionId: string | null = null;
    let disposed = false;

    terminal.loadAddon(fitAddon);
    terminal.open(container);

    const resizeTerminal = () => {
      fitAddon.fit();

      if (sessionId) {
        void window.fluxTerm.terminal.resize({
          id: sessionId,
          cols: terminal.cols,
          rows: terminal.rows
        });
      }
    };

    const focusTerminal = () => {
      terminal.focus();
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
      if (!sessionId || event.id === sessionId) {
        terminal.write(event.data);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      resizeTerminal();
    });
    resizeObserver.observe(container);
    container.addEventListener("pointerdown", focusTerminal);

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
        terminal.write(
          `\r\nFailed to start terminal session: ${String(error)}\r\n`
        );
      });

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", focusTerminal);
      removeDataListener();
      inputDisposable.dispose();

      if (sessionId) {
        void window.fluxTerm.terminal.dispose({ id: sessionId });
      }

      terminal.dispose();
    };
  }, []);

  return <div ref={containerRef} className="terminal-view" />;
}
