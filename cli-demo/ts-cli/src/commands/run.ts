// run command — one-shot, non-interactive execution
//
// Pattern learned from claude-code:
// • Commander .argument() for required positionals (vs yargs .positional())
// • .addOption(new Option(...).choices([...])) for enum-constrained options
// • JSON output path mirrors claude-code's --output-format flag

import chalk from "chalk"
import { Option } from "@commander-js/extra-typings"
import type { Command } from "@commander-js/extra-typings"
import { log } from "../core/logger.js"
import type { CommandSetup } from "../core/cmd.js"

function simulateRun(prompt: string, model: string) {
  log.debug(`run: model=${model} prompt="${prompt}"`)
  return { text: `Stub answer to: "${prompt}"`, tokens: prompt.split(/\s+/).length * 2 }
}

export const runCommand: CommandSetup = (program: Command) => {
  program
    .command("run")
    .description("run a single prompt and print the result")
    .argument("<prompt>", "the prompt to send")
    .option("-m, --model <model>", "AI model to use", "claude-3-5-sonnet")
    .addOption(
      new Option("-o, --output <format>", "output format")
        .choices(["text", "json"] as const)
        .default("text"),
    )
    .action((prompt, opts) => {
      const result = simulateRun(prompt, opts.model)
      if (opts.output === "json") {
        console.log(JSON.stringify({ prompt, ...result }, null, 2))
      } else {
        console.log(chalk.bold.blue("→ ") + result.text)
        console.log(chalk.gray(`  tokens used: ${result.tokens}`))
      }
    })
}

