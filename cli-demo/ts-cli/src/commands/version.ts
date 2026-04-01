// version command — prints build metadata
import chalk from "chalk"
import { cmd } from "../core/cmd.js"
import type { VersionArgs } from "../core/types.js"

export const versionCommand = cmd<VersionArgs>({
  command: "version",
  describe: "print version information",
  handler: () => {
    console.log(chalk.bold("ts-cli-demo") + "  v0.1.0")
    console.log(`  Node.js   ${process.version}`)
    console.log(`  Platform  ${process.platform}/${process.arch}`)
  },
})
