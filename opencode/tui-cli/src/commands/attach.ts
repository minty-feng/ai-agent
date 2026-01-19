import { cmd } from "../core/cmd"
import type { AttachArgs, TuiRunner } from "../core/types"

export type AttachCommandDeps = {
  tui: TuiRunner
}

export function createAttachCommand(deps: AttachCommandDeps) {
  return cmd<AttachArgs>({
    command: "attach <url>",
    describe: "attach to a running opencode server",
    builder: (yargs) =>
      yargs
        .positional("url", {
          type: "string",
          describe: "http://localhost:4096",
          demandOption: true,
        })
        .option("dir", {
          type: "string",
          description: "directory to run in",
        })
        .option("session", {
          alias: ["s"],
          type: "string",
          describe: "session id to continue",
        }),
    handler: async (args) => {
      if (args.dir) process.chdir(args.dir)
      await deps.tui({
        url: args.url,
        args: { sessionID: args.session },
        directory: args.dir ? process.cwd() : undefined,
      })
    },
  })
}
