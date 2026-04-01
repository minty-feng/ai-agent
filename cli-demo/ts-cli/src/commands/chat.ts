// chat command — interactive REPL loop
// Demonstrates: readline-based REPL, piped stdin detection, colored prompts.

import readline from "readline"
import chalk from "chalk"
import { cmd } from "../core/cmd.js"
import { log } from "../core/logger.js"
import type { ChatArgs } from "../core/types.js"

const MODELS = ["gpt-4o", "claude-3-5-sonnet", "gemini-1.5-pro"] as const

function simulateReply(userInput: string, model: string): string {
  // Stub: in a real tool this calls the AI provider API.
  return `[${model}] Echo: "${userInput.trim()}" — (stub response, wire up your API key here)`
}

async function runRepl(model: string, systemPrompt: string | undefined) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: chalk.cyan("you> "),
  })

  console.log(chalk.bold.green("╔══════════════════════════════════╗"))
  console.log(chalk.bold.green("║   ts-cli-demo  ·  chat mode      ║"))
  console.log(chalk.bold.green("╚══════════════════════════════════╝"))
  console.log(chalk.gray(`Model: ${model}${systemPrompt ? `  ·  System: "${systemPrompt}"` : ""}`))
  console.log(chalk.gray("Type your message and press Enter. Type /exit or Ctrl-D to quit.\n"))

  rl.prompt()

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed) {
      rl.prompt()
      continue
    }
    if (trimmed === "/exit" || trimmed === "/quit") break
    if (trimmed === "/help") {
      console.log(chalk.yellow("Commands:  /exit  /quit  /help  /model"))
      rl.prompt()
      continue
    }
    if (trimmed === "/model") {
      console.log(chalk.yellow(`Current model: ${model}`))
      rl.prompt()
      continue
    }

    log.debug(`user input: ${trimmed}`)
    const reply = simulateReply(trimmed, model)
    console.log(chalk.bold.blue("ai> ") + reply)
    rl.prompt()
  }

  rl.close()
  console.log(chalk.gray("\nSession ended."))
}

export const chatCommand = cmd<ChatArgs>({
  command: "chat",
  describe: "start an interactive chat session (REPL)",
  builder: (yargs) =>
    yargs
      .option("model", {
        alias: "m",
        type: "string",
        describe: "AI model to use",
        default: "claude-3-5-sonnet",
        choices: MODELS,
      })
      .option("system", {
        alias: "s",
        type: "string",
        describe: "system prompt to prepend",
      })
      .option("temperature", {
        alias: "t",
        type: "number",
        describe: "sampling temperature (0–1)",
        default: 0.7,
      }),
  handler: async (args) => {
    await runRepl(args.model ?? "claude-3-5-sonnet", args.system)
  },
})
