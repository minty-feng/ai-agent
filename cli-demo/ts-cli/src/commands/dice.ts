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

// ── 3D Isometric dice pip layouts ──────────────────────────────────────────
// Each face value (1–6) maps to a 3×3 grid: true = pip present
type PipGrid = boolean[][]

const PIP_GRIDS: Record<number, PipGrid> = {
  1: [[false,false,false],[false,true,false],[false,false,false]],
  2: [[false,false,true],[false,false,false],[true,false,false]],
  3: [[false,false,true],[false,true,false],[true,false,false]],
  4: [[true,false,true],[false,false,false],[true,false,true]],
  5: [[true,false,true],[false,true,false],[true,false,true]],
  6: [[true,false,true],[true,false,true],[true,false,true]],
}

// Standard die orientations: given a top face, valid (front, right) pairs
const ORIENTATIONS_3D: Record<number, [number, number][]> = {
  1: [[2,3],[3,5],[5,4],[4,2]],
  2: [[1,3],[3,6],[6,4],[4,1]],
  3: [[1,5],[5,6],[6,2],[2,1]],
  4: [[1,2],[2,6],[6,5],[5,1]],
  5: [[1,4],[4,6],[6,3],[3,1]],
  6: [[2,4],[4,5],[5,3],[3,2]],
}

function get3DOrientation(top: number): { top: number; front: number; right: number } {
  const pairs = ORIENTATIONS_3D[top] ?? [[2, 3]]
  const [front, right] = pairs[Math.floor(Math.random() * pairs.length)]!
  return { top, front, right }
}

function pipRow(grid: PipGrid, row: number): string {
  return grid[row]!.map(p => p ? "●" : " ").join("   ")
}

function build3DDice(top: number, front: number, right: number): string[] {
  const tGrid = PIP_GRIDS[top] ?? PIP_GRIDS[1]!
  const fGrid = PIP_GRIDS[front] ?? PIP_GRIDS[1]!

  const tRows = [0, 1, 2].map(r => pipRow(tGrid, r))
  const fRows = [0, 1, 2].map(r => pipRow(fGrid, r))

  return [
    `         ╭─────────────╮`,
    `        ╱   ${tRows[0]}   ╱│`,
    `       ╱     ${tRows[1]}     ╱ │`,
    `      ╱   ${tRows[2]}   ╱  │`,
    `     ├─────────────┤   │`,
    `     │   ${fRows[0]}   │   │`,
    `     │             │  ╱`,
    `     │   ${fRows[1]}   │ ╱`,
    `     │             │╱`,
    `     │   ${fRows[2]}   │`,
    `     ╰─────────────╯`,
  ]
}

// Animated 3D dice roll — writes frames in-place using ANSI escape codes
async function animate3DDice(value: number): Promise<void> {
  const FRAMES = 14
  const lines = 13 // dice height + status line + blank
  const orientation = get3DOrientation(value)

  for (let frame = 0; frame < FRAMES; frame++) {
    // Random face during spin
    const randTop = Math.floor(Math.random() * 6) + 1
    const o = get3DOrientation(randTop)
    const dice = build3DDice(o.top, o.front, o.right)

    // Clear previous frame (move cursor up)
    if (frame > 0) {
      process.stdout.write(`\x1b[${lines}A`)
    }

    // Render spinning frame
    for (const line of dice) {
      console.log(chalk.cyan(line))
    }
    console.log()
    console.log(chalk.cyan.dim(`  🎲 掷骰子中...`))

    // Decelerate: progressively slower intervals
    const delay = 80 + frame * 25
    await new Promise(r => setTimeout(r, delay))
  }

  // Final frame: clear and show result
  process.stdout.write(`\x1b[${lines}A`)

  const finalDice = build3DDice(orientation.top, orientation.front, orientation.right)
  const color = value >= 5 ? chalk.bold.green : value >= 3 ? chalk.bold.yellow : chalk.bold.red

  for (const line of finalDice) {
    console.log(color(line))
  }
  console.log()
  const ratio = value / 6
  const tag = ratio >= 0.8 ? chalk.green(" ★ Critical!") : ratio <= 1/6 ? chalk.red(" ☠ Fumble!") : ""
  console.log(`  🎲 ${color(`结果: ${value}`)}  ${chalk.gray("(d6)")}${tag}`)
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
    .option("-t, --three-d", "show 3D animated dice roll  (d6 only)")
    .addOption(
      new Option("-o, --output <format>", "output format")
        .choices(["text", "json"] as const)
        .default("text"),
    )
    .action(async (opts) => {
      const count = Math.min(Math.max(opts.count, 1), 12)   // clamp 1–12
      const sides = Math.max(opts.sides, 2)

      // Roll!
      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)

      if (opts.output === "json") {
        const sum = rolls.reduce((a, b) => a + b, 0)
        console.log(JSON.stringify({ sides, count, rolls, sum, min: Math.min(...rolls), max: Math.max(...rolls) }, null, 2))
        return
      }

      // ── 3D mode ─────────────────────────────────────────────────────────
      if (opts.threeD && sides === 6) {
        for (const [i, v] of rolls.entries()) {
          if (count > 1) {
            console.log(chalk.gray(`\n  ── Die ${i + 1} of ${count} ──`))
          }
          console.log()
          await animate3DDice(v)
          console.log()
        }
        if (count > 1) {
          console.log(statsLine(rolls, sides))
          console.log()
        }
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
