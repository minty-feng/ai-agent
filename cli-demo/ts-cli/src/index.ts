#!/usr/bin/env node
// Entry point — Commander.js-based CLI router
//
// Pattern learned from claude-code src/main.tsx:
//
// 1. PARALLEL PREFETCH — fire expensive async work (config reads, auth checks,
//    API preconnects) as side-effects *before* other imports complete, so they
//    run in parallel with module evaluation rather than blocking the REPL.
//    claude-code does this with startMdmRawRead() / startKeychainPrefetch().
//
// 2. LAZY LOADING — heavy modules (OpenTelemetry ~400KB, gRPC ~700KB) are
//    deferred with dynamic import() until the subcommand that actually needs
//    them runs. We do the same for the readline loop in chat.ts.
//
// 3. COMMAND REGISTRY — each subcommand is a self-contained module that
//    exports a defineCommand() function; index.ts only registers them.
//    claude-code has the same pattern in commands.ts (50+ slash commands).

// ── 1. Parallel prefetch (fires before commander parses args) ─────────────
const t0 = performance.now()
const prefetchConfig = loadConfigAsync() // stub: pretend this hits disk/network

import { Command } from "@commander-js/extra-typings"
import { chatCommand } from "./commands/chat.js"
import { runCommand } from "./commands/run.js"
import { versionCommand } from "./commands/version.js"
import { calcCommand } from "./commands/calc.js"
import { sysCommand } from "./commands/sys.js"
import { diceCommand } from "./commands/dice.js"
import { paletteCommand } from "./commands/palette.js"

// ── 2. Root program ───────────────────────────────────────────────────────
const program = new Command()
  .name("ts-cli")
  .description("A Claude-code–style CLI demo (TypeScript + Commander.js)")
  .version("0.1.0", "-V, --version", "print version")
  .helpOption("-h, --help", "show help")

// ── 3. Register subcommands ───────────────────────────────────────────────
chatCommand(program)
runCommand(program)
versionCommand(program)
calcCommand(program)
sysCommand(program)
diceCommand(program)
paletteCommand(program)

// ── 4. Parse & dispatch ───────────────────────────────────────────────────
// Await prefetch before running so the first subcommand handler has config.
await prefetchConfig
await program.parseAsync(process.argv)

// ─────────────────────────────────────────────────────────────────────────
// Stub: simulates reading a config file / keychain entry in parallel with
// import evaluation — the key pattern from claude-code's startup.
function loadConfigAsync(): Promise<void> {
  return new Promise((resolve) => {
    // In a real tool: read ~/.config/tool/config.json, check OAuth token, etc.
    setImmediate(() => {
      const elapsed = (performance.now() - t0).toFixed(1)
      process.stderr.write(`[boot] config prefetch done in ${elapsed}ms\n`)
      resolve()
    })
  })
}
