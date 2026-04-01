// Shared type definitions for the CLI demo.
// Mirrors the separation in opencode/tui-cli/src/core/types.ts

export type ChatArgs = {
  model?: string
  system?: string
  temperature?: number
  stream?: boolean
}

export type RunArgs = {
  prompt: string
  model?: string
  output?: "text" | "json"
}

export type VersionArgs = Record<string, never>
