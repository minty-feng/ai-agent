// Core command factory — mirrors claude-code's pattern.
//
// claude-code uses @commander-js/extra-typings which gives full TypeScript
// inference for .option() chains. Each command file calls registerCommand()
// to attach itself to the root Command, keeping index.ts thin.
//
// Reference: claude-code src/main.tsx, src/commands.ts

import { Command } from "@commander-js/extra-typings"

export type CommandSetup = (program: Command) => void

/**
 * Thin helper so each command module can export a typed setup function
 * without importing Command directly (easier to mock in tests).
 */
export function defineCommand(setup: CommandSetup): CommandSetup {
  return setup
}
