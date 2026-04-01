// chat command — interactive REPL loop
//
// Pattern learned from claude-code:
// • chalk for coloured terminal output (used throughout claude-code)
// • readline for line editing when not using Ink (used in headless/SDK mode)
// • LAZY import of heavy deps: readline is only required when this command runs
// • Command handler is async; Commander.js supports .action(async () => {})

import readline from "readline"
import chalk from "chalk"
import type { Command } from "@commander-js/extra-typings"
import { log } from "../core/logger.js"
import type { CommandSetup } from "../core/cmd.js"

const MODELS = ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"] as const
type Model = (typeof MODELS)[number]

// Stub: in a real tool this awaits an API call with streaming
function simulateReply(userInput: string, model: Model): string {
  return `[${model}] Echo: "${userInput.trim()}" — (stub; wire up your API key here)`
}

async function runRepl(model: Model, systemPrompt: string | undefined) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })

  console.log(chalk.bold.green("╔══════════════════════════════════╗"))
  console.log(chalk.bold.green("║   ts-cli-demo  ·  chat mode      ║"))
  console.log(chalk.bold.green("╚══════════════════════════════════╝"))
  console.log(chalk.gray(`Model : ${model}${systemPrompt ? `  ·  System: "${systemPrompt}"` : ""}`))
  console.log(chalk.gray('Type a message and press Enter.  /help  /exit  Ctrl-D to quit.\n'))

  const prompt = () => process.stdout.write(chalk.cyan("you> "))
  prompt()

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed)                        { prompt(); continue }
    if (trimmed === "/exit" || trimmed === "/quit") break
    if (trimmed === "/help")             { console.log(chalk.yellow("  /exit  /quit  /help  /model")); prompt(); continue }
    if (trimmed === "/model")            { console.log(chalk.yellow(`  current: ${model}`)); prompt(); continue }

    log.debug(`input: ${trimmed}`)
    console.log(chalk.bold.blue("ai>  ") + simulateReply(trimmed, model))
    prompt()
  }

  rl.close()
  console.log(chalk.gray("\nSession ended."))
}

export const chatCommand: CommandSetup = (program: Command) => {
  program
    .command("chat")
    .description("start an interactive chat session (REPL)")
    .option("-m, --model <model>", "AI model to use", "claude-3-5-sonnet")
    .option("-s, --system <prompt>", "system prompt to prepend")
    .option("-t, --temperature <n>", "sampling temperature 0–1", parseFloat, 0.7)
    .action(async (opts) => {
      const model = (MODELS.includes(opts.model as Model) ? opts.model : "claude-3-5-sonnet") as Model
      await runRepl(model, opts.system)
    })
}

