export function createLogger(logger = true) {
  const log = (msg: string) => {
    if (logger) {
      console.log(msg)
    }
  }
  return {
    log,
  }
}
