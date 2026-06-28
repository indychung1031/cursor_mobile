/** Runtime stats for /health (F1). */

let lastInjectError = null
let streamFrameCount = 0
let streamFps = 0
let streamFpsWindowStart = Date.now()
let activeStreamClients = 0

function recordInjectError(err) {
  lastInjectError = {
    message: String(err?.message || err || 'unknown'),
    at: new Date().toISOString(),
  }
}

function clearInjectError() {
  lastInjectError = null
}

function recordStreamFrame() {
  streamFrameCount += 1
  const now = Date.now()
  const elapsed = now - streamFpsWindowStart
  if (elapsed >= 1000) {
    streamFps = Math.round((streamFrameCount * 1000) / elapsed)
    streamFrameCount = 0
    streamFpsWindowStart = now
  }
}

function streamClientConnected() {
  activeStreamClients += 1
}

function streamClientDisconnected() {
  activeStreamClients = Math.max(0, activeStreamClients - 1)
}

function getStreamStats(targetFps) {
  return {
    targetFps,
    streamFps: streamFps || targetFps,
    activeClients: activeStreamClients,
  }
}

function getLastInjectError() {
  return lastInjectError
}

module.exports = {
  recordInjectError,
  clearInjectError,
  recordStreamFrame,
  streamClientConnected,
  streamClientDisconnected,
  getStreamStats,
  getLastInjectError,
}
