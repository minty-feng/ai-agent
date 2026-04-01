// palette command — demonstrate chalk's full color capabilities
//
// Demonstrates:
// • chalk named colors (foreground & background)
// • chalk text styles (bold, dim, italic, underline, strikethrough, inverse)
// • chalk.hex() for 24-bit color
// • Rainbow gradient text built from HSL color math

import chalk from "chalk"
import type { Command } from "@commander-js/extra-typings"
import type { CommandSetup } from "../core/cmd.js"

// ── HSL → hex (no external dep) ───────────────────────────────────────────
// Standard algorithm: https://www.w3.org/TR/css-color-4/#hsl-to-rgb
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, "0")
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

// Paint each character with an evenly-spaced hue along the spectrum
function rainbow(text: string, saturation = 100, lightness = 58): string {
  return [...text]
    .map((ch, i) => {
      const hue = Math.floor((i / Math.max(text.length - 1, 1)) * 360)
      return chalk.hex(hslToHex(hue, saturation, lightness))(ch)
    })
    .join("")
}

// Solid block character used as color swatch
const SWATCH = "  ██  "

// ── Named color palette ────────────────────────────────────────────────────
const NAMED_COLORS = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"] as const
type NamedColor = (typeof NAMED_COLORS)[number]

function fgRow(color: NamedColor): string {
  const c = chalk[color]
  const name = color.padEnd(10)
  return `  ${c(name)}  ${c("Hello, World!")}  ${c.bold("bold")}  ${c.dim("dim")}  ${c.underline("underline")}`
}

function bgRow(color: NamedColor): string {
  const bgKey = `bg${color[0]!.toUpperCase()}${color.slice(1)}` as `bg${Capitalize<NamedColor>}`
  const fg = color === "black" || color === "blue" ? chalk.white : chalk.black
  return `  ${fg[bgKey](` ${color.padEnd(10)} `)}`
}

// ── Bright variants ────────────────────────────────────────────────────────
const BRIGHT_COLORS = ["blackBright", "redBright", "greenBright", "yellowBright",
  "blueBright", "magentaBright", "cyanBright", "whiteBright"] as const
type BrightColor = (typeof BRIGHT_COLORS)[number]

function brightRow(color: BrightColor): string {
  const c = chalk[color]
  return `  ${c(color.padEnd(14))}  ${c("Hello, World!")}  ${c.bold("bold")}`
}

// ── Text styles ────────────────────────────────────────────────────────────
function stylesSection(): string {
  return [
    `  ${"Style".padEnd(18)}  Example`,
    `  ${"─".repeat(40)}`,
    `  ${"bold".padEnd(18)}  ${chalk.bold("The quick brown fox")}`,
    `  ${"dim".padEnd(18)}  ${chalk.dim("The quick brown fox")}`,
    `  ${"italic".padEnd(18)}  ${chalk.italic("The quick brown fox")}`,
    `  ${"underline".padEnd(18)}  ${chalk.underline("The quick brown fox")}`,
    `  ${"overline".padEnd(18)}  ${chalk.overline("The quick brown fox")}`,
    `  ${"strikethrough".padEnd(18)}  ${chalk.strikethrough("The quick brown fox")}`,
    `  ${"inverse".padEnd(18)}  ${chalk.inverse("The quick brown fox")}`,
    `  ${"bold + cyan".padEnd(18)}  ${chalk.bold.cyan("The quick brown fox")}`,
    `  ${"bold + magenta".padEnd(18)}  ${chalk.bold.magenta("The quick brown fox")}`,
    `  ${"italic + green".padEnd(18)}  ${chalk.italic.green("The quick brown fox")}`,
  ].join("\n")
}

// ── 256-color horizontal gradient ─────────────────────────────────────────
function gradientBar(width = 60): string {
  return Array.from({ length: width }, (_, i) => {
    const hue = Math.floor((i / width) * 360)
    return chalk.bgHex(hslToHex(hue, 100, 50))(" ")
  }).join("")
}

// ── Section header helper ──────────────────────────────────────────────────
function section(title: string): string {
  return `\n  ${chalk.bold.white(title)}\n  ${chalk.gray("─".repeat(title.length + 2))}\n`
}

// ── Main command ───────────────────────────────────────────────────────────
export const paletteCommand: CommandSetup = (program: Command) => {
  program
    .command("palette")
    .description("show the full chalk color palette and text styles")
    .action(() => {
      // ── Rainbow banner ─────────────────────────────────────────────────
      console.log()
      const banner = "  ✦  chalk color palette demo  ✦  "
      console.log(rainbow(banner))
      console.log()

      // ── Named foreground colors ────────────────────────────────────────
      console.log(section("Named Colors — Foreground"))
      for (const c of NAMED_COLORS) {
        console.log(fgRow(c))
      }

      // ── Named background colors ────────────────────────────────────────
      console.log(section("Named Colors — Background"))
      console.log("  " + NAMED_COLORS.map(bgRow).join(""))
      console.log()

      // ── Bright colors ──────────────────────────────────────────────────
      console.log(section("Bright / High-Intensity Colors"))
      for (const c of BRIGHT_COLORS) {
        console.log(brightRow(c))
      }

      // ── Text styles ────────────────────────────────────────────────────
      console.log(section("Text Styles"))
      console.log(stylesSection())

      // ── chalk.hex() 24-bit colors ──────────────────────────────────────
      console.log(section("24-bit Color  (chalk.hex / chalk.bgHex)"))
      console.log(`  ${"Color".padEnd(8)}  Hex       Sample`)
      console.log(`  ${"─".repeat(38)}`)
      const hexSamples = [
        ["coral",    "#FF6B6B"],
        ["peach",    "#FFA07A"],
        ["gold",     "#FFD700"],
        ["lime",     "#ADFF2F"],
        ["sky",      "#87CEEB"],
        ["lavender", "#E6E6FA"],
        ["mint",     "#98FF98"],
        ["salmon",   "#FA8072"],
      ] as const
      for (const [name, hex] of hexSamples) {
        console.log(`  ${name.padEnd(8)}  ${chalk.gray(hex)}  ${chalk.hex(hex)("████████  The quick brown fox")}`)
      }

      // ── Full-spectrum gradient bar ─────────────────────────────────────
      console.log(section("Full Spectrum Gradient"))
      console.log(`  ${gradientBar(64)}`)

      // ── Rainbow text ───────────────────────────────────────────────────
      console.log(section("Rainbow Text  (chalk.hex per character)"))
      const phrases = [
        "The quick brown fox jumps over the lazy dog",
        "0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "✦ ✧ ★ ☆ ♠ ♣ ♥ ♦ ☺ ☻ ← ↑ → ↓ ↔ ↕",
      ]
      for (const p of phrases) {
        console.log(`  ${rainbow(p)}`)
      }
      console.log()
    })
}
