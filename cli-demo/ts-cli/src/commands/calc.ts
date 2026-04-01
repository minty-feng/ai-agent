// calc command — evaluate a math expression
//
// Demonstrates:
// • .argument() for a required positional (the expression string)
// • Typed error handling inside an action handler
// • JSON output mode via --output flag (same pattern as run.ts)
// • Safe expression evaluation: only digits, operators, parens — no arbitrary code

import chalk from "chalk"
import { Option } from "@commander-js/extra-typings"
import type { Command } from "@commander-js/extra-typings"
import type { CommandSetup } from "../core/cmd.js"
import { log } from "../core/logger.js"

/**
 * Evaluate a limited math expression safely.
 * Accepts: digits, +  -  *  /  **  %  ( )  .  spaces
 * Rejects anything else (letters, semicolons, backticks …)
 */
function evalMath(expr: string): number {
  // Each character must be in the safe set.  Note: `*` in the character class
  // covers both `*` (multiply) and `**` (exponentiation), since ** is just two
  // consecutive `*` characters and the regex validates character by character.
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) {
    throw new Error(`Unsafe expression — only numbers and operators (+ - * / % ** ( )) are allowed`)
  }
  // Function constructor limits scope to pure expression; "use strict" disables with
  // eslint-disable-next-line no-new-func
  const result = new Function(`"use strict"; return (${expr})`)()
  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error(`Expression did not produce a finite number: ${result}`)
  }
  return result
}

export const calcCommand: CommandSetup = (program: Command) => {
  program
    .command("calc")
    .description("evaluate a math expression  (e.g. \"3 * (2 + 4) / 1.5\")")
    .argument("<expr>", "math expression to evaluate")
    .addOption(
      new Option("-o, --output <format>", "output format")
        .choices(["text", "json"] as const)
        .default("text"),
    )
    .action((expr, opts) => {
      log.debug(`calc: expr="${expr}"`)
      let result: number
      try {
        result = evalMath(expr)
      } catch (err) {
        console.error(chalk.red("✖ ") + (err instanceof Error ? err.message : String(err)))
        process.exit(1)
      }

      if (opts.output === "json") {
        console.log(JSON.stringify({ expr, result }, null, 2))
      } else {
        console.log(chalk.bold.blue("= ") + chalk.yellow(String(result)))
      }
    })
}
