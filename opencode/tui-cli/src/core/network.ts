import type { CommandBuilder } from "./cmd"
import type { NetworkOptions, ResolvedNetworkOptions } from "./types"

const options = {
  port: {
    type: "number" as const,
    describe: "port to listen on",
    default: 0,
  },
  hostname: {
    type: "string" as const,
    describe: "hostname to listen on",
    default: "127.0.0.1",
  },
  mdns: {
    type: "boolean" as const,
    describe: "enable mDNS service discovery (defaults hostname to 0.0.0.0)",
    default: false,
  },
  cors: {
    type: "string" as const,
    array: true,
    describe: "additional domains to allow for CORS",
    default: [] as string[],
  },
}

export type NetworkConfig = Partial<NetworkOptions>

export function withNetworkOptions<T>(yargs: CommandBuilder): CommandBuilder {
  return yargs.options(options)
}

export async function resolveNetworkOptions(
  args: NetworkOptions,
  config: NetworkConfig = {},
  argv: string[] = process.argv,
): Promise<ResolvedNetworkOptions> {
  const portExplicitlySet = argv.includes("--port")
  const hostnameExplicitlySet = argv.includes("--hostname")
  const mdnsExplicitlySet = argv.includes("--mdns")
  const corsExplicitlySet = argv.includes("--cors")

  const mdns = mdnsExplicitlySet ? args.mdns : config.mdns ?? args.mdns
  const port = portExplicitlySet ? args.port : config.port ?? args.port
  const hostname = hostnameExplicitlySet
    ? args.hostname
    : mdns && !config.hostname
      ? "0.0.0.0"
      : config.hostname ?? args.hostname
  const configCors = config.cors ?? []
  const argsCors = Array.isArray(args.cors) ? args.cors : args.cors ? [args.cors] : []
  const cors = corsExplicitlySet ? argsCors : [...configCors, ...argsCors]

  return { hostname, port, mdns, cors }
}
