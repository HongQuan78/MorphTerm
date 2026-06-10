# MorphTerm

MorphTerm is a customizable desktop terminal project. It is designed around a simple idea: a terminal that can feel personal, with configurable fonts, colors, backgrounds, shell behavior, panes, and effects.

This project is still in active development. Some features are usable today, while others are experimental and may change.

## Features

- Desktop terminal app built with Electron and React.
- Terminal rendering powered by xterm.js.
- Shell process management through `node-pty`.
- Tabs and split panes.
- Resizable terminal panes.
- Configurable shell selection.
- JSON-based config file.
- Config validation.
- Customizable font family and font size.
- Customizable terminal foreground, cursor, and theme colors.
- Background customization:
  - color
  - image
  - gradient
- Typing effect support:
  - none
  - spark
- Basic appearance settings panel.

## Tech Stack

- Electron
- React
- TypeScript
- Vite
- xterm.js
- node-pty

## Development Setup

Install dependencies:

```powershell
npm install
```

Start the app in development mode:

```powershell
npm run dev
```

On Windows, if PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

## Commands

```powershell
npm run dev
```

Starts the Vite renderer server and launches Electron.

```powershell
npm run typecheck
```

Runs TypeScript checks.

```powershell
npm run build
```

Builds the Electron main/preload code and the renderer.

```powershell
npm run dist:win
```

Builds a Windows portable release artifact.

## Configuration

During development, MorphTerm stores config separately from Electron runtime data:

```text
.morphterm-dev/user-data/
.morphterm-dev/config/config.json
```

Example config:

```json
{
  "fontFamily": "Cascadia Mono, Consolas, Menlo, Monaco, 'Courier New', monospace",
  "fontSize": 14,
  "terminalTheme": {
    "background": "#0f1115",
    "foreground": "#d8dee9",
    "cursor": "#88c0d0"
  },
  "appearance": {
    "background": {
      "type": "gradient",
      "value": "linear-gradient(135deg, #0f766e 0%, #4f46e5 52%, #db2777 100%)",
      "opacity": 1,
      "blur": 0
    }
  },
  "effects": {
    "typingEffect": "spark"
  },
  "shell": {
    "profile": "system",
    "customPath": "",
    "customArgs": []
  }
}
```

## Current Status

MorphTerm is currently an early alpha. The core terminal experience works, but packaging, signing, cross-platform behavior, and advanced terminal workflows are still being improved.

## Roadmap

- Better packaged releases.
- Code signing for Windows builds.
- More terminal theme presets.
- Cursor style customization.
- Search in terminal output.
- More typing effects.
- Stronger session recovery.
- More complete keybinding customization UI.
- Plugin system.

## License

MIT
