import path from "path"
import { access } from "fs/promises"
import { cmd } from "../core/cmd"
import { Rpc } from "../core/rpc"
import { iife } from "../core/iife"
import { Log } from "../core/log"
import { UI } from "../core/ui"
import { resolveNetworkOptions, withNetworkOptions } from "../core/network"
import type {
  EventSource,
  Logger,
  NetworkOptions,
  ResolvedNetworkOptions,
  RpcClient,
  TuiRunner,
  TuiThreadArgs,
  Ui,
  WorkerLike,
  WorkerRpc,
} from "../core/types"

declare global {
  const OPENCODE_WORKER_PATH: string | undefined
}

type ThreadDeps = {
  tui: TuiRunner
  log?: Logger
  ui?: Ui
  withNetworkOptions?: <T>(yargs: any) => any
  resolveNetworkOptions?: (
    args: NetworkOptions,
    config?: Record<string, unknown>,
    argv?: string[],
  ) => Promise<ResolvedNetworkOptions>
  createWorker?: (path: string | URL, options: { env: Record<string, string> }) => WorkerLike
  fileExists?: (path: URL) => Promise<boolean>
}

type RpcClientInstance = RpcClient<WorkerRpc>

function createWorkerFetch(client: RpcClientInstance): typeof fetch {
  const fn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init)
    const body = request.body ? await request.text() : undefined
    const result = await client.call("fetch", {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
    })
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    })
  }
  return fn as typeof fetch
}

function createEventSource(client: RpcClientInstance): EventSource {
  return {
    on: (handler) => client.on("event", handler),
  }
}

async function readStdinText(): Promise<string | undefined> {
  if (process.stdin.isTTY) return undefined
  return new Promise((resolve, reject) => {
    let data = ""
    process.stdin.setEncoding("utf8")
    process.stdin.on("data", (chunk) => {
      data += chunk
    })
    process.stdin.on("end", () => resolve(data))
    process.stdin.on("error", reject)
  })
}

async function defaultFileExists(path: URL): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function defaultWorkerFactory(path: string | URL, options: { env: Record<string, string> }): WorkerLike {
  const WorkerCtor = (globalThis as any).Worker
  return new WorkerCtor(path, options)
}

export function createTuiThreadCommand(deps: ThreadDeps) {
  const log = deps.log ?? Log.Default
  const ui = deps.ui ?? UI
  const withNetwork = deps.withNetworkOptions ?? withNetworkOptions
  const resolveNetwork = deps.resolveNetworkOptions ?? resolveNetworkOptions
  const createWorker = deps.createWorker ?? defaultWorkerFactory
  const fileExists = deps.fileExists ?? defaultFileExists

  return cmd<TuiThreadArgs>({
    command: "$0 [project]",
    describe: "start opencode tui",
    builder: (yargs) =>
      withNetwork(yargs)
        .positional("project", {
          type: "string",
          describe: "path to start opencode in",
        })
        .option("model", {
          type: "string",
          alias: ["m"],
          describe: "model to use in the format of provider/model",
        })
        .option("continue", {
          alias: ["c"],
          describe: "continue the last session",
          type: "boolean",
        })
        .option("session", {
          alias: ["s"],
          type: "string",
          describe: "session id to continue",
        })
        .option("prompt", {
          type: "string",
          describe: "prompt to use",
        })
        .option("agent", {
          type: "string",
          describe: "agent to use",
        }),
    handler: async (args) => {
      const baseCwd = process.env.PWD ?? process.cwd()
      const cwd = args.project ? path.resolve(baseCwd, args.project) : process.cwd()
      const localWorker = new URL("./worker.ts", import.meta.url)
      const distWorker = new URL("./worker.js", import.meta.url)
      const workerPath = await iife(async () => {
        if (typeof OPENCODE_WORKER_PATH !== "undefined") return OPENCODE_WORKER_PATH
        if (await fileExists(distWorker)) return distWorker
        return localWorker
      })
      try {
        process.chdir(cwd)
      } catch {
        ui.error("Failed to change directory to " + cwd)
        return
      }

      const worker = createWorker(workerPath, {
        env: Object.fromEntries(
          Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
        ),
      })
      worker.onerror = (e) => {
        log.error(e)
      }
      const client = Rpc.client<WorkerRpc>(worker)
      process.on("uncaughtException", (e) => {
        log.error(e)
      })
      process.on("unhandledRejection", (e) => {
        log.error(e)
      })
      process.on("SIGUSR2", async () => {
        await client.call("reload", undefined)
      })

      const prompt = await iife(async () => {
        const piped = await readStdinText()
        if (!args.prompt) return piped
        return piped ? piped + "\n" + args.prompt : args.prompt
      })

      const networkOpts = await resolveNetwork(args)
      const shouldStartServer =
        process.argv.includes("--port") ||
        process.argv.includes("--hostname") ||
        process.argv.includes("--mdns") ||
        networkOpts.mdns ||
        networkOpts.port !== 0 ||
        networkOpts.hostname !== "127.0.0.1"

      let url: string
      let customFetch: typeof fetch | undefined
      let events: EventSource | undefined

      if (shouldStartServer) {
        const server = await client.call("server", networkOpts)
        url = server.url
      } else {
        url = "http://opencode.internal"
        customFetch = createWorkerFetch(client)
        events = createEventSource(client)
      }

      const tuiPromise = deps.tui({
        url,
        fetch: customFetch,
        events,
        args: {
          continue: args.continue,
          sessionID: args.session,
          agent: args.agent,
          model: args.model,
          prompt,
        },
        onExit: async () => {
          await client.call("shutdown", undefined)
        },
      })

      setTimeout(() => {
        client.call("checkUpgrade", { directory: cwd }).catch(() => {})
      }, 1000)

      await tuiPromise
    },
  })
}
