import type { FluxTermConfig } from "./config-types";

export const defaultConfig: FluxTermConfig = {
  fontFamily: "Cascadia Mono, Consolas, Menlo, Monaco, 'Courier New', monospace",
  fontSize: 14,
  terminalTheme: {
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
  },
  background: {
    color: "#0f1115",
    image: null,
    imageOpacity: 0.28
  }
};
