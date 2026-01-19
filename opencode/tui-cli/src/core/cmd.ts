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
