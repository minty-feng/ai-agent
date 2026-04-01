export type Logger = {
  info: (msg: string) => void
  error: (msg: string | unknown) => void
  debug: (msg: string) => void
}

export const log: Logger = {
  info: (msg) => process.stderr.write(`[info]  ${msg}\n`),
  error: (msg) => process.stderr.write(`[error] ${String(msg)}\n`),
  debug: (msg) => {
    if (process.env["DEBUG"]) process.stderr.write(`[debug] ${msg}\n`)
  },
}
