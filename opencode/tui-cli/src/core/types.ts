export type WorkerLike = {
  postMessage: (data: string) => void | null
  onmessage: ((event: { data: string }) => void) | null
  onerror?: ((event: unknown) => void) | null
}

export type Logger = {
  error: (message: unknown, extra?: Record<string, unknown>) => void
}

export type Ui = {
  error: (message: string) => void
}

export type EventSource = {
  on: (handler: (event: unknown) => void) => () => void
}

export type TuiArgs = {
  continue?: boolean
  sessionID?: string
  agent?: string
  model?: string
  prompt?: string
}

export type TuiAppInput = {
  url: string
  args: TuiArgs
  directory?: string
  fetch?: typeof fetch
  events?: EventSource
  onExit?: () => Promise<void>
}

export type TuiRunner = (input: TuiAppInput) => Promise<void>

export type NetworkOptions = {
  port: number
  hostname: string
  mdns: boolean
  cors: string[]
}

export type ResolvedNetworkOptions = NetworkOptions

export type TuiThreadArgs = NetworkOptions & {
  project?: string
  model?: string
  continue?: boolean
  session?: string
  prompt?: string
  agent?: string
}

export type AttachArgs = {
  url: string
  dir?: string
  session?: string
}

export type WorkerRpc = {
  fetch: (input: {
    url: string
    method: string
    headers: Record<string, string>
    body?: string
  }) => Promise<{ status: number; headers: Record<string, string>; body: string }>
  server: (input: ResolvedNetworkOptions) => Promise<{ url: string }>
  checkUpgrade: (input: { directory: string }) => Promise<void>
  reload: () => Promise<void>
  shutdown: () => Promise<void>
}

export type RpcClient<TRpc> = {
  call<Method extends keyof TRpc>(
    method: Method,
    input: Parameters<TRpc[Method]>[0],
  ): Promise<ReturnType<TRpc[Method]>>
  on<Data>(event: string, handler: (data: Data) => void): () => void
}
