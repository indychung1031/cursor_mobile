/** Serialize inject/focus/scroll — one PowerShell inject at a time. */
let tail = Promise.resolve()

function withInjectLock(fn) {
  const run = tail.then(fn)
  tail = run.catch(() => {})
  return run
}

module.exports = { withInjectLock }
