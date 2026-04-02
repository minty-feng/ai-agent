// sys command — print system / runtime information
//
// Demonstrates:
// • Node.js built-in `os` module (no extra deps)
// • Formatting tabular data with chalk column alignment
// • JSON output path for machine-readable pipelines

import os from "os"
import chalk from "chalk"
import { Option } from "@commander-js/extra-typings"
import type { Command } from "@commander-js/extra-typings"
import type { CommandSetup } from "../core/cmd.js"

const BYTES_PER_GB = 1024 ** 3
const BYTES_PER_MB = 1024 ** 2

function fmtBytes(bytes: number): string {
  const gb = bytes / BYTES_PER_GB
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / BYTES_PER_MB).toFixed(0)} MB`
}

function fmtUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(" ")
}

function gatherInfo() {
  const cpus = os.cpus()
  return {
    hostname:    os.hostname(),
    platform:    `${process.platform}/${process.arch}`,
    os_release:  os.release(),
    cpu_model:   cpus[0]?.model ?? "unknown",
    cpu_cores:   cpus.length,
    memory_total: fmtBytes(os.totalmem()),
    memory_free:  fmtBytes(os.freemem()),
    memory_used:  fmtBytes(os.totalmem() - os.freemem()),
    uptime:       fmtUptime(os.uptime()),
    node_version: process.version,
    pid:          process.pid,
  }
}

export const sysCommand: CommandSetup = (program: Command) => {
  program
    .command("sys")
    .description("print system and Node.js runtime information")
    .addOption(
      new Option("-o, --output <format>", "output format")
        .choices(["text", "json"] as const)
        .default("text"),
    )
    .action((opts) => {
      const info = gatherInfo()

      if (opts.output === "json") {
        console.log(JSON.stringify(info, null, 2))
        return
      }

      const label = (s: string) => chalk.gray(s.padEnd(16))
      const val   = (s: string | number) => chalk.white(String(s))

      console.log(chalk.bold.green("\n  System Information\n"))
      console.log(`  ${label("Hostname")}  ${val(info.hostname)}`)
      console.log(`  ${label("Platform")}  ${val(info.platform)}`)
      console.log(`  ${label("OS Release")}  ${val(info.os_release)}`)
      console.log(`  ${label("CPU")}  ${val(info.cpu_model)}`)
      console.log(`  ${label("CPU Cores")}  ${val(info.cpu_cores)}`)
      console.log(`  ${label("Memory")}  ${val(info.memory_used)} used / ${val(info.memory_total)} total  (${val(info.memory_free)} free)`)
      console.log(`  ${label("Uptime")}  ${val(info.uptime)}`)
      console.log(`  ${label("Node.js")}  ${val(info.node_version)}`)
      console.log(`  ${label("PID")}  ${val(info.pid)}`)
      console.log()
    })
}
