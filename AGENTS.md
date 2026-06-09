# FluxTerm - Agent Instructions

## Project goal

Build an open-source customizable desktop terminal inspired by Hyper.

The app should allow users to customize:

background image/color/gradient

- font family and font size

- terminal color theme

- cursor style

- typing effects

- config via JSON

- later: tabs, split panes, plugin system

## Tech stack

Use:

- Electron

- React

- TypeScript

- xterm.js

- node-pty

- Tailwind CSS if useful

## Architecture rules

- Do not run shell processes directly in the renderer.

- Use Electron main process to manage node-pty.

- Use preload + IPC for communication between renderer and main.

- Keep terminal engine, config system, theme system, and effect system separated.

- Avoid implementing plugin system in V0.1.

## Development rules

- Make small, reviewable changes.

- Explain what files were changed after each task.

- Prefer simple readable code over clever abstractions.

- Do not add large dependencies without explaining why.

- After each feature, run build/typecheck if available.

## V0.1 scope

Implement only:

- one working terminal session

- xterm.js rendering

- node-pty shell connection

- resize support

- basic config file

- background customization

- font customization

- terminal colors