// version command
import chalk from "chalk"
import type { Command } from "@commander-js/extra-typings"
import type { CommandSetup } from "../core/cmd.js"

export const versionCommand: CommandSetup = (program: Command) => {
  program
    .command("version")
    .description("print version information")
    .action(() => {
      console.log(chalk.bold("ts-cli-demo") + "  v0.1.0")
      console.log(`  Node.js   ${process.version}`)
      console.log(`  Platform  ${process.platform}/${process.arch}`)
    })
}

