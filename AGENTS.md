# Repository Guidelines

## Project Structure & Module Organization

MorphTerm is an Electron terminal built with React, TypeScript, xterm.js, and node-pty. Code lives under `src/`:

- `src/main/`: Electron main process, window setup, config loading, and node-pty terminal management.
- `src/preload/`: preload bridge that exposes safe IPC APIs to the renderer.
- `src/renderer/`: React UI, terminal rendering, settings panel, effects, and styles.
- `src/shared/`: shared IPC contracts, config types, defaults, validation, and app metadata.
- `public/`: packaged assets such as the app icon.
- `.github/workflows/ci.yml`: Windows CI for install, typecheck, and build.

Generated output belongs in `dist/` and release artifacts in `release/`; do not hand-edit either directory.

## Build, Test, and Development Commands

Use Node 20:

```powershell
npm install
npm run dev
npm run typecheck
npm run build
npm run dist:win
```

- `npm run dev`: starts the Vite renderer server and launches Electron.
- `npm run typecheck`: runs TypeScript checks for Electron and renderer projects.
- `npm run build`: compiles main/preload code and builds the renderer.
- `npm run dist:win`: creates a Windows portable package in `release/`.

If PowerShell blocks `npm`, use `npm.cmd run <script>`.

## Coding Style & Naming Conventions

Write TypeScript with small, readable modules. Use two-space indentation, semicolons, and existing React functional component patterns. Name React components in `PascalCase` (`TerminalView.tsx`) and helpers, IPC channels, and config fields in `camelCase`.

Keep architecture boundaries strict: never spawn shell processes in the renderer. Terminal process work belongs in `src/main/`, browser-facing APIs in `src/preload/`, and shared contracts in `src/shared/`.

## Testing Guidelines

There is currently no dedicated test runner. Before submitting changes, run:

```powershell
npm run typecheck
npm run build
```

For terminal, config, or IPC behavior, manually verify `npm run dev` on Windows. Future tests should colocate with the feature and use names such as `validate-config.test.ts`.

## Commit & Pull Request Guidelines

Recent history uses conventional commit prefixes such as `fix:`, `docs:`, `chore:`, and `ci:`. Keep commits focused and imperative, such as `fix: resize terminal after settings toggle`.

Pull requests should include a summary, verification commands, linked issues when applicable, and screenshots or recordings for visible renderer changes. Note config or packaging impact explicitly.

## Configuration & Scope Notes

Development config is under `.morphterm-dev/`, including `.morphterm-dev/config/config.json`. Keep V0.1 changes focused on one working terminal session, xterm.js rendering, node-pty connection, resize support, JSON config, background/font customization, and terminal colors. Avoid a plugin system or large dependencies without a design note.
