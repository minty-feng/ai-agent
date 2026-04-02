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

// Approximate token estimate: ~2 tokens per word (matches GPT-3/4 tokenization heuristic)
const TOKEN_MULTIPLIER = 2

// Stub: in a real tool this awaits an API call with streaming
function simulateReply(userInput: string, model: Model): string {
  return `[${model}] Echo: "${userInput.trim()}" — (stub; wire up your API key here)`
}

function printHelp(model: Model) {
  console.log(chalk.yellow("  Slash commands:"))
  console.log(chalk.yellow("    /help                — show this message"))
  console.log(chalk.yellow("    /exit  /quit         — end the session (also Ctrl-D)"))
  console.log(chalk.yellow("    /model               — show current model"))
  console.log(chalk.yellow(`    /model <name>        — switch model  (choices: ${MODELS.join(", ")})`))
  console.log(chalk.yellow("    /clear               — clear the terminal screen"))
  console.log(chalk.yellow("    /tokens              — show total token estimate so far"))
}

async function runRepl(initialModel: Model, systemPrompt: string | undefined) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })

  let model = initialModel
  let totalTokens = 0

  console.log(chalk.bold.green("╔══════════════════════════════════╗"))
  console.log(chalk.bold.green("║   ts-cli-demo  ·  chat mode      ║"))
  console.log(chalk.bold.green("╚══════════════════════════════════╝"))
  console.log(chalk.gray(`Model : ${model}${systemPrompt ? `  ·  System: "${systemPrompt}"` : ""}`))
  console.log(chalk.gray('Type a message and press Enter.  /help to list commands.  Ctrl-D to quit.\n'))

  const prompt = () => process.stdout.write(chalk.cyan("you> "))
  prompt()

  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed)                        { prompt(); continue }
    if (trimmed === "/exit" || trimmed === "/quit") break
    if (trimmed === "/help")             { printHelp(model); prompt(); continue }
    if (trimmed === "/clear")            { process.stdout.write("\x1Bc"); prompt(); continue }
    if (trimmed === "/tokens")           { console.log(chalk.yellow(`  tokens used (estimate): ${totalTokens}`)); prompt(); continue }
    if (trimmed === "/model") {
      console.log(chalk.yellow(`  current model: ${model}`))
      console.log(chalk.yellow(`  choices: ${MODELS.join(", ")}`))
      prompt()
      continue
    }
    if (trimmed.startsWith("/model ")) {
      const name = trimmed.slice("/model ".length).trim() as Model
      if (!MODELS.includes(name)) {
        console.log(chalk.red(`  Unknown model "${name}".  Choices: ${MODELS.join(", ")}`))
      } else {
        model = name
        console.log(chalk.green(`  ✔ Switched to ${model}`))
      }
      prompt()
      continue
    }
    if (trimmed.startsWith("/")) {
      console.log(chalk.red(`  Unknown command "${trimmed}".  Type /help to see available commands.`))
      prompt()
      continue
    }

    log.debug(`input: ${trimmed}`)
    const reply = simulateReply(trimmed, model)
    totalTokens += trimmed.split(/\s+/).length * TOKEN_MULTIPLIER
    console.log(chalk.bold.blue("ai>  ") + reply)
    prompt()
  }

  rl.close()
  console.log(chalk.gray(`\nSession ended.  Total tokens (estimate): ${totalTokens}`))
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

