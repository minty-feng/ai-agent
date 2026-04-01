// dice command — roll RPG-style dice with colorful ASCII-art display
//
// Demonstrates:
// • Multi-option command with defaults (--count, --sides)
// • Conditional ASCII art rendering based on die type
// • Color-coded output (green = high roll, yellow = mid, red = low)
// • Side-by-side ASCII art rendering for multiple dice
// • JSON output path for machine-readable results

import chalk from "chalk"
import { Option } from "@commander-js/extra-typings"
import type { Command } from "@commander-js/extra-typings"
import type { CommandSetup } from "../core/cmd.js"

// ── ASCII art for d6 faces ─────────────────────────────────────────────────
//  Each face is an array of 5 strings (lines).
const D6_FACES = {
  1: ["┌─────────┐", "│         │", "│    ●    │", "│         │", "└─────────┘"],
  2: ["┌─────────┐", "│ ●       │", "│         │", "│       ● │", "└─────────┘"],
  3: ["┌─────────┐", "│ ●       │", "│    ●    │", "│       ● │", "└─────────┘"],
  4: ["┌─────────┐", "│ ●     ● │", "│         │", "│ ●     ● │", "└─────────┘"],
  5: ["┌─────────┐", "│ ●     ● │", "│    ●    │", "│ ●     ● │", "└─────────┘"],
  6: ["┌─────────┐", "│ ●     ● │", "│ ●     ● │", "│ ●     ● │", "└─────────┘"],
} as const

// Unicode dice symbols ⚀–⚅ for compact inline display
const UNICODE_D6 = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const

// ── Color helpers ──────────────────────────────────────────────────────────
type ChalkFn = (text: string) => string

function rollColor(value: number, sides: number): ChalkFn {
  const ratio = value / sides
  if (ratio >= 0.8) return chalk.bold.green    // near-max: great roll
  if (ratio >= 0.4) return chalk.bold.yellow   // mid-range
  return chalk.bold.red                        // near-min: bad luck
}

function rollLabel(value: number, sides: number): string {
  const ratio = value / sides
  if (ratio >= 0.8) return chalk.green("★ Critical!")
  if (ratio <= 0.1) return chalk.red("☠ Fumble!")
  return ""
}

// ── d6 ASCII art side-by-side renderer ────────────────────────────────────
function renderD6Row(values: number[]): string {
  const faces = values.map((v) => D6_FACES[v as keyof typeof D6_FACES] ?? D6_FACES[1])
  const colored = values.map((v, i) => {
    const c = rollColor(v, 6)
    return faces[i]!.map((line, row) =>
      // Color pip lines (inner 3) differently from the border lines
      row === 0 || row === 4 ? chalk.gray(line) : c(line),
    )
  })
  // Interleave: concatenate line[i] from each face with a space gap
  return colored[0]!.map((_, row) => colored.map((face) => face[row]).join("  ")).join("\n")
}

// ── Non-d6 box renderer ────────────────────────────────────────────────────
function renderOtherDie(value: number, sides: number): string {
  const c = rollColor(value, sides)
  const numStr = String(value).padStart(2, " ")
  const label  = chalk.gray(`d${sides}`)
  return [
    chalk.gray("  ╭──────╮"),
    `  │ ${c(numStr.padEnd(4, " "))}│  ${label}`,
    chalk.gray("  ╰──────╯"),
  ].join("\n")
}

// ── Stat line ──────────────────────────────────────────────────────────────
function statsLine(rolls: number[], sides: number): string {
  const sum = rolls.reduce((a, b) => a + b, 0)
  const min = Math.min(...rolls)
  const max = Math.max(...rolls)
  const avg = (sum / rolls.length).toFixed(1)

  const parts = [
    `${chalk.gray("sum")} ${chalk.white.bold(String(sum))}`,
    `${chalk.gray("avg")} ${chalk.white(avg)}`,
    `${chalk.gray("min")} ${chalk.red(String(min))}`,
    `${chalk.gray("max")} ${chalk.green(String(max))}`,
  ]
  return `  ${parts.join("   ")}`
}

// ── Main command ───────────────────────────────────────────────────────────
export const diceCommand: CommandSetup = (program: Command) => {
  program
    .command("dice")
    .description("roll dice with colorful ASCII-art display")
    .option("-c, --count <n>", "number of dice to roll", (v) => parseInt(v, 10), 1)
    .option(
      "-s, --sides <n>",
      "sides per die  (4 / 6 / 8 / 10 / 12 / 20 / 100)",
      (v) => parseInt(v, 10),
      6,
    )
    .addOption(
      new Option("-o, --output <format>", "output format")
        .choices(["text", "json"] as const)
        .default("text"),
    )
    .action((opts) => {
      const count = Math.min(Math.max(opts.count, 1), 12)   // clamp 1–12
      const sides = Math.max(opts.sides, 2)

      // Roll!
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)

      if (opts.output === "json") {
        const sum = rolls.reduce((a, b) => a + b, 0)
        console.log(JSON.stringify({ sides, count, rolls, sum, min: Math.min(...rolls), max: Math.max(...rolls) }, null, 2))
        return
      }

      // ── Text output ────────────────────────────────────────────────────
      const dieLabel = chalk.bold.cyan(`d${sides}`)
      const countLabel = count > 1 ? chalk.gray(` × ${count}`) : ""
      console.log(`\n  🎲  ${dieLabel}${countLabel}\n`)

      if (sides === 6) {
        // Batch dice into rows of 4 for wide terminals
        for (let i = 0; i < rolls.length; i += 4) {
          const batch = rolls.slice(i, i + 4)
          console.log(renderD6Row(batch).replace(/^/gm, "  "))
          // Inline labels below each batch
          const labels = batch
            .map((v) => rollColor(v, 6)(`${UNICODE_D6[v - 1] ?? UNICODE_D6[0]!} ${String(v).padEnd(9)}`))
            .join("")
          console.log(`  ${labels}`)
          console.log()
        }
      } else {
        // Non-d6: render one box per die
        for (const [i, v] of rolls.entries()) {
          process.stdout.write(renderOtherDie(v, sides))
          const lbl = rollLabel(v, sides)
          process.stdout.write(lbl ? `  ${lbl}` : "")
          console.log()
        }
        console.log()
      }

      // Stats (only if more than 1 die)
      if (count > 1) {
        console.log(statsLine(rolls, sides))
        console.log()
      } else {
        // Single die: show label only
        const lbl = sides === 6 ? rollLabel(rolls[0]!, sides) : ""
        if (lbl) console.log(`  ${lbl}\n`)
      }
    })
}
