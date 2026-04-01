#!/usr/bin/env node
// Entry point — yargs-based CLI router
// Architecture mirrors opencode/tui-cli: each subcommand is a self-contained
// module that exports a yargs CommandModule, keeping index.ts thin.

import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { chatCommand } from "./commands/chat.js"
import { runCommand } from "./commands/run.js"
import { versionCommand } from "./commands/version.js"

const cli = yargs(hideBin(process.argv))
  .scriptName("ts-cli")
  .usage("$0 <command> [options]")
  .command(chatCommand as any)
  .command(runCommand as any)
  .command(versionCommand as any)
  .demandCommand(1, "Please specify a command.")
  .help()
  .alias("h", "help")
  .version(false) // version is a manual subcommand for richer output
  .strict()
  .wrap(Math.min(100, process.stdout.columns ?? 100))

cli.parse()
