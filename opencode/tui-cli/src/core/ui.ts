export const UI = {
  error: (message: string) => {
    process.stderr.write(message + "\n")
  },
}
