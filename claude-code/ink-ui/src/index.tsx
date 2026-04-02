#!/usr/bin/env node
/**
 * ink-ui entry point
 *
 * Learned from claude-code src/main.tsx:
 * • render() from ink mounts the React tree to the terminal stdout
 * • waitUntilExit() is awaited so the process stays alive until the
 *   component calls useApp().exit()  — identical pattern in claude-code
 * • Commander.js parses --model / --no-color flags before render
 */
import { render } from "ink"
import React from "react"
import { Command } from "commander"
import { App } from "./App.js"

const program = new Command()
  .name("ink-ui")
  .description("React + Ink TUI demo (claude-code style)")
  .option("--no-color", "disable chalk colors")
  .parse(process.argv)

const { waitUntilExit } = render(<App />)
await waitUntilExit()
