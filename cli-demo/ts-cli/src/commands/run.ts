// run command — one-shot, non-interactive execution
// Demonstrates: positional args, --output format flag, JSON output.

import chalk from "chalk"
import { cmd } from "../core/cmd.js"
import { log } from "../core/logger.js"
import type { RunArgs } from "../core/types.js"

function simulateRun(prompt: string, model: string): { text: string; tokens: number } {
  log.debug(`running prompt with model=${model}`)
  return {
    text: `Stub answer to: "${prompt}"`,
    tokens: prompt.split(/\s+/).length * 2,
  }
}

export const runCommand = cmd<RunArgs>({
  command: "run <prompt>",
  describe: "run a single prompt and print the result",
  builder: (yargs) =>
    yargs
      .positional("prompt", {
        type: "string",
        describe: "the prompt to send",
        demandOption: true,
      })
      .option("model", {
        alias: "m",
        type: "string",
        describe: "AI model to use",
        default: "claude-3-5-sonnet",
      })
      .option("output", {
        alias: "o",
        type: "string",
        describe: "output format",
        choices: ["text", "json"],
        default: "text",
      }),
  handler: (args) => {
    const result = simulateRun(args.prompt, args.model ?? "claude-3-5-sonnet")
    if (args.output === "json") {
      console.log(JSON.stringify({ prompt: args.prompt, ...result }, null, 2))
    } else {
      console.log(chalk.bold.blue("→ ") + result.text)
      console.log(chalk.gray(`  tokens used: ${result.tokens}`))
    }
  },
})
