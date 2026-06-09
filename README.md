# MorphTerm

MorphTerm is an open-source customizable desktop terminal inspired by Hyper. It is early in development, but the goal is simple: a practical terminal that feels good to use and is easy to personalize with a JSON config.

## Features

- Electron desktop app with a React renderer.
- One working terminal session powered by `node-pty`.
- xterm.js terminal rendering with resize support.
- Configurable font family and font size.
- Configurable terminal colors.
- Custom backgrounds:
  - solid color
  - image
  - gradient
- Simple typing effects, including `spark`.
- JSON-based user config.
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

The dev command starts the Vite renderer server and then launches Electron once the renderer is ready.

On Windows, if PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

## npm Commands

```powershell
npm run dev
```

Runs the renderer and Electron app together.

```powershell
npm run dev:renderer
```

Starts only the Vite renderer server at `127.0.0.1:5173`.

```powershell
npm run dev:electron
```

Waits for the renderer, compiles Electron main/preload TypeScript, then launches Electron.

```powershell
npm run typecheck
```

Runs TypeScript checks for Electron and renderer code.

```powershell
npm run build
```

Builds the Electron main/preload code and the renderer.

## Customization

MorphTerm stores user settings as JSON in the Electron `userData` folder. During development, the config is written to:

```text
.morphterm-dev/config.json
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
  }
}
```

Supported background types:

- `color`
- `image`
- `gradient`

Supported typing effects:

- `none`
- `spark`

You can also open and edit the config file from the app settings panel.

## Roadmap

- Better terminal theme presets.
- Cursor style customization.
- Multiple tabs.
- Split panes.
- Search in terminal output.
- More typing effects.
- Plugin system.
- Packaged releases for Windows, macOS, and Linux.

## Contributing

Contributions are welcome. Keep changes small, readable, and focused.

Good first areas to explore:

- UI polish.
- Terminal theme presets.
- Config validation.
- Accessibility improvements.
- Cross-platform shell behavior.

Before opening a pull request, please run:

```powershell
npm run typecheck
npm run build
```

## License

MIT
