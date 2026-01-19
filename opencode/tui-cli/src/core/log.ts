export const Log = {
  Default: {
    error: (message: unknown, extra?: Record<string, unknown>) => {
      if (extra) {
        console.error(message, extra)
        return
      }
      console.error(message)
    },
  },
}
