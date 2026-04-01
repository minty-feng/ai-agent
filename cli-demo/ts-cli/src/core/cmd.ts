// Core command builder — mirrors the opencode/tui-cli pattern
// (src/core/cmd.ts in opencode extracts yargs boilerplate so each command
// file only declares its name, describe, builder, and handler.)

export type CommandBuilder = {
  positional: (name: string, options: Record<string, unknown>) => CommandBuilder
  option: (name: string, options: Record<string, unknown>) => CommandBuilder
  options: (options: Record<string, unknown>) => CommandBuilder
}

type WithDoubleDash<T> = T & { "--"?: string[] }

export type CommandModule<TArgs> = {
  command: string
  describe: string
  builder?: (yargs: CommandBuilder) => CommandBuilder
  handler: (args: TArgs) => Promise<void> | void
}

export function cmd<TArgs>(input: CommandModule<WithDoubleDash<TArgs>>) {
  return input
}
